import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiTag } from 'react-icons/fi';
import Breadcrumb from '../components/ui/Breadcrumb';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CartPage() {
    const { cart, updateItem, removeItem } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [promoCode, setPromoCode] = useState('');

    const items = cart?.items || [];
    const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const discount = items.reduce((s, i) => s + ((i.price - (i.discountedPrice || i.price)) * i.quantity), 0);
    const deliveryFee = subtotal > 0 ? 15 : 0;
    const total = subtotal - discount + deliveryFee;

    const handleQtyChange = async (itemId, qty) => {
        try { await updateItem(itemId, qty); } catch (err) { toast.error('Failed to update quantity'); }
    };
    const handleRemove = async (itemId) => {
        try { await removeItem(itemId); toast.success('Item removed'); } catch { toast.error('Failed to remove'); }
    };

    if (!user) {
        return (
            <div className="container-main" style={{ paddingTop: '64px', paddingBottom: '64px', textAlign: 'center' }}>
                <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>YOUR CART</h2>
                <p style={{ color: '#737373', marginBottom: '24px' }}>Please login to view your cart</p>
                <Link to="/login" className="btn-primary">Sign In</Link>
            </div>
        );
    }

    return (
        <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
            <Breadcrumb items={[{ label: 'Cart' }]} />
            <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, marginBottom: '32px' }}>YOUR CART</h1>

            {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0' }}>
                    <div style={{ fontSize: '56px', marginBottom: '16px' }}>🛒</div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Your cart is empty</h3>
                    <p style={{ color: '#737373', marginBottom: '24px' }}>Looks like you haven't added anything yet.</p>
                    <Link to="/shop" className="btn-primary">Start Shopping</Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
                    {/* Cart Items */}
                    <div style={{ flex: '1 1 55%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {items.map(item => {
                            const prod = item.product || {};
                            const imgSrc = prod.images?.[0]?.url || 'https://placehold.co/120x120/f0f0f0/999?text=Product';
                            return (
                                <div key={item._id} style={{ display: 'flex', gap: '16px', border: '1px solid #e5e5e5', borderRadius: '20px', padding: '20px' }}>
                                    <img src={imgSrc} alt={prod.title} style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover', backgroundColor: '#f0f0f0' }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{prod.title || 'Product'}</h3>
                                                {item.size && <p style={{ fontSize: '12px', color: '#737373' }}>Size: {item.size}</p>}
                                                {item.color && <p style={{ fontSize: '12px', color: '#737373' }}>Color: {item.color}</p>}
                                            </div>
                                            <button onClick={() => handleRemove(item._id)} style={{ color: '#ff3333', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '16px' }}>
                                            <p style={{ fontWeight: 700, fontSize: '20px' }}>${item.discountedPrice || item.price}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: '9999px' }}>
                                                <button onClick={() => handleQtyChange(item._id, item.quantity - 1)}
                                                    style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer' }}>
                                                    <FiMinus size={14} />
                                                </button>
                                                <span style={{ width: '36px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>{item.quantity}</span>
                                                <button onClick={() => handleQtyChange(item._id, item.quantity + 1)}
                                                    style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer' }}>
                                                    <FiPlus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Order Summary */}
                    <div style={{ flex: '0 0 380px', maxWidth: '400px' }}>
                        <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '24px', position: 'sticky', top: '96px' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '20px', marginBottom: '24px' }}>Order Summary</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ color: '#737373' }}>Subtotal</span><span style={{ fontWeight: 500 }}>${subtotal}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ color: '#737373' }}>Discount</span><span style={{ color: '#ff3333', fontWeight: 500 }}>-${discount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ color: '#737373' }}>Delivery Fee</span><span style={{ fontWeight: 500 }}>${deliveryFee}</span>
                                </div>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', marginBottom: '16px' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <span style={{ fontWeight: 500 }}>Total</span><span style={{ fontWeight: 700, fontSize: '20px' }}>${total}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: '9999px', padding: '0 16px' }}>
                                    <FiTag style={{ color: '#a3a3a3', marginRight: '8px' }} size={18} />
                                    <input type="text" placeholder="Add promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)}
                                        style={{ background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', border: 'none', padding: '12px 0' }} />
                                </div>
                                <button className="btn-primary" style={{ padding: '12px 24px', fontSize: '13px' }}>Apply</button>
                            </div>
                            <button onClick={() => navigate('/checkout')}
                                className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '15px' }}>
                                Go to Checkout →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
