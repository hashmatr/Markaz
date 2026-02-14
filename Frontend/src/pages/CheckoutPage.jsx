import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiPhone, FiUser } from 'react-icons/fi';
import Breadcrumb from '../components/ui/Breadcrumb';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../api';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
    const { cart, clearCart } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: '',
        paymentMethod: 'cod',
    });

    const items = cart?.items || [];
    const subtotal = items.reduce((s, i) => s + ((i.discountedPrice || i.price) * i.quantity), 0);
    const deliveryFee = subtotal > 0 ? 15 : 0;
    const total = subtotal + deliveryFee;

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await orderAPI.create({
                shippingAddress: { fullName: form.fullName, phone: form.phone, street: form.street, city: form.city, state: form.state, zipCode: form.zipCode, country: form.country },
                paymentMethod: form.paymentMethod,
            });
            await clearCart();
            toast.success('Order placed successfully!');
            navigate('/orders');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to place order');
        } finally { setLoading(false); }
    };

    if (items.length === 0) { navigate('/cart'); return null; }

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
                                <input name="fullName" required value={form.fullName} onChange={handleChange} placeholder="Full Name" style={{ ...inputStyle, flex: '1 1 200px' }} />
                                <input name="phone" required value={form.phone} onChange={handleChange} placeholder="Phone Number" style={{ ...inputStyle, flex: '1 1 200px' }} />
                            </div>
                            <input name="street" required value={form.street} onChange={handleChange} placeholder="Street Address" style={inputStyle} />
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                <input name="city" required value={form.city} onChange={handleChange} placeholder="City" style={{ ...inputStyle, flex: '1 1 120px' }} />
                                <input name="state" required value={form.state} onChange={handleChange} placeholder="State" style={{ ...inputStyle, flex: '1 1 120px' }} />
                                <input name="zipCode" required value={form.zipCode} onChange={handleChange} placeholder="ZIP Code" style={{ ...inputStyle, flex: '1 1 120px' }} />
                            </div>
                            <input name="country" required value={form.country} onChange={handleChange} placeholder="Country" style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '28px' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>Payment Method</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive your order' },
                                { value: 'card', label: 'Credit/Debit Card', desc: 'Pay securely online' },
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
