import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiPackage, FiClock, FiTruck, FiCheckCircle, FiXCircle, FiMapPin, FiBox, FiArrowLeft } from 'react-icons/fi';
import Breadcrumb from '../components/ui/Breadcrumb';
import { orderAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const ORDER_STEPS = [
    { key: 'pending', label: 'Order Placed', icon: FiClock, description: 'Your order has been placed successfully' },
    { key: 'confirmed', label: 'Confirmed', icon: FiCheckCircle, description: 'Your order has been confirmed by the seller' },
    { key: 'processing', label: 'Processing', icon: FiBox, description: 'Your order is being prepared and packed' },
    { key: 'shipped', label: 'Shipped', icon: FiTruck, description: 'Your order is on its way to you' },
    { key: 'delivered', label: 'Delivered', icon: FiPackage, description: 'Your order has been delivered' },
];

const statusToStep = {
    pending: 0,
    confirmed: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
    cancelled: -1,
    refunded: -1,
};

function getEstimatedDays(orderStatus, createdAt) {
    const totalDays = 7; // estimated total delivery days
    const created = new Date(createdAt);
    const now = new Date();
    const daysPassed = Math.floor((now - created) / (1000 * 60 * 60 * 24));

    switch (orderStatus) {
        case 'pending': return { remaining: totalDays, message: `Estimated delivery in ${totalDays} days` };
        case 'confirmed': return { remaining: totalDays - 1, message: `Estimated delivery in ${totalDays - 1} days` };
        case 'processing': return { remaining: Math.max(totalDays - 2, 1), message: `Estimated delivery in ${Math.max(totalDays - 2, 1)} days` };
        case 'shipped': return { remaining: Math.max(totalDays - daysPassed, 1), message: `Arriving in ${Math.max(totalDays - daysPassed, 1)} day(s)` };
        case 'delivered': return { remaining: 0, message: 'Delivered!' };
        case 'cancelled': return { remaining: 0, message: 'Order cancelled' };
        default: return { remaining: totalDays, message: `Estimated delivery in ${totalDays} days` };
    }
}

export default function OrderTrackingPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user && id) {
            orderAPI.getById(id)
                .then(r => setOrder(r.data.data.order))
                .catch(err => setError(err.response?.data?.message || 'Failed to load order'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user, id]);

    if (!user) {
        return (
            <div className="container-main" style={{ paddingTop: '64px', paddingBottom: '64px', textAlign: 'center' }}>
                <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>ORDER TRACKING</h2>
                <p style={{ color: '#737373', marginBottom: '24px' }}>Please login to track your orders</p>
                <Link to="/login" className="btn-primary">Sign In</Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: '80px', backgroundColor: '#f0f0f0', borderRadius: '20px', animation: 'pulse 1.5s infinite' }} />)}
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="container-main" style={{ paddingTop: '64px', paddingBottom: '64px', textAlign: 'center' }}>
                <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>Order Not Found</h2>
                <p style={{ color: '#737373', marginBottom: '24px' }}>{error || 'This order could not be found.'}</p>
                <Link to="/orders" className="btn-primary">View All Orders</Link>
            </div>
        );
    }

    const currentStep = statusToStep[order.orderStatus] ?? 0;
    const isCancelled = order.orderStatus === 'cancelled' || order.orderStatus === 'refunded';
    const estimatedDelivery = getEstimatedDays(order.orderStatus, order.createdAt);

    return (
        <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
            <Breadcrumb items={[{ label: 'My Orders', to: '/orders' }, { label: `Order #${order._id?.slice(-8).toUpperCase()}` }]} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <Link to="/orders" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #e5e5e5', color: '#000' }}>
                    <FiArrowLeft size={18} />
                </Link>
                <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700 }}>
                    ORDER TRACKING
                </h1>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
                {/* Left: Tracking Timeline */}
                <div style={{ flex: '1 1 55%', minWidth: '300px' }}>
                    {/* Order Info Card */}
                    <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <p style={{ fontSize: '12px', color: '#a3a3a3', marginBottom: '4px' }}>Order ID</p>
                                <p style={{ fontWeight: 700, fontSize: '16px', fontFamily: "'Satoshi', sans-serif" }}>#{order._id?.slice(-8).toUpperCase()}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: '#a3a3a3', marginBottom: '4px' }}>Order Date</p>
                                <p style={{ fontWeight: 600, fontSize: '14px' }}>{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: '#a3a3a3', marginBottom: '4px' }}>Total Amount</p>
                                <p style={{ fontWeight: 700, fontSize: '16px' }}>${order.totalDiscountedPrice || order.totalPrice}</p>
                            </div>
                        </div>
                        {/* Estimated Delivery */}
                        <div style={{
                            backgroundColor: isCancelled ? '#fef2f2' : order.orderStatus === 'delivered' ? '#f0fdf4' : '#eff6ff',
                            borderRadius: '12px', padding: '16px', textAlign: 'center',
                        }}>
                            <p style={{
                                fontWeight: 700, fontSize: '16px',
                                color: isCancelled ? '#dc2626' : order.orderStatus === 'delivered' ? '#16a34a' : '#2563eb',
                            }}>
                                {estimatedDelivery.message}
                            </p>
                            {order.deliveredAt && (
                                <p style={{ fontSize: '13px', color: '#737373', marginTop: '4px' }}>
                                    Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Tracking Timeline */}
                    <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '32px' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '32px', fontFamily: "'Satoshi', sans-serif" }}>Tracking Timeline</h3>

                        {isCancelled ? (
                            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <FiXCircle size={32} style={{ color: '#dc2626' }} />
                                </div>
                                <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#dc2626' }}>Order {order.orderStatus === 'refunded' ? 'Refunded' : 'Cancelled'}</h4>
                                {order.cancelReason && <p style={{ color: '#737373', fontSize: '14px' }}>Reason: {order.cancelReason}</p>}
                                {order.cancelledAt && <p style={{ color: '#a3a3a3', fontSize: '12px', marginTop: '8px' }}>on {new Date(order.cancelledAt).toLocaleDateString()}</p>}
                            </div>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                {ORDER_STEPS.map((step, index) => {
                                    const isCompleted = index <= currentStep;
                                    const isCurrent = index === currentStep;
                                    const StepIcon = step.icon;

                                    return (
                                        <div key={step.key} style={{ display: 'flex', gap: '20px', position: 'relative', paddingBottom: index < ORDER_STEPS.length - 1 ? '40px' : '0' }}>
                                            {/* Vertical line */}
                                            {index < ORDER_STEPS.length - 1 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '23px',
                                                    top: '48px',
                                                    width: '2px',
                                                    height: 'calc(100% - 48px)',
                                                    backgroundColor: isCompleted && index < currentStep ? '#000' : '#e5e5e5',
                                                    transition: 'background-color 0.3s',
                                                }} />
                                            )}

                                            {/* Circle */}
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: isCompleted ? '#000' : '#f0f0f0',
                                                color: isCompleted ? '#fff' : '#a3a3a3',
                                                transition: 'all 0.3s',
                                                boxShadow: isCurrent ? '0 0 0 4px rgba(0,0,0,0.1)' : 'none',
                                            }}>
                                                <StepIcon size={20} />
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, paddingTop: '4px' }}>
                                                <h4 style={{
                                                    fontWeight: 700, fontSize: '15px', marginBottom: '4px',
                                                    color: isCompleted ? '#000' : '#a3a3a3',
                                                    fontFamily: "'Satoshi', sans-serif",
                                                }}>
                                                    {step.label}
                                                    {isCurrent && (
                                                        <span style={{
                                                            marginLeft: '8px', fontSize: '11px', fontWeight: 500,
                                                            backgroundColor: '#eff6ff', color: '#2563eb',
                                                            padding: '2px 8px', borderRadius: '9999px',
                                                        }}>Current</span>
                                                    )}
                                                </h4>
                                                <p style={{ color: '#737373', fontSize: '13px', lineHeight: 1.5 }}>{step.description}</p>
                                                {isCompleted && index <= currentStep && (
                                                    <p style={{ color: '#a3a3a3', fontSize: '11px', marginTop: '4px' }}>
                                                        {index === 0 ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) :
                                                            index === currentStep && order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Order Details */}
                <div style={{ flex: '0 0 360px', maxWidth: '400px' }}>
                    {/* Order Items */}
                    <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '24px', marginBottom: '24px', position: 'sticky', top: '96px' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>Order Items</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                            {order.orderItems?.map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <img src={item.product?.images?.[0]?.url || 'https://placehold.co/60x60/f0f0f0/999?text=P'} alt=""
                                        style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', backgroundColor: '#f0f0f0', flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product?.title || 'Product'}</p>
                                        <p style={{ fontSize: '12px', color: '#737373' }}>Qty: {item.quantity}{item.size ? ` • Size: ${item.size}` : ''}</p>
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>${(item.discountedPrice || item.price) * item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', marginBottom: '16px' }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#737373' }}>Subtotal</span><span>${order.totalPrice}</span></div>
                            {order.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#737373' }}>Discount</span><span style={{ color: '#ff3333' }}>-${order.discount}</span></div>}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#737373' }}>Shipping</span><span>${order.shippingCost || 0}</span></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '18px', borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginBottom: '20px' }}>
                            <span>Total</span><span>${order.totalDiscountedPrice || order.totalPrice}</span>
                        </div>

                        {/* Shipping Address */}
                        {order.shippingAddress && (
                            <div style={{ backgroundColor: '#f9f9f9', borderRadius: '12px', padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <FiMapPin size={16} style={{ color: '#737373' }} />
                                    <span style={{ fontWeight: 600, fontSize: '13px' }}>Shipping Address</span>
                                </div>
                                <p style={{ fontSize: '13px', color: '#525252', lineHeight: 1.6 }}>
                                    {order.shippingAddress.fullName && <>{order.shippingAddress.fullName}<br /></>}
                                    {order.shippingAddress.street && <>{order.shippingAddress.street}<br /></>}
                                    {order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''} {order.shippingAddress.zipCode}
                                    {order.shippingAddress.country && <><br />{order.shippingAddress.country}</>}
                                </p>
                                {order.shippingAddress.phone && (
                                    <p style={{ fontSize: '12px', color: '#737373', marginTop: '4px' }}>Phone: {order.shippingAddress.phone}</p>
                                )}
                            </div>
                        )}

                        {/* Payment Info */}
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: '#737373' }}>Payment</span>
                            <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{order.paymentMethod}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
                            <span style={{ color: '#737373' }}>Payment Status</span>
                            <span style={{
                                fontWeight: 600, textTransform: 'capitalize',
                                color: order.paymentStatus === 'paid' ? '#16a34a' : order.paymentStatus === 'failed' ? '#dc2626' : '#d97706',
                            }}>{order.paymentStatus}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
