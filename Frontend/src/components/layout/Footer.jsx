import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTwitter, FiFacebook, FiInstagram } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import API from '../../api';

export default function Footer() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const sellerLink = user?.role === 'SELLER' ? '/seller/dashboard' : '/become-seller';
    const sellerLabel = user?.role === 'SELLER' ? 'Seller Dashboard' : 'Become a Seller';

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email.trim()) { toast.error('Please enter your email'); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) { toast.error('Please enter a valid email'); return; }

        setLoading(true);
        try {
            const res = await API.post('/newsletter/subscribe', { email });
            toast.success(res.data.message || 'Subscribed successfully!');
            setEmail('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to subscribe. Try again.');
        } finally { setLoading(false); }
    };

    return (
        <footer style={{ backgroundColor: '#f0f0f0', marginTop: '80px' }}>
            {/* Newsletter */}
            <div className="container-main" style={{ transform: 'translateY(-50%)' }}>
                <div style={{
                    backgroundColor: '#000', borderRadius: '24px', padding: '36px 40px',
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px'
                }}>
                    <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(24px, 4vw, 40px)', color: '#fff', lineHeight: 1.15, maxWidth: '500px', fontWeight: 700 }}>
                        STAY UPTO DATE ABOUT OUR LATEST OFFERS
                    </h2>
                    <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '350px' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                style={{ width: '100%', backgroundColor: '#fff', borderRadius: '9999px', padding: '14px 16px 14px 44px', fontSize: '14px', outline: 'none', border: 'none' }}
                            />
                            <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                        </div>
                        <button type="submit" disabled={loading}
                            style={{
                                width: '100%', backgroundColor: '#fff', color: '#000', fontWeight: 500,
                                borderRadius: '9999px', padding: '14px', fontSize: '14px', border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                                transition: 'opacity 0.2s',
                            }}>
                            {loading ? 'Subscribing...' : 'Subscribe to Newsletter'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Footer Content */}
            <div className="container-main" style={{ paddingTop: '0', paddingBottom: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '32px', marginBottom: '48px' }}>
                    {/* Brand Column */}
                    <div style={{ gridColumn: 'span 1' }}>
                        <h3 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>MARKAZ</h3>
                        <p style={{ color: '#737373', fontSize: '13px', lineHeight: 1.7, marginBottom: '20px' }}>
                            Pakistan's premier multi-vendor marketplace. Quality products from trusted sellers, delivered to your doorstep.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <a href="https://twitter.com/markaz_store" target="_blank" rel="noopener noreferrer" style={{
                                width: '32px', height: '32px', border: '1px solid #d4d4d4', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
                                transition: 'all 0.2s', color: '#000',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#000'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#d4d4d4'; }}
                            >
                                <FiTwitter size={14} />
                            </a>
                            <a href="https://facebook.com/markaz.store" target="_blank" rel="noopener noreferrer" style={{
                                width: '32px', height: '32px', border: '1px solid #d4d4d4', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
                                transition: 'all 0.2s', color: '#000',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#000'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#d4d4d4'; }}
                            >
                                <FiFacebook size={14} />
                            </a>
                            <a href="https://instagram.com/markaz.store" target="_blank" rel="noopener noreferrer" style={{
                                width: '32px', height: '32px', border: '1px solid #d4d4d4', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
                                transition: 'all 0.2s', color: '#000',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#000'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#d4d4d4'; }}
                            >
                                <FiInstagram size={14} />
                            </a>
                            <a href="https://wa.me/923115732241" target="_blank" rel="noopener noreferrer" style={{
                                width: '32px', height: '32px', border: '1px solid #d4d4d4', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
                                transition: 'all 0.2s', color: '#000',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#25D366'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#25D366'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#d4d4d4'; }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            </a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    {[
                        { title: 'COMPANY', links: [['About', '/about'], ['Contact', '/contact'], [sellerLabel, sellerLink], ['Brands', '/brands']] },
                        { title: 'HELP', links: [['Customer Support', '/contact'], ['Delivery Details', '/about'], ['Terms & Conditions', '/about'], ['Privacy Policy', '/about']] },
                        { title: 'FAQ', links: [['My Account', '/profile'], ['Track Orders', '/orders'], ['Payments', '/contact'], ['Returns', '/contact']] },
                        { title: 'SHOP', links: [['New Arrivals', '/shop?sort=newest'], ['Top Selling', '/shop?sort=popular'], ['On Sale', '/shop?sort=price_asc'], ['All Products', '/shop']] },
                    ].map(({ title, links }) => (
                        <div key={title}>
                            <h4 style={{ fontWeight: 500, fontSize: '13px', letterSpacing: '2px', marginBottom: '16px', color: '#000' }}>{title}</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {links.map(([label, to]) => (
                                    <li key={label} style={{ marginBottom: '12px' }}>
                                        <Link to={to} style={{ color: '#737373', fontSize: '14px', transition: 'color 0.2s' }}
                                            onMouseEnter={e => e.target.style.color = '#000'}
                                            onMouseLeave={e => e.target.style.color = '#737373'}
                                        >{label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div style={{ borderTop: '1px solid #d4d4d4', paddingTop: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <p style={{ color: '#737373', fontSize: '13px' }}>
                        Markaz &copy; 2024-2026. All Rights Reserved
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['Visa', 'MC', 'PayPal', 'Apple', 'G Pay'].map((p) => (
                            <div key={p} style={{ width: '48px', height: '30px', backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '8px', color: '#737373', fontWeight: 700, textTransform: 'uppercase' }}>{p}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
