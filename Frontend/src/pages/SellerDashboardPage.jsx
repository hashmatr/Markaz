import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiPackage, FiDollarSign, FiShoppingBag, FiStar, FiPlus, FiTrendingUp, FiFilter, FiChevronDown, FiChevronUp, FiX, FiClock, FiEdit, FiTrash2 } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { sellerAPI, productAPI, orderAPI, categoryAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/ui/Breadcrumb';
import ProductCard from '../components/product/ProductCard';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const doughnutPalette = ['#000', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const statusColors = { pending: { bg: '#fffbeb', color: '#d97706' }, confirmed: { bg: '#eff6ff', color: '#2563eb' }, processing: { bg: '#faf5ff', color: '#9333ea' }, shipped: { bg: '#ecfdf5', color: '#059669' }, delivered: { bg: '#f0fdf4', color: '#16a34a' }, cancelled: { bg: '#fef2f2', color: '#dc2626' } };
const colorSwatches = ['#ff0000', '#00c12b', '#0000ff', '#ff8800', '#00aaff', '#800080', '#ff69b4', '#ffc0cb', '#ff6347', '#000'];
const sortOptions = [{ value: 'popular', label: 'Most Popular' }, { value: 'newest', label: 'Newest' }, { value: 'price_asc', label: 'Price: Low → High' }, { value: 'price_desc', label: 'Price: High → Low' }, { value: 'rating', label: 'Top Rated' }];

const chartOpts = (pfx = '') => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#000', titleFont: { size: 12 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 8, displayColors: false, callbacks: { label: c => `${pfx}${c.parsed.y}` } } },
    scales: { x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#a3a3a3' } }, y: { grid: { color: '#f5f5f5' }, ticks: { font: { size: 11 }, color: '#a3a3a3', callback: v => `${pfx}${v}` }, beginAtZero: true } },
});

function StatCard({ label, value, icon: Icon, bg, fg, sub }) {
    return (
        <div style={{ border: '1px solid #e5e5e5', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, backgroundColor: bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: fg }}><Icon size={20} /></div>
                {sub && <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', backgroundColor: '#f0fdf4', padding: '3px 8px', borderRadius: 9999 }}>{sub}</span>}
            </div>
            <div><p style={{ fontSize: 26, fontWeight: 700 }}>{value}</p><p style={{ fontSize: 13, color: '#737373' }}>{label}</p></div>
        </div>
    );
}
function ChartCard({ title, children }) {
    return (
        <div style={{ border: '1px solid #e5e5e5', borderRadius: 20, padding: 24 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 20, fontFamily: "'Satoshi',sans-serif" }}>{title}</h3>
            {children}
        </div>
    );
}

export default function SellerDashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [dashboard, setDashboard] = useState(null);
    const [charts, setCharts] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [sellerOrders, setSellerOrders] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalProducts: 0 });
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [priceRange, setPriceRange] = useState([0, 500]);
    const [expandedFilters, setExpandedFilters] = useState({ categories: true, price: true, colors: true, sort: true });
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    const currentSort = searchParams.get('sort') || 'newest';
    const currentSearch = searchParams.get('search') || '';
    const currentPage = parseInt(searchParams.get('page') || '1');
    const currentCategory = searchParams.get('category') || '';
    const currentMinPrice = searchParams.get('minPrice') || '';
    const currentMaxPrice = searchParams.get('maxPrice') || '';
    const currentColor = searchParams.get('color') || '';

    useEffect(() => { const h = () => setIsDesktop(window.innerWidth >= 1024); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            sellerAPI.getDashboard().catch(() => ({ data: { data: { dashboard: null } } })),
            orderAPI.getSellerOrders({ limit: 10 }).catch(() => ({ data: { data: { orders: [] } } })),
            categoryAPI.getAll().catch(() => ({ data: { data: { categories: [] } } })),
        ]).then(([d, o, c]) => {
            const db = d.data.data.dashboard;
            setDashboard(db);
            setCharts(db?.charts || null);
            setRecentOrders(db?.recentOrders || []);
            setSellerOrders(o.data.data.orders || []);
            setCategories(c.data.data.categories || []);
        }).finally(() => setLoading(false));
    }, []);

    useEffect(() => { if (activeTab === 'products') fetchProducts(); }, [activeTab, currentSort, currentSearch, currentPage, currentCategory, currentMinPrice, currentMaxPrice, currentColor]);

    const fetchProducts = async () => {
        setProductsLoading(true);
        try {
            const res = await productAPI.getMyProducts({ sort: currentSort, page: currentPage, limit: 10, search: currentSearch, category: currentCategory, minPrice: currentMinPrice, maxPrice: currentMaxPrice, color: currentColor });
            setProducts(res.data.data.products || []);
            setPagination(res.data.data.pagination);
        } catch { setProducts([]); }
        finally { setProductsLoading(false); }
    };

    const handleSortChange = v => { const p = new URLSearchParams(searchParams); p.set('sort', v); p.set('page', '1'); setSearchParams(p); };
    const handlePageChange = pg => { const p = new URLSearchParams(searchParams); p.set('page', pg.toString()); setSearchParams(p); };
    const toggleFilter = k => setExpandedFilters(prev => ({ ...prev, [k]: !prev[k] }));

    const handleDeleteProduct = async (productId, productTitle) => {
        if (!window.confirm(`Are you sure you want to delete "${productTitle}"? This action cannot be undone.`)) return;
        try {
            await productAPI.delete(productId);
            toast.success('Product deleted successfully');
            fetchProducts();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete product');
        }
    };

    const FilterSection = ({ title, filterKey, children }) => (
        <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 16, marginBottom: 16 }}>
            <button onClick={() => toggleFilter(filterKey)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontWeight: 600, fontSize: 14, marginBottom: expandedFilters[filterKey] ? 12 : 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                {title}{expandedFilters[filterKey] ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>
            {expandedFilters[filterKey] && children}
        </div>
    );

    // Chart data builders
    const earningsChartData = charts?.monthlyEarnings ? {
        labels: charts.monthlyEarnings.map(m => MONTHS[m._id.month - 1]),
        datasets: [{ label: 'Earnings', data: charts.monthlyEarnings.map(m => m.revenue), borderColor: '#000', backgroundColor: 'rgba(0,0,0,0.06)', fill: true, tension: .4, pointRadius: 4, pointBackgroundColor: '#000', borderWidth: 2 }]
    } : null;

    const dailyOrdersData = charts?.dailyOrders ? {
        labels: charts.dailyOrders.map(d => { const dt = new Date(d._id); return dt.toLocaleDateString('en-US', { weekday: 'short' }); }),
        datasets: [{ label: 'Orders', data: charts.dailyOrders.map(d => d.count), backgroundColor: '#000', borderRadius: 8, barThickness: 24 }]
    } : null;

    const orderStatusData = charts?.orderStatusDist ? {
        labels: charts.orderStatusDist.map(s => s._id?.charAt(0).toUpperCase() + s._id?.slice(1)),
        datasets: [{ data: charts.orderStatusDist.map(s => s.count), backgroundColor: charts.orderStatusDist.map((_, i) => doughnutPalette[i % doughnutPalette.length]), borderWidth: 0, hoverOffset: 8 }]
    } : null;

    const rs = charts?.reviewStats;

    if (!user || user.role !== 'SELLER') return (
        <div className="container-main" style={{ paddingTop: 64, paddingBottom: 64, textAlign: 'center' }}>
            <h2 style={{ fontFamily: "'Integral CF',sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 16 }}>SELLER DASHBOARD</h2>
            <p style={{ color: '#737373', marginBottom: 24 }}>You need to be a registered seller to access this page.</p>
            <Link to="/become-seller" className="btn-primary">Become a Seller</Link>
        </div>
    );

    return (
        <div className="container-main" style={{ paddingTop: 24, paddingBottom: 48 }}>
            <Breadcrumb items={[{ label: 'Seller Dashboard' }]} />
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, gap: 16 }}>
                <div>
                    <h1 style={{ fontFamily: "'Integral CF',sans-serif", fontSize: 'clamp(24px,3vw,32px)', fontWeight: 700 }}>SELLER DASHBOARD</h1>
                    <p style={{ fontSize: 13, color: '#737373', marginTop: 4 }}>{dashboard?.storeName || 'Your Store'}</p>
                </div>
                {dashboard?.accountStatus === 'active' && (
                    <Link to="/seller/add-product" className="btn-primary" style={{ padding: '12px 24px', fontSize: 14 }}><FiPlus size={16} /> Add Product</Link>
                )}
            </div>

            {dashboard && dashboard.accountStatus !== 'active' && (
                <div style={{ backgroundColor: dashboard.accountStatus === 'pending' ? '#fffbeb' : '#fef2f2', border: `1px solid ${dashboard.accountStatus === 'pending' ? '#fde68a' : '#fecaca'}`, padding: 20, borderRadius: 16, marginBottom: 32, textAlign: 'center' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Account {dashboard.accountStatus}</h3>
                    <p style={{ fontSize: 14, color: '#525252' }}>
                        {dashboard.accountStatus === 'pending' && "Your seller application is currently under review. You'll be able to add products once approved."}
                        {dashboard.accountStatus === 'rejected' && "Your application was rejected. Please contact support."}
                        {dashboard.accountStatus === 'suspended' && "Your store has been suspended due to policy violations."}
                    </p>
                </div>
            )}

            <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid #e5e5e5', marginBottom: 24, overflowX: 'auto' }}>
                {['overview', 'products', 'orders'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ paddingBottom: 12, fontSize: 14, fontWeight: 500, textTransform: 'capitalize', cursor: 'pointer', border: 'none', background: 'none', borderBottom: activeTab === tab ? '2px solid #000' : '2px solid transparent', color: activeTab === tab ? '#000' : '#a3a3a3', whiteSpace: 'nowrap' }}>{tab}</button>
                ))}
            </div>

            {/* ═══════════ OVERVIEW TAB ═══════════ */}
            {activeTab === 'overview' && (
                <>
                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
                            {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 120, backgroundColor: '#f0f0f0', borderRadius: 20, animation: 'pulse 1.5s infinite' }} />)}
                        </div>
                    ) : dashboard?.accountStatus === 'active' ? (
                        <>
                            {/* Stat cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
                                <StatCard label="Total Earnings" value={`$${(dashboard.totalEarnings || 0).toLocaleString()}`} icon={FiDollarSign} bg="#fefce8" fg="#ca8a04" sub={dashboard.pendingPayout > 0 ? `$${dashboard.pendingPayout} pending` : undefined} />
                                <StatCard label="Total Orders" value={dashboard.totalOrders || 0} icon={FiShoppingBag} bg="#faf5ff" fg="#9333ea" sub={dashboard.newOrdersToday > 0 ? `+${dashboard.newOrdersToday} today` : undefined} />
                                <StatCard label="Products" value={dashboard.totalProducts || 0} icon={FiPackage} bg="#eff6ff" fg="#2563eb" />
                                <StatCard label="Store Rating" value={`${dashboard.rating || 0}/5`} icon={FiStar} bg="#fffbeb" fg="#f59e0b" sub={dashboard.totalReviews > 0 ? `${dashboard.totalReviews} reviews` : undefined} />
                            </div>

                            {/* Charts Row 1 - Earnings + Daily Orders */}
                            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
                                <ChartCard title="Earnings Trend (6 Months)">
                                    <div style={{ height: 260 }}>
                                        {earningsChartData?.labels?.length > 0 ? <Line data={earningsChartData} options={chartOpts('$')} /> : <p style={{ color: '#a3a3a3', textAlign: 'center', paddingTop: 80, fontSize: 14 }}>No earnings data yet. Revenue appears when orders are delivered.</p>}
                                    </div>
                                </ChartCard>
                                <ChartCard title="Orders (Last 7 Days)">
                                    <div style={{ height: 260 }}>
                                        {dailyOrdersData?.labels?.length > 0 ? <Bar data={dailyOrdersData} options={chartOpts()} /> : <p style={{ color: '#a3a3a3', textAlign: 'center', paddingTop: 80, fontSize: 14 }}>No orders this week</p>}
                                    </div>
                                </ChartCard>
                            </div>

                            {/* Charts Row 2 - Order Status + Reviews */}
                            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
                                <ChartCard title="Order Status Breakdown">
                                    <div style={{ height: 220, display: 'flex', justifyContent: 'center' }}>
                                        {orderStatusData?.labels?.length > 0 ? <Doughnut data={orderStatusData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, padding: 8 } }, tooltip: { backgroundColor: '#000', cornerRadius: 8 } } }} /> : <p style={{ color: '#a3a3a3', fontSize: 14, alignSelf: 'center' }}>No orders yet</p>}
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
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
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

                            {/* Top Products + Recent Orders */}
                            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 16 }}>
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
                                <ChartCard title="Recent Orders">
                                    {recentOrders.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {recentOrders.slice(0, 6).map(o => {
                                                const sc = statusColors[o.orderStatus] || statusColors.pending;
                                                return (
                                                    <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f9f9f9', borderRadius: 12 }}>
                                                        <div>
                                                            <p style={{ fontSize: 13, fontWeight: 600 }}>#{o._id?.slice(-6).toUpperCase()}</p>
                                                            <p style={{ fontSize: 11, color: '#737373' }}>{o.user?.fullName || 'Customer'} • {new Date(o.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                        <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600, backgroundColor: sc.bg, color: sc.color, textTransform: 'capitalize' }}>{o.orderStatus}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : <p style={{ color: '#a3a3a3', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>No orders yet</p>}
                                </ChartCard>
                            </div>
                        </>
                    ) : (
                        <div style={{ border: '1px solid #e5e5e5', borderRadius: 20, padding: 48, textAlign: 'center' }}>
                            <FiTrendingUp style={{ margin: '0 auto 12px', display: 'block', color: '#d4d4d4' }} size={48} />
                            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Dashboard Overview</h3>
                            <p style={{ color: '#737373', fontSize: 14 }}>Your analytics will appear here once your store is active.</p>
                        </div>
                    )}
                </>
            )}

            {/* ═══════════ PRODUCTS TAB ═══════════ */}
            {activeTab === 'products' && (
                <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
                    {(isDesktop || filtersOpen) && (
                        <aside style={{ position: filtersOpen && !isDesktop ? 'fixed' : 'static', inset: filtersOpen && !isDesktop ? 0 : 'auto', zIndex: filtersOpen && !isDesktop ? 50 : 'auto', backgroundColor: '#fff', width: isDesktop ? 260 : '100%', minWidth: isDesktop ? 260 : 'auto', flexShrink: 0, overflowY: filtersOpen && !isDesktop ? 'auto' : 'visible', border: isDesktop ? '1px solid #e5e5e5' : 'none', borderRadius: 20, padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                                <h3 style={{ fontWeight: 700, fontSize: 18 }}>Filters</h3>
                                {!isDesktop ? <button onClick={() => setFiltersOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiX size={22} /></button> : <FiFilter size={20} style={{ color: '#a3a3a3' }} />}
                            </div>
                            <FilterSection title="Categories" filterKey="categories">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {categories.map(cat => (
                                        <button key={cat._id} onClick={() => { const p = new URLSearchParams(searchParams); currentCategory === cat._id ? p.delete('category') : p.set('category', cat._id); p.set('page', '1'); setSearchParams(p); }}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, fontSize: 14, backgroundColor: currentCategory === cat._id ? '#000' : 'transparent', color: currentCategory === cat._id ? '#fff' : '#525252', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>{cat.name}</button>
                                    ))}
                                </div>
                            </FilterSection>
                            <FilterSection title="Price" filterKey="price">
                                <div style={{ padding: '0 8px' }}>
                                    <input type="range" min="0" max="500" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])} style={{ width: '100%', accentColor: '#000' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#737373', marginTop: 8 }}><span>${priceRange[0]}</span><span>${priceRange[1]}</span></div>
                                    <button className="btn-primary" style={{ width: '100%', marginTop: 16, padding: 10, fontSize: 13 }} onClick={() => { const p = new URLSearchParams(searchParams); p.set('minPrice', priceRange[0].toString()); p.set('maxPrice', priceRange[1].toString()); p.set('page', '1'); setSearchParams(p); }}>Apply Price</button>
                                </div>
                            </FilterSection>
                            <FilterSection title="Colors" filterKey="colors">
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {colorSwatches.map(c => (
                                        <button key={c} onClick={() => { const p = new URLSearchParams(searchParams); const n = currentColor === c ? '' : c; n ? p.set('color', n) : p.delete('color'); p.set('page', '1'); setSearchParams(p); }}
                                            style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: c, border: currentColor === c ? '3px solid #000' : '1px solid #e5e5e5', cursor: 'pointer' }} />
                                    ))}
                                </div>
                            </FilterSection>
                            <FilterSection title="Sort By" filterKey="sort">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {sortOptions.map(opt => (
                                        <button key={opt.value} onClick={() => handleSortChange(opt.value)}
                                            style={{ padding: '8px 12px', borderRadius: 8, fontSize: 14, textAlign: 'left', border: 'none', cursor: 'pointer', backgroundColor: currentSort === opt.value ? '#f5f5f5' : 'transparent', color: currentSort === opt.value ? '#000' : '#737373', fontWeight: currentSort === opt.value ? 600 : 400 }}>{opt.label}</button>
                                    ))}
                                </div>
                            </FilterSection>
                            <button style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 12, background: '#f5f5f5', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }} onClick={() => { setSearchParams({}); setPriceRange([0, 500]); if (!isDesktop) setFiltersOpen(false); }}>Reset All</button>
                        </aside>
                    )}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Your Products ({pagination.totalProducts})</h2>
                                {!isDesktop && <button onClick={() => setFiltersOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e5e5', background: '#fff', fontSize: 14 }}><FiFilter size={16} /> Filters</button>}
                            </div>
                            <input type="text" placeholder="Search products..." defaultValue={currentSearch} onKeyDown={e => { if (e.key === 'Enter') { const p = new URLSearchParams(searchParams); e.target.value ? p.set('search', e.target.value) : p.delete('search'); p.set('page', '1'); setSearchParams(p); } }}
                                style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid #e5e5e5', outline: 'none', fontSize: 14, width: 'clamp(150px,20vw,300px)' }} />
                        </div>
                        {productsLoading ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20 }}>
                                {Array.from({ length: 6 }, (_, i) => <div key={i} style={{ height: 300, backgroundColor: '#f5f5f5', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />)}
                            </div>
                        ) : products.length > 0 ? (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20 }}>
                                    {products.map(p => (
                                        <div key={p._id} style={{ position: 'relative' }}>
                                            <ProductCard product={p} />
                                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                <button onClick={() => navigate(`/seller/edit-product/${p._id}`)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e5e5', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#000'; }}>
                                                    <FiEdit size={14} /> Edit
                                                </button>
                                                <button onClick={() => handleDeleteProduct(p._id, p.title)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#dc2626'; }}>
                                                    <FiTrash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {pagination.totalPages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pg => (
                                            <button key={pg} onClick={() => handlePageChange(pg)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #e5e5e5', cursor: 'pointer', backgroundColor: pg === pagination.currentPage ? '#000' : '#fff', color: pg === pagination.currentPage ? '#fff' : '#000' }}>{pg}</button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 64, border: '1px dashed #e5e5e5', borderRadius: 20 }}>
                                <p style={{ color: '#737373' }}>No products found.</p>
                                <button onClick={() => setSearchParams({})} style={{ marginTop: 12, color: '#000', fontWeight: 600, textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer' }}>Clear filters</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════ ORDERS TAB ═══════════ */}
            {activeTab === 'orders' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {sellerOrders.length > 0 ? sellerOrders.map(order => {
                        const sc = statusColors[order.orderStatus] || statusColors.pending;
                        return (
                            <div key={order._id} style={{ border: '1px solid #e5e5e5', borderRadius: 20, padding: 24 }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                                    <div>
                                        <p style={{ fontSize: 12, color: '#a3a3a3' }}>Order #{order._id?.slice(-8).toUpperCase()}</p>
                                        <p style={{ fontWeight: 700, fontSize: 16 }}>${order.totalDiscountedPrice || order.totalPrice}</p>
                                        <p style={{ fontSize: 13, color: '#737373' }}>{order.orderItems?.length} items • {new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span style={{ padding: '6px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 600, backgroundColor: sc.bg, color: sc.color, textTransform: 'capitalize', alignSelf: 'flex-start' }}>{order.orderStatus}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 4, height: 4 }}>
                                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                                        const m = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4 };
                                        return <div key={step} style={{ flex: 1, borderRadius: 2, backgroundColor: order.orderStatus === 'cancelled' ? '#fca5a5' : idx <= (m[order.orderStatus] ?? -1) ? '#000' : '#e5e5e5' }} />;
                                    })}
                                </div>
                            </div>
                        );
                    }) : (
                        <div style={{ textAlign: 'center', padding: 48 }}><p style={{ color: '#737373' }}>No orders yet.</p></div>
                    )}
                </div>
            )}
        </div>
    );
}
