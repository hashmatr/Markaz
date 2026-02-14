import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiDollarSign, FiShoppingBag, FiStar, FiPlus, FiTrendingUp } from 'react-icons/fi';
import { sellerAPI, productAPI, orderAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/ui/Breadcrumb';
import ProductCard from '../components/product/ProductCard';

export default function SellerDashboardPage() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        Promise.all([
            sellerAPI.getDashboard().catch(() => ({ data: { data: { dashboard: null } } })),
            productAPI.getMyProducts({ limit: 6 }).catch(() => ({ data: { data: { products: [] } } })),
            orderAPI.getSellerOrders({ limit: 10 }).catch(() => ({ data: { data: { orders: [] } } })),
        ]).then(([d, p, o]) => {
            setDashboard(d.data.data.dashboard);
            setProducts(p.data.data.products || []);
            setOrders(o.data.data.orders || []);
        }).finally(() => setLoading(false));
    }, []);

    const stats = dashboard ? [
        { label: 'Total Products', value: dashboard.totalProducts, icon: FiPackage, bg: '#eff6ff', fg: '#2563eb' },
        { label: 'Total Orders', value: dashboard.totalOrders, icon: FiShoppingBag, bg: '#f0fdf4', fg: '#16a34a' },
        { label: 'Total Earnings', value: `$${dashboard.totalEarnings}`, icon: FiDollarSign, bg: '#fefce8', fg: '#ca8a04' },
        { label: 'Rating', value: `${dashboard.rating}/5`, icon: FiStar, bg: '#faf5ff', fg: '#9333ea' },
    ] : [];

    if (!user || user.role !== 'SELLER') {
        return (
            <div className="container-main" style={{ paddingTop: '64px', paddingBottom: '64px', textAlign: 'center' }}>
                <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>SELLER DASHBOARD</h2>
                <p style={{ color: '#737373', marginBottom: '24px' }}>You need to be a registered seller to access this page.</p>
                <Link to="/become-seller" className="btn-primary">Become a Seller</Link>
            </div>
        );
    }

    return (
        <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
            <Breadcrumb items={[{ label: 'Seller Dashboard' }]} />
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', gap: '16px' }}>
                <div>
                    <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700 }}>SELLER DASHBOARD</h1>
                    <p style={{ fontSize: '13px', color: '#737373', marginTop: '4px' }}>{dashboard?.storeName || 'Your Store'}</p>
                </div>
                {dashboard?.accountStatus === 'active' && (
                    <Link to="/seller/add-product" className="btn-primary" style={{ padding: '12px 24px', fontSize: '14px' }}>
                        <FiPlus size={16} /> Add Product
                    </Link>
                )}
            </div>

            {/* Account Status Message */}
            {dashboard && dashboard.accountStatus !== 'active' && (
                <div style={{
                    backgroundColor: dashboard.accountStatus === 'pending' ? '#fffbeb' : dashboard.accountStatus === 'rejected' ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${dashboard.accountStatus === 'pending' ? '#fde68a' : dashboard.accountStatus === 'rejected' ? '#fecaca' : '#bbf7d0'}`,
                    padding: '20px', borderRadius: '16px', marginBottom: '32px', textAlign: 'center'
                }}>
                    <h3 style={{ fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Account {dashboard.accountStatus}</h3>
                    <p style={{ fontSize: '14px', color: '#525252' }}>
                        {dashboard.accountStatus === 'pending' && "Your seller application is currently under review by our admin team. You'll be able to add products once approved."}
                        {dashboard.accountStatus === 'rejected' && "Your application was unfortunately rejected. Please contact support for more details."}
                        {dashboard.accountStatus === 'suspended' && "Your store has been suspended due to policy violations."}
                    </p>
                </div>
            )}

            {!loading && stats.length > 0 && dashboard?.accountStatus === 'active' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    {stats.map(({ label, value, icon: Icon, bg, fg }) => (
                        <div key={label} style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '24px' }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: fg }}>
                                <Icon size={20} />
                            </div>
                            <p style={{ fontSize: '24px', fontWeight: 700 }}>{value}</p>
                            <p style={{ fontSize: '13px', color: '#737373' }}>{label}</p>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e5e5e5', marginBottom: '24px' }}>
                {['overview', 'products', 'orders'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        style={{
                            paddingBottom: '12px', fontSize: '14px', fontWeight: 500, textTransform: 'capitalize', cursor: 'pointer', border: 'none', background: 'none',
                            borderBottom: activeTab === tab ? '2px solid #000' : '2px solid transparent', color: activeTab === tab ? '#000' : '#a3a3a3',
                        }}>
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '48px', textAlign: 'center' }}>
                    <FiTrendingUp style={{ margin: '0 auto 12px', display: 'block', color: '#d4d4d4' }} size={48} />
                    <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Dashboard Overview</h3>
                    <p style={{ color: '#737373', fontSize: '14px' }}>Your analytics and insights will appear here as you grow your store.</p>
                </div>
            )}

            {activeTab === 'products' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                    {products.length > 0 ? products.map(p => <ProductCard key={p._id} product={p} />) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px' }}>
                            <p style={{ color: '#737373' }}>No products yet. Add your first product!</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'orders' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {orders.length > 0 ? orders.map(order => (
                        <div key={order._id} style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px' }}>
                            <div>
                                <p style={{ fontSize: '12px', color: '#a3a3a3' }}>Order #{order._id?.slice(-8).toUpperCase()}</p>
                                <p style={{ fontWeight: 700 }}>${order.totalDiscountedPrice || order.totalPrice}</p>
                                <p style={{ fontSize: '13px', color: '#737373' }}>{order.orderItems?.length} items • {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="badge-warning" style={{ padding: '6px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize', alignSelf: 'flex-start' }}>{order.orderStatus}</span>
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '48px' }}><p style={{ color: '#737373' }}>No orders yet.</p></div>
                    )}
                </div>
            )}
        </div>
    );
}
