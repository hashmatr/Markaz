import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiClock, FiTruck, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import Breadcrumb from '../components/ui/Breadcrumb';
import { orderAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
    pending: { icon: FiClock, className: 'badge-warning' },
    confirmed: { icon: FiCheckCircle, className: 'badge-info' },
    processing: { icon: FiPackage, className: 'badge-purple' },
    shipped: { icon: FiTruck, className: 'badge-info' },
    delivered: { icon: FiCheckCircle, className: 'badge-success' },
    cancelled: { icon: FiXCircle, className: 'badge-danger' },
};

export default function OrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            orderAPI.getMyOrders().then(r => setOrders(r.data.data.orders || [])).catch(() => { }).finally(() => setLoading(false));
        } else setLoading(false);
    }, [user]);

    if (!user) {
        return (
            <div className="container-main" style={{ paddingTop: '64px', paddingBottom: '64px', textAlign: 'center' }}>
                <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>MY ORDERS</h2>
                <p style={{ color: '#737373', marginBottom: '24px' }}>Please login to view your orders</p>
                <Link to="/login" className="btn-primary">Sign In</Link>
            </div>
        );
    }

    return (
        <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
            <Breadcrumb items={[{ label: 'My Orders' }]} />
            <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 700, marginBottom: '32px' }}>MY ORDERS</h1>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: '80px', backgroundColor: '#f0f0f0', borderRadius: '20px', animation: 'pulse 1.5s infinite' }} />)}
                </div>
            ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0' }}>
                    <FiPackage style={{ margin: '0 auto 16px', display: 'block', color: '#d4d4d4' }} size={64} />
                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No orders yet</h3>
                    <p style={{ color: '#737373', marginBottom: '24px' }}>When you place an order, it will appear here.</p>
                    <Link to="/shop" className="btn-primary">Start Shopping</Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {orders.map(order => {
                        const config = statusConfig[order.orderStatus] || statusConfig.pending;
                        const StatusIcon = config.icon;
                        return (
                            <Link key={order._id} to={`/orders/${order._id}`}
                                style={{ display: 'block', border: '1px solid #e5e5e5', borderRadius: '20px', padding: '24px', transition: 'box-shadow 0.2s' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px' }}>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#a3a3a3', marginBottom: '4px' }}>Order #{order._id?.slice(-8).toUpperCase()}</p>
                                        <p style={{ fontWeight: 700, fontSize: '18px' }}>${order.totalDiscountedPrice || order.totalPrice}</p>
                                        <p style={{ fontSize: '13px', color: '#737373', marginTop: '4px' }}>{order.orderItems?.length} item(s) • {new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className={config.className} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, alignSelf: 'flex-start', textTransform: 'capitalize' }}>
                                        <StatusIcon size={16} />{order.orderStatus}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', overflowX: 'auto' }}>
                                    {order.orderItems?.slice(0, 4).map((item, i) => (
                                        <img key={i} src={item.product?.images?.[0]?.url || 'https://placehold.co/56x56/f0f0f0/999?text=P'} alt="" style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', backgroundColor: '#f0f0f0', flexShrink: 0 }} />
                                    ))}
                                    {order.orderItems?.length > 4 && (
                                        <div style={{ width: '56px', height: '56px', borderRadius: '10px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#737373', flexShrink: 0 }}>
                                            +{order.orderItems.length - 4}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
