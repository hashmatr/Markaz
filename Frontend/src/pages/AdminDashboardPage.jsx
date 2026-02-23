import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiDollarSign, FiShoppingBag, FiPackage, FiGrid, FiShoppingCart, FiUserCheck, FiCreditCard, FiTruck, FiCheckCircle, FiClock, FiXCircle, FiStar, FiTrendingUp, FiActivity, FiLayers, FiTrash2 } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { adminAPI, productAPI } from '../api';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusColors = {
    pending: { bg: '#fffbeb', color: '#d97706' }, confirmed: { bg: '#eff6ff', color: '#2563eb' }, processing: { bg: '#faf5ff', color: '#9333ea' },
    shipped: { bg: '#ecfdf5', color: '#059669' }, delivered: { bg: '#f0fdf4', color: '#16a34a' }, cancelled: { bg: '#fef2f2', color: '#dc2626' }, refunded: { bg: '#fdf2f8', color: '#db2777' },
};
const chartColors = { primary: '#000', primaryLight: 'rgba(0,0,0,0.08)', blue: '#3b82f6', blueLight: 'rgba(59,130,246,0.1)', green: '#10b981', greenLight: 'rgba(16,185,129,0.1)', purple: '#8b5cf6', purpleLight: 'rgba(139,92,246,0.1)', amber: '#f59e0b', red: '#ef4444', pink: '#ec4899' };
const doughnutPalette = ['#000', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

// ─── Stat Card ───────────────────────────────
function StatCard({ label, value, icon: Icon, bg, fg, sub }) {
    return (
        <div style={{ border: '1px solid #e5e5e5', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, backgroundColor: bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: fg }}><Icon size={20} /></div>
                {sub && <span style={{ fontSize: 11, fontWeight: 600, color: sub.startsWith('+') ? '#10b981' : sub.startsWith('-') ? '#ef4444' : '#737373', backgroundColor: sub.startsWith('+') ? '#f0fdf4' : sub.startsWith('-') ? '#fef2f2' : '#f5f5f5', padding: '3px 8px', borderRadius: 9999 }}>{sub}</span>}
            </div>
            <div><p style={{ fontSize: 26, fontWeight: 700 }}>{value}</p><p style={{ fontSize: 13, color: '#737373' }}>{label}</p></div>
        </div>
    );
}

// ─── Chart Card ──────────────────────────────
function ChartCard({ title, children, style: s }) {
    return (
        <div style={{ border: '1px solid #e5e5e5', borderRadius: 20, padding: 24, ...s }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 20, fontFamily: "'Satoshi',sans-serif" }}>{title}</h3>
            {children}
        </div>
    );
}

