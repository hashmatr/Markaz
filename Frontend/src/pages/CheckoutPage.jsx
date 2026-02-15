import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiPhone, FiUser } from 'react-icons/fi';
import Breadcrumb from '../components/ui/Breadcrumb';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../api';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
    const { cart, clearCart } = useCart();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'Pakistan',
        paymentMethod: 'COD',
    });
    const [warnings, setWarnings] = useState({});

    const items = cart?.items || [];
    const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const discount = items.reduce((s, i) => s + ((i.price - (i.discountedPrice || i.price)) * i.quantity), 0);
    const deliveryFee = subtotal > 0 ? 15 : 0;
    const total = subtotal - discount + deliveryFee;

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login?redirect=checkout');
            return;
        }
        if (items.length === 0 && !loading) {
            navigate('/cart');
        }
    }, [items, navigate, loading, user, authLoading]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (warnings[e.target.name]) {
            setWarnings({ ...warnings, [e.target.name]: null });
        }
    };

    const validateForm = () => {
        const errors = {};
        if (form.phone.replace(/\D/g, '').length < 11) {
            errors.phone = 'Phone number must be at least 11 digits';
        }
        if (!/^\d{5,6}$/.test(form.zipCode)) {
            errors.zipCode = 'Please enter a valid zip code';
        }
        if (form.fullName.trim().length < 3) {
            errors.fullName = 'Full name is too short';
        }
        if (form.street.trim().length < 5) {
            errors.street = 'Please provide a more detailed street address';
        }
        setWarnings(errors);
        return Object.keys(errors).length === 0;
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error('Please correct the highlighted errors');
            return;
        }

        setLoading(true);
        try {
            const res = await orderAPI.create({
                shippingAddress: {
                    fullName: form.fullName,
                    phone: form.phone,
                    street: form.street,
                    city: form.city,
                    state: form.state,
                    zipCode: form.zipCode,
                    country: form.country
                },
                paymentMethod: form.paymentMethod,
            });
            await clearCart();
            toast.success('Your order is placed successfully!');
            const orderId = res.data?.data?.order?._id;
            navigate('/order-success', { state: { orderId } });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to place order');
        } finally { setLoading(false); }
    };

    if (items.length === 0) return null;

    const inputStyle = { width: '100%', backgroundColor: '#f0f0f0', borderRadius: '9999px', padding: '14px 16px', fontSize: '14px', outline: 'none', border: '2px solid transparent' };

    return (
        <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
            <Breadcrumb items={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
            <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 700, marginBottom: '32px' }}>CHECKOUT</h1>

            <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
                {/* Shipping */}
                <div style={{ flex: '1 1 55%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '28px' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><FiMapPin /> Shipping Address</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 200px' }}>
                                    <input name="fullName" required value={form.fullName} onChange={handleChange} placeholder="Full Name"
                                        style={{ ...inputStyle, border: warnings.fullName ? '2px solid #ff3333' : '2px solid transparent' }} />
                                    {warnings.fullName && <p style={{ color: '#ff3333', fontSize: '11px', mt: '4px', ml: '16px' }}>{warnings.fullName}</p>}
                                </div>
                                <div style={{ flex: '1 1 200px' }}>
                                    <input name="phone" required value={form.phone} onChange={handleChange} placeholder="Phone Number"
                                        style={{ ...inputStyle, border: warnings.phone ? '2px solid #ff3333' : '2px solid transparent' }} />
                                    {warnings.phone && <p style={{ color: '#ff3333', fontSize: '11px', mt: '4px', ml: '16px' }}>{warnings.phone}</p>}
                                </div>
                            </div>
                            <div>
                                <input name="street" required value={form.street} onChange={handleChange} placeholder="Street Address"
                                    style={{ ...inputStyle, border: warnings.street ? '2px solid #ff3333' : '2px solid transparent' }} />
                                {warnings.street && <p style={{ color: '#ff3333', fontSize: '11px', mt: '4px', ml: '16px' }}>{warnings.street}</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                <input name="city" required value={form.city} onChange={handleChange} placeholder="City" style={{ ...inputStyle, flex: '1 1 120px' }} />
                                <input name="state" required value={form.state} onChange={handleChange} placeholder="State" style={{ ...inputStyle, flex: '1 1 120px' }} />
                                <div style={{ flex: '1 1 120px' }}>
                                    <input name="zipCode" required value={form.zipCode} onChange={handleChange} placeholder="ZIP Code"
                                        style={{ ...inputStyle, border: warnings.zipCode ? '2px solid #ff3333' : '2px solid transparent' }} />
                                    {warnings.zipCode && <p style={{ color: '#ff3333', fontSize: '11px', mt: '4px', ml: '16px' }}>{warnings.zipCode}</p>}
                                </div>
                            </div>
                            <input name="country" required value={form.country} onChange={handleChange} placeholder="Country" style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '28px' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>Payment Method</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { value: 'COD', label: 'Cash on Delivery', desc: 'Pay when you receive your order' },
                                { value: 'online', label: 'Credit/Debit Card', desc: 'Pay securely online' },
                            ].map(opt => (
                                <label key={opt.value} style={{
                                    display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid', borderRadius: '12px', padding: '16px 20px', cursor: 'pointer',
                                    borderColor: form.paymentMethod === opt.value ? '#000' : '#e5e5e5',
                                    backgroundColor: form.paymentMethod === opt.value ? '#f9f9f9' : '#fff',
                                }}>
                                    <input type="radio" name="paymentMethod" value={opt.value} checked={form.paymentMethod === opt.value} onChange={handleChange} style={{ accentColor: '#000', width: '16px', height: '16px' }} />
                                    <div><p style={{ fontWeight: 500, fontSize: '14px' }}>{opt.label}</p><p style={{ fontSize: '12px', color: '#737373' }}>{opt.desc}</p></div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div style={{ flex: '0 0 360px', maxWidth: '380px' }}>
                    <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '24px', position: 'sticky', top: '96px' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '24px' }}>Order Summary</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                            {items.map(item => (
                                <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={item.product?.images?.[0]?.url || 'https://placehold.co/50x50'} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', backgroundColor: '#f0f0f0' }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product?.title}</p>
                                        <p style={{ fontSize: '11px', color: '#737373' }}>Qty: {item.quantity}</p>
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: 700 }}>${(item.discountedPrice || item.price) * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', marginBottom: '16px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#737373' }}>Subtotal</span><span>${subtotal}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#737373' }}>Discount</span><span style={{ color: '#ff3333' }}>-${discount}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#737373' }}>Delivery</span><span>${deliveryFee}</span></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '18px', borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginBottom: '24px' }}>
                            <span>Total</span><span>${total}</span>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '15px' }}>
                            {loading ? 'Placing Order...' : 'Place Order'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
