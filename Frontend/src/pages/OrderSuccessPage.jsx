import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { authAPI, paymentAPI } from '../api';
import toast from 'react-hot-toast';

export default function OrderSuccessPage() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const stateOrderId = location.state?.orderId || null;
    const urlOrderId = searchParams.get('orderId') || null;
    const sessionId = searchParams.get('session_id') || null;
    const orderId = stateOrderId || urlOrderId;

    const [showConfetti, setShowConfetti] = useState(true);
    const [verifyingPayment, setVerifyingPayment] = useState(false);
    const [paymentVerified, setPaymentVerified] = useState(false);

    const { updateUser } = useAuth();

    useEffect(() => {
        window.scrollTo(0, 0);

        // Refresh profile to get updated saved addresses - do it once on mount
        authAPI.getProfile().then(res => {
            updateUser(res.data.data.user);
        }).catch(err => console.error('Failed to refresh profile:', err));

        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
    }, []); // Empty dependency array to run only once on mount

    // Verify Stripe payment if session_id is present
    useEffect(() => {
        if (sessionId && orderId && !paymentVerified) {
            setVerifyingPayment(true);
            paymentAPI.verifySession({ sessionId, orderId })
                .then(() => {
                    setPaymentVerified(true);
                    toast.success('Payment verified successfully!');
                })
                .catch(err => {
                    console.error('Payment verification failed:', err);
                    toast.error('Payment verification issue. Please contact support if needed.');
                })
                .finally(() => setVerifyingPayment(false));
        }
    }, [sessionId, orderId, paymentVerified]);

    return (
        <div className="container-main" style={{ paddingTop: '64px', paddingBottom: '64px' }}>
            <div style={{
                maxWidth: '600px', margin: '0 auto', textAlign: 'center',
            }}>
                {/* Success Icon */}
                <div style={{
                    width: '120px', height: '120px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 32px',
                    boxShadow: '0 20px 60px rgba(16, 185, 129, 0.3)',
                    animation: 'pulse 2s infinite',
                }}>
                    <FiCheckCircle size={56} style={{ color: '#fff' }} />
                </div>

                <h1 style={{
                    fontFamily: "'Integral CF', sans-serif",
                    fontSize: 'clamp(24px, 4vw, 36px)',
                    fontWeight: 700,
                    marginBottom: '16px',
                    color: '#000',
                }}>
                    ORDER PLACED SUCCESSFULLY!
                </h1>

                <p style={{
                    color: '#737373', fontSize: '16px', lineHeight: 1.7,
                    marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px',
                }}>
                    Thank you for your purchase! Your order has been placed and is being processed.
                    You will receive a confirmation soon.
                </p>

                {/* Payment verification status */}
                {verifyingPayment && (
                    <div style={{
                        backgroundColor: '#fef3c7', borderRadius: '12px', padding: '16px',
                        marginBottom: '24px', border: '1px solid #fde68a',
                    }}>
                        <p style={{ fontSize: '14px', color: '#92400e', fontWeight: 500 }}>
                            Verifying your payment...
                        </p>
                    </div>
                )}

                {paymentVerified && (
                    <div style={{
                        backgroundColor: '#d1fae5', borderRadius: '12px', padding: '16px',
                        marginBottom: '24px', border: '1px solid #a7f3d0',
                    }}>
                        <p style={{ fontSize: '14px', color: '#065f46', fontWeight: 500 }}>
                            Payment verified and confirmed!
                        </p>
                    </div>
                )}

                {orderId && (
                    <div style={{
                        backgroundColor: '#f9f9f9', borderRadius: '16px', padding: '20px',
                        marginBottom: '32px', border: '1px solid #e5e5e5',
                    }}>
                        <p style={{ fontSize: '13px', color: '#a3a3a3', marginBottom: '4px' }}>Order ID</p>
                        <p style={{ fontWeight: 700, fontSize: '18px', fontFamily: "'Satoshi', sans-serif" }}>
                            #{orderId.slice(-8).toUpperCase()}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                    {orderId ? (
                        <Link to={`/orders/${orderId}`} className="btn-primary"
                            style={{ padding: '16px 40px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <FiPackage size={18} /> Track Your Order <FiArrowRight size={16} />
                        </Link>
                    ) : (
                        <Link to="/orders" className="btn-primary"
                            style={{ padding: '16px 40px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <FiPackage size={18} /> View My Orders <FiArrowRight size={16} />
                        </Link>
                    )}
                    <Link to="/shop" className="btn-outline"
                        style={{ padding: '14px 40px', fontSize: '14px' }}>
                        Continue Shopping
                    </Link>
                </div>

                {/* Delivery Info */}
                <div style={{
                    marginTop: '48px', padding: '24px', backgroundColor: '#eff6ff',
                    borderRadius: '16px', border: '1px solid #dbeafe',
                }}>
                    <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '8px', color: '#1e40af' }}>What's Next?</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#3b82f6', textAlign: 'left' }}>
                        <p>You'll receive an order confirmation notification</p>
                        <p>The seller will confirm and process your order</p>
                        <p>Your order will be shipped within 1-2 business days</p>
                        <p>Estimated delivery: 5-7 business days</p>
                        <p>You can track your order status anytime from your orders page</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