const chartOpts = (yPrefix = '') => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#000', titleFont: { size: 12 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 8, displayColors: false, callbacks: { label: ctx => `${yPrefix}${ctx.parsed.y}` } } },
    scales: { x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#a3a3a3' } }, y: { grid: { color: '#f5f5f5' }, ticks: { font: { size: 11 }, color: '#a3a3a3', callback: v => `${yPrefix}${v}` }, beginAtZero: true } },
});

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [charts, setCharts] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [recentReviews, setRecentReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('overview');
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    // Section-specific data
    const [sellers, setSellers] = useState([]);
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [fetchingData, setFetchingData] = useState(false);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [adminProducts, setAdminProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');

    useEffect(() => { const h = () => setIsDesktop(window.innerWidth >= 1024); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);

    useEffect(() => {
        adminAPI.getDashboard().then(r => {
            const d = r.data.data;
            setStats(d.stats);
            setCharts(d.charts);
            setRecentOrders(d.recentOrders || []);
            setRecentReviews(d.recentReviews || []);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (activeSection === 'overview') return;
        setFetchingData(true);
        const fetch = async () => {
            try {
                if (activeSection === 'sellers') { const r = await adminAPI.getAllSellers(); setSellers(r?.data?.data?.sellers || []); }
                else if (activeSection === 'users') { const r = await adminAPI.getUsers(); setUsers(r?.data?.data?.users || []); }
                else if (activeSection === 'orders') { const r = await adminAPI.getAllOrders(); setOrders(r?.data?.data?.orders || []); }
                else if (activeSection === 'products') { const r = await productAPI.getAll({ limit: 50 }); setAdminProducts(r?.data?.data?.products || []); }
            } catch (e) { console.error(e); }
            finally { setFetchingData(false); }
        };
        fetch();
    }, [activeSection]);

    const handleUpdateSellerStatus = async (id, status) => { try { await adminAPI.updateSellerStatus(id, { status }); toast.success(`Seller ${status}`); const r = await adminAPI.getAllSellers(); setSellers(r.data.data.sellers); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } };
    const handleUpdateOrderStatus = async (oid, ns) => { setUpdatingOrderId(oid); try { await adminAPI.updateOrderStatus(oid, { status: ns }); toast.success(`Order → ${ns}`); const r = await adminAPI.getAllOrders(); setOrders(r?.data?.data?.orders || []); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setUpdatingOrderId(null); } };
    const getNextStatuses = (s) => { const f = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']; const i = f.indexOf(s); if (i === -1 || i >= f.length - 1) return []; return [...f.slice(i + 1), 'cancelled']; };

    const handleDeleteSeller = async (sellerId, storeName) => {
        if (!window.confirm(`Delete seller "${storeName}"? This will remove their store, all products, and downgrade their account to Customer. This cannot be undone.`)) return;
        try {
            const res = await adminAPI.deleteSeller(sellerId);
            toast.success(res.data.message);
            const r = await adminAPI.getAllSellers();
            setSellers(r.data.data.sellers);
        } catch (e) { toast.error(e.response?.data?.message || 'Failed to delete seller'); }
    };

    const handleAdminDeleteProduct = async (productId, productTitle) => {
        if (!window.confirm(`Delete product "${productTitle}"? This action cannot be undone.`)) return;
        try {
            await productAPI.delete(productId);
            toast.success('Product deleted');
            const r = await productAPI.getAll({ limit: 50 });
            setAdminProducts(r?.data?.data?.products || []);
        } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    };

    if (!user || user.role !== 'ADMIN') return (
        <div className="container-main" style={{ paddingTop: 64, paddingBottom: 64, textAlign: 'center' }}>
            <h2 style={{ fontFamily: "'Integral CF',sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 16 }}>ACCESS DENIED</h2>
            <p style={{ color: '#737373', marginBottom: 24 }}>You need admin privileges.</p>
            <Link to="/" className="btn-primary">Go Home</Link>
        </div>
    );

    const sideItems = [
        { key: 'overview', icon: FiGrid, label: 'Overview' },
        { key: 'users', icon: FiUsers, label: 'Users' },
        { key: 'sellers', icon: FiUserCheck, label: 'Sellers' },
        { key: 'products', icon: FiPackage, label: 'Products' },
        { key: 'orders', icon: FiShoppingCart, label: 'Orders' },
    ];

    // ─── Build chart data ─────────────────────────
    const revenueChartData = charts?.monthlyRevenue ? {
        labels: charts.monthlyRevenue.map(m => MONTHS[m._id.month - 1]),
        datasets: [
            { label: 'Revenue', data: charts.monthlyRevenue.map(m => m.revenue), borderColor: chartColors.primary, backgroundColor: chartColors.primaryLight, fill: true, tension: .4, pointRadius: 4, pointBackgroundColor: '#000', borderWidth: 2 },
            { label: 'Commission', data: charts.monthlyRevenue.map(m => m.commission), borderColor: chartColors.blue, backgroundColor: chartColors.blueLight, fill: true, tension: .4, pointRadius: 4, pointBackgroundColor: chartColors.blue, borderWidth: 2 },
        ]
    } : null;

    const dailyOrdersData = charts?.dailyOrders ? {
        labels: charts.dailyOrders.map(d => { const dt = new Date(d._id); return dt.toLocaleDateString('en-US', { weekday: 'short' }); }),
        datasets: [{ label: 'Orders', data: charts.dailyOrders.map(d => d.count), backgroundColor: '#000', borderRadius: 8, barThickness: 24 }]
    } : null;

    const orderStatusData = charts?.orderStatusDist ? {
        labels: charts.orderStatusDist.map(s => s._id?.charAt(0).toUpperCase() + s._id?.slice(1)),
        datasets: [{ data: charts.orderStatusDist.map(s => s.count), backgroundColor: charts.orderStatusDist.map((_, i) => doughnutPalette[i % doughnutPalette.length]), borderWidth: 0, hoverOffset: 8 }]
    } : null;

    const categoryData = charts?.categoryDist ? {
        labels: charts.categoryDist.map(c => c.name),
        datasets: [{ data: charts.categoryDist.map(c => c.count), backgroundColor: charts.categoryDist.map((_, i) => doughnutPalette[i % doughnutPalette.length]), borderWidth: 0, hoverOffset: 8 }]
    } : null;

    const hourlyData = charts?.hourlyActivity ? {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [{ label: 'Activity', data: Array.from({ length: 24 }, (_, i) => { const h = charts.hourlyActivity.find(a => a._id === i); return h ? h.count : 0; }), backgroundColor: chartColors.blueLight, borderColor: chartColors.blue, fill: true, tension: .4, borderWidth: 2, pointRadius: 0 }]
    } : null;

    const dailyUsersData = charts?.dailyNewUsers ? {
        labels: charts.dailyNewUsers.map(d => { const dt = new Date(d._id); return dt.toLocaleDateString('en-US', { weekday: 'short' }); }),
        datasets: [{ label: 'New Users', data: charts.dailyNewUsers.map(d => d.count), backgroundColor: chartColors.green, borderRadius: 8, barThickness: 24 }]
    } : null;

    const rs = charts?.reviewStats;

    return (
        <div className="container-main" style={{ paddingTop: 24, paddingBottom: 48 }}>
            <h1 style={{ fontFamily: "'Integral CF',sans-serif", fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, marginBottom: 24 }}>ADMIN DASHBOARD</h1>

            <div style={{ display: 'flex', gap: 28, flexDirection: isDesktop ? 'row' : 'column' }}>
                {/* Sidebar */}
                {isDesktop && (
                    <aside style={{ width: 200, flexShrink: 0 }}>
                        <div style={{ border: '1px solid #e5e5e5', borderRadius: 20, padding: 12, position: 'sticky', top: 96 }}>
                            {sideItems.map(({ key, icon: Icon, label }) => (
                                <button key={key} onClick={() => setActiveSection(key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', marginBottom: 4, backgroundColor: activeSection === key ? '#000' : 'transparent', color: activeSection === key ? '#fff' : '#525252', transition: 'all 0.15s' }}>
                                    <Icon size={18} /> {label}
                                </button>
                            ))}
                        </div>
                    </aside>
                )}
                {!isDesktop && (
                    <div className="scrollbar-hide" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                        {sideItems.map(({ key, label }) => (
                            <button key={key} onClick={() => setActiveSection(key)} style={{ padding: '8px 16px', borderRadius: 9999, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', cursor: 'pointer', border: 'none', backgroundColor: activeSection === key ? '#000' : '#f0f0f0', color: activeSection === key ? '#fff' : '#000' }}>{label}</button>
                        ))}
                    </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>

                    {/* ═══════════ OVERVIEW ═══════════ */}
                    {activeSection === 'overview' && (
                        <>
                            {loading ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
                                    {Array.from({ length: 8 }, (_, i) => <div key={i} style={{ height: 120, backgroundColor: '#f0f0f0', borderRadius: 20, animation: 'pulse 1.5s infinite' }} />)}
                                </div>
                            ) : (
                                <>
                                    {/* Stats Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
                                        <StatCard label="Total Revenue" value={`$${(stats?.totalRevenue || 0).toLocaleString()}`} icon={FiDollarSign} bg="#fefce8" fg="#ca8a04" sub={stats?.todayRevenue > 0 ? `+$${stats.todayRevenue} today` : undefined} />
                                        <StatCard label="Total Orders" value={stats?.totalOrders || 0} icon={FiShoppingBag} bg="#faf5ff" fg="#9333ea" sub={stats?.newOrdersToday > 0 ? `+${stats.newOrdersToday} today` : undefined} />
                                        <StatCard label="Total Users" value={stats?.totalUsers || 0} icon={FiUsers} bg="#eff6ff" fg="#2563eb" sub={stats?.newUsersToday > 0 ? `+${stats.newUsersToday} today` : undefined} />
                                        <StatCard label="Active Sellers" value={stats?.activeSellers || 0} icon={FiUserCheck} bg="#f0fdf4" fg="#16a34a" sub={stats?.pendingSellers > 0 ? `${stats.pendingSellers} pending` : undefined} />
                                        <StatCard label="Products" value={stats?.totalProducts || 0} icon={FiPackage} bg="#eef2ff" fg="#4f46e5" />
                                        <StatCard label="Commission" value={`$${(stats?.totalCommission || 0).toLocaleString()}`} icon={FiCreditCard} bg="#fdf2f8" fg="#db2777" />
                                        <StatCard label="Reviews" value={stats?.totalReviews || 0} icon={FiStar} bg="#fffbeb" fg="#f59e0b" sub={rs?.averageRating ? `${rs.averageRating.toFixed(1)}★ avg` : undefined} />
                                        <StatCard label="Categories" value={stats?.totalCategories || 0} icon={FiLayers} bg="#f0fdf4" fg="#059669" />
                                    </div>

                                    {/* Charts Row 1 — Revenue + Daily Orders */}
                                    <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
                                        <ChartCard title="Revenue Trend (6 Months)">
                                            <div style={{ height: 260 }}>
                                                {revenueChartData?.labels?.length > 0 ? <Line data={revenueChartData} options={{ ...chartOpts('$'), plugins: { ...chartOpts('$').plugins, legend: { display: true, position: 'top', labels: { boxWidth: 10, font: { size: 11 } } } } }} /> : <p style={{ color: '#a3a3a3', textAlign: 'center', paddingTop: 80, fontSize: 14 }}>No revenue data yet</p>}
                                            </div>
                                        </ChartCard>
                                        <ChartCard title="Orders (Last 7 Days)">
                                            <div style={{ height: 260 }}>
                                                {dailyOrdersData?.labels?.length > 0 ? <Bar data={dailyOrdersData} options={chartOpts()} /> : <p style={{ color: '#a3a3a3', textAlign: 'center', paddingTop: 80, fontSize: 14 }}>No orders this week</p>}
                                            </div>
                                        </ChartCard>
                                    </div>

                                    {/* Charts Row 2 — Order Status + Category + Hourly */}
                                    <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
                                        <ChartCard title="Order Status">
                                            <div style={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                                                {orderStatusData?.labels?.length > 0 ? <Doughnut data={orderStatusData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, padding: 8 } }, tooltip: { backgroundColor: '#000', cornerRadius: 8 } } }} /> : <p style={{ color: '#a3a3a3', fontSize: 14, alignSelf: 'center' }}>No data</p>}
                                            </div>
                                        </ChartCard>
                                        <ChartCard title="Products by Category">
                                            <div style={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                                                {categoryData?.labels?.length > 0 ? <Doughnut data={categoryData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, padding: 8 } }, tooltip: { backgroundColor: '#000', cornerRadius: 8 } } }} /> : <p style={{ color: '#a3a3a3', fontSize: 14, alignSelf: 'center' }}>No data</p>}
                                            </div>
                                        </ChartCard>
                                        <ChartCard title="Activity (24h)">
                                            <div style={{ height: 200 }}>
                                                {hourlyData ? <Line data={hourlyData} options={{ ...chartOpts(), scales: { ...chartOpts().scales, x: { ...chartOpts().scales.x, ticks: { ...chartOpts().scales.x.ticks, maxTicksLimit: 6 } } } }} /> : <p style={{ color: '#a3a3a3', fontSize: 14, textAlign: 'center', paddingTop: 60 }}>No data</p>}
                                            </div>
                                        </ChartCard>
                                    </div>

                                    {/* Charts Row 3 — New Users + Review Breakdown */}
                                    <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
                                        <ChartCard title="New Users (Last 7 Days)">
                                            <div style={{ height: 220 }}>
                                                {dailyUsersData?.labels?.length > 0 ? <Bar data={dailyUsersData} options={chartOpts()} /> : <p style={{ color: '#a3a3a3', textAlign: 'center', paddingTop: 60, fontSize: 14 }}>No new users this week</p>}
                                            </div>
                                        </ChartCard>
                                        <ChartCard title="Customer Reviews">
                                            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                                                <div style={{ textAlign: 'center', minWidth: 100 }}>
                                                    <p style={{ fontSize: 48, fontWeight: 700, lineHeight: 1 }}>{rs?.averageRating?.toFixed(1) || '0.0'}</p>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, margin: '8px 0' }}>
                                                        {[1, 2, 3, 4, 5].map(i => <FaStar key={i} size={16} style={{ color: i <= Math.round(rs?.averageRating || 0) ? '#fbbf24' : '#e5e5e5' }} />)}
                                                    </div>
                                                    <p style={{ fontSize: 12, color: '#737373' }}>{rs?.totalReviews || 0} reviews</p>
                                                </div>
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {[{ l: '5★', v: rs?.fiveStar || 0, c: '#000' }, { l: '4★', v: rs?.fourStar || 0, c: '#3b82f6' }, { l: '3★', v: rs?.threeStar || 0, c: '#f59e0b' }, { l: '2★', v: rs?.twoStar || 0, c: '#f97316' }, { l: '1★', v: rs?.oneStar || 0, c: '#ef4444' }].map(({ l, v, c }) => (
                                                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ fontSize: 12, fontWeight: 600, width: 24 }}>{l}</span>
                                                            <div style={{ flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', backgroundColor: c, borderRadius: 4, width: `${rs?.totalReviews ? (v / rs.totalReviews) * 100 : 0}%`, transition: 'width 0.5s' }} />
                                                            </div>
                                                            <span style={{ fontSize: 11, color: '#737373', width: 24, textAlign: 'right' }}>{v}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </ChartCard>
                                    </div>

                                    {/* Top Products + Recent Reviews */}
                                    <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
                                        <ChartCard title="Top Selling Products">
                                            {charts?.topProducts?.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    {charts.topProducts.map((tp, i) => (
                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: 12 }}>
                                                            <span style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                                                            <img src={tp.product?.images?.[0]?.url || 'https://placehold.co/40x40/f0f0f0/999?text=P'} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tp.product?.title || 'Product'}</p>
                                                                <p style={{ fontSize: 11, color: '#737373' }}>{tp.totalSold} sold • ${tp.totalRevenue?.toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p style={{ color: '#a3a3a3', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>No sales data yet</p>}
                                        </ChartCard>
                                        <ChartCard title="Recent Reviews">
                                            {recentReviews.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    {recentReviews.map((rv, i) => (
                                                        <div key={i} style={{ padding: '10px 12px', backgroundColor: '#f9f9f9', borderRadius: 12 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                                <span style={{ fontSize: 13, fontWeight: 600 }}>{rv.user?.fullName || 'User'}</span>
                                                                <div style={{ display: 'flex', gap: 2 }}>{Array.from({ length: rv.rating }, (_, j) => <FaStar key={j} size={12} style={{ color: '#fbbf24' }} />)}</div>
                                                            </div>
                                                            <p style={{ fontSize: 12, color: '#525252', lineHeight: 1.4 }}>"{rv.comment?.slice(0, 80)}{rv.comment?.length > 80 ? '...' : ''}"</p>
                                                            <p style={{ fontSize: 11, color: '#a3a3a3', marginTop: 4 }}>{rv.product?.title?.slice(0, 30)} • {new Date(rv.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p style={{ color: '#a3a3a3', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>No reviews yet</p>}
                                        </ChartCard>
                                    </div>

                                    {/* Recent Orders Table */}
                                    <ChartCard title="Recent Orders">
                                        {recentOrders.length > 0 ? (
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                                    <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
                                                        <th style={{ padding: 10 }}>Order</th><th style={{ padding: 10 }}>Customer</th><th style={{ padding: 10 }}>Amount</th><th style={{ padding: 10 }}>Status</th><th style={{ padding: 10 }}>Date</th>
                                                    </tr></thead>
                                                    <tbody>{recentOrders.slice(0, 8).map(o => {
                                                        const sc = statusColors[o.orderStatus] || statusColors.pending;
                                                        return (
                                                            <tr key={o._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                                <td style={{ padding: 10, fontWeight: 600 }}>#{o._id?.slice(-6).toUpperCase()}</td>
                                                                <td style={{ padding: 10 }}>{o.user?.fullName || '—'}</td>
                                                                <td style={{ padding: 10, fontWeight: 600 }}>${o.totalDiscountedPrice || o.totalPrice}</td>
                                                                <td style={{ padding: 10 }}><span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600, backgroundColor: sc.bg, color: sc.color, textTransform: 'capitalize' }}>{o.orderStatus}</span></td>
                                                                <td style={{ padding: 10, color: '#737373' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                                                            </tr>
                                                        );
                                                    })}</tbody>
                                                </table>
                                            </div>
                                        ) : <p style={{ color: '#a3a3a3', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>No orders yet</p>}
                                    </ChartCard>
                                </>
                            )}
                        </>
                    )}

                    {/* ═══════════ ORDERS SECTION ═══════════ */}
                    {activeSection === 'orders' && (
                        <div style={{ border: '1px solid #e5e5e5', borderRadius: 20, overflow: 'hidden' }}>
                            <div style={{ padding: 20, borderBottom: '1px solid #e5e5e5', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                <h3 style={{ fontWeight: 700, fontSize: 18 }}>Order Management</h3>
                                <p style={{ fontSize: 13, color: '#737373' }}>{orders.length} orders</p>
                            </div>
                            <div style={{ padding: 20 }}>
                                {fetchingData ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1, 2, 3].map(i => <div key={i} style={{ height: 60, backgroundColor: '#f0f0f0', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />)}</div>
                                    : orders.length === 0 ? <p style={{ textAlign: 'center', padding: '32px 0', color: '#737373' }}>No orders</p>
                                        : <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            {orders.map(order => {
                                                const sc = statusColors[order.orderStatus] || statusColors.pending;
                                                const ns = getNextStatuses(order.orderStatus);
                                                return (
                                                    <div key={order._id} style={{ border: '1px solid #e5e5e5', borderRadius: 16, padding: 20 }}>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                                                            <div>
                                                                <p style={{ fontSize: 12, color: '#a3a3a3' }}>#{order._id?.slice(-8).toUpperCase()}</p>
                                                                <p style={{ fontWeight: 700, fontSize: 16 }}>${order.totalDiscountedPrice || order.totalPrice}</p>
                                                                <p style={{ fontSize: 12, color: '#737373' }}>{order.user?.fullName || 'Customer'} • {new Date(order.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                            <span style={{ padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 600, backgroundColor: sc.bg, color: sc.color, textTransform: 'capitalize', height: 'fit-content' }}>{order.orderStatus}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 4, height: 4, marginBottom: 12 }}>
                                                            {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                                                                const m = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4 };
                                                                return <div key={step} style={{ flex: 1, borderRadius: 2, backgroundColor: order.orderStatus === 'cancelled' ? '#fca5a5' : idx <= (m[order.orderStatus] ?? -1) ? '#000' : '#e5e5e5' }} />;
                                                            })}
                                                        </div>
                                                        {ns.length > 0 && (
                                                            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                                                                <p style={{ fontSize: 12, color: '#737373', marginBottom: 8 }}>Update:</p>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                                    {ns.map(s => (
                                                                        <button key={s} onClick={() => handleUpdateOrderStatus(order._id, s)} disabled={updatingOrderId === order._id}
                                                                            style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: updatingOrderId === order._id ? 'wait' : 'pointer', border: s === 'cancelled' ? '1px solid #dc2626' : '1px solid #000', backgroundColor: s === 'cancelled' ? '#fef2f2' : '#000', color: s === 'cancelled' ? '#dc2626' : '#fff', opacity: updatingOrderId === order._id ? .5 : 1, textTransform: 'capitalize' }}>
                                                                            → {s}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                }
                            </div>
                        </div>
                    )}

                    {/* ═══════════ USERS SECTION ═══════════ */}
                    {activeSection === 'users' && (
                        <div style={{ border: '1px solid #e5e5e5', borderRadius: 20, overflow: 'hidden' }}>
                            <div style={{ padding: 20, borderBottom: '1px solid #e5e5e5', backgroundColor: '#fafafa' }}><h3 style={{ fontWeight: 700, fontSize: 18 }}>User Management</h3></div>
                            <div style={{ padding: 20 }}>
                                {fetchingData ? <p>Loading...</p> : users.length === 0 ? <p>No users</p> : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                            <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Email</th><th style={{ padding: 12 }}>Role</th><th style={{ padding: 12 }}>Joined</th></tr></thead>
                                            <tbody>{users.map(u => (
                                                <tr key={u._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                    <td style={{ padding: 12, fontWeight: 600 }}>{u.fullName}</td>
                                                    <td style={{ padding: 12 }}>{u.email}</td>
                                                    <td style={{ padding: 12 }}><span style={{ padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500, backgroundColor: u.role === 'ADMIN' ? '#faf5ff' : '#f0fdf4', color: u.role === 'ADMIN' ? '#9333ea' : '#16a34a' }}>{u.role}</span></td>
                                                    <td style={{ padding: 12, color: '#737373', fontSize: 13 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}</tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══════════ SELLERS SECTION ═══════════ */}
                    {activeSection === 'sellers' && (
                        <div style={{ border: '1px solid #e5e5e5', borderRadius: 20, overflow: 'hidden' }}>
                            <div style={{ padding: 20, borderBottom: '1px solid #e5e5e5', backgroundColor: '#fafafa' }}><h3 style={{ fontWeight: 700, fontSize: 18 }}>Seller Management</h3></div>
                            <div style={{ padding: 20 }}>
                                {fetchingData ? <p>Loading...</p> : sellers.length === 0 ? <p>No sellers</p> : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                            <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}><th style={{ padding: 12 }}>Store</th><th style={{ padding: 12 }}>Email</th><th style={{ padding: 12 }}>Status</th><th style={{ padding: 12 }}>Actions</th></tr></thead>
                                            <tbody>{sellers.map(s => (
                                                <tr key={s._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                    <td style={{ padding: 12 }}><div style={{ fontWeight: 600 }}>{s.storeName}</div><div style={{ fontSize: 12, color: '#737373' }}>{s.user?.fullName}</div></td>
                                                    <td style={{ padding: 12 }}>{s.businessEmail}</td>
                                                    <td style={{ padding: 12 }}><span style={{ padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500, backgroundColor: s.accountStatus === 'active' ? '#f0fdf4' : s.accountStatus === 'pending' ? '#fffbeb' : '#fef2f2', color: s.accountStatus === 'active' ? '#16a34a' : s.accountStatus === 'pending' ? '#d97706' : '#dc2626', textTransform: 'capitalize' }}>{s.accountStatus}</span></td>
                                                    <td style={{ padding: 12 }}>
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            {s.accountStatus === 'pending' && <><button onClick={() => handleUpdateSellerStatus(s._id, 'active')} style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>Approve</button><button onClick={() => handleUpdateSellerStatus(s._id, 'rejected')} style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #dc2626', cursor: 'pointer', fontSize: 12 }}>Reject</button></>}
                                                            {s.accountStatus === 'active' && <button onClick={() => handleUpdateSellerStatus(s._id, 'suspended')} style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #dc2626', cursor: 'pointer', fontSize: 12 }}>Suspend</button>}
                                                            {s.accountStatus === 'suspended' && <button onClick={() => handleUpdateSellerStatus(s._id, 'active')} style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>Reactivate</button>}
                                                            <button onClick={() => handleDeleteSeller(s._id, s.storeName)} style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><FiTrash2 size={12} /> Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}</tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══════════ PRODUCTS SECTION ═══════════ */}
                    {activeSection === 'products' && (
                        <div style={{ border: '1px solid #e5e5e5', borderRadius: 20, overflow: 'hidden' }}>
                            <div style={{ padding: 20, borderBottom: '1px solid #e5e5e5', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                <h3 style={{ fontWeight: 700, fontSize: 18 }}>Product Management</h3>
                                <input type="text" placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #e5e5e5', fontSize: 13, outline: 'none', width: 'clamp(150px,20vw,300px)' }} />
                            </div>
                            <div style={{ padding: 20 }}>
                                {fetchingData ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1, 2, 3].map(i => <div key={i} style={{ height: 60, backgroundColor: '#f0f0f0', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />)}</div>
                                    : adminProducts.length === 0 ? <p style={{ textAlign: 'center', padding: '32px 0', color: '#737373' }}>No products</p>
                                        : (
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                                    <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}><th style={{ padding: 12 }}>Product</th><th style={{ padding: 12 }}>Seller</th><th style={{ padding: 12 }}>Price</th><th style={{ padding: 12 }}>Stock</th><th style={{ padding: 12 }}>Actions</th></tr></thead>
                                                    <tbody>{adminProducts.filter(p => !productSearch || p.title?.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                                        <tr key={p._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                            <td style={{ padding: 12 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                    <img src={p.images?.[0]?.url || 'https://placehold.co/40x40/f0f0f0/999?text=P'} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                                                    <div style={{ minWidth: 0 }}>
                                                                        <p style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{p.title}</p>
                                                                        <p style={{ fontSize: 11, color: '#a3a3a3' }}>{p.brand || '\u2014'}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: 12, fontSize: 13 }}>{p.seller?.storeName || '\u2014'}</td>
                                                            <td style={{ padding: 12, fontWeight: 600 }}>${p.discountedPrice || p.price}</td>
                                                            <td style={{ padding: 12 }}><span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600, backgroundColor: p.quantity > 0 ? '#f0fdf4' : '#fef2f2', color: p.quantity > 0 ? '#16a34a' : '#dc2626' }}>{p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'}</span></td>
                                                            <td style={{ padding: 12 }}>
                                                                <button onClick={() => handleAdminDeleteProduct(p._id, p.title)} style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><FiTrash2 size={12} /> Delete</button>
                                                            </td>
                                                        </tr>
                                                    ))}</tbody>
                                                </table>
                                            </div>
                                        )
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
