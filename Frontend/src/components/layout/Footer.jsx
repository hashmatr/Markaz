import { Link } from 'react-router-dom';
import { FiTwitter, FiFacebook, FiInstagram } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export default function Footer() {
    const { user } = useAuth();

    const sellerLink = user?.role === 'SELLER' ? '/seller/dashboard' : '/become-seller';
    const sellerLabel = user?.role === 'SELLER' ? 'Seller Dashboard' : 'Become a Seller';

    return (
        <footer style={{ backgroundColor: '#f0f0f0', marginTop: '160px' }}>
            {/* Promotional Banner */}
            <div className="container-main" style={{ transform: 'translateY(-50%)' }}>
                <div style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                    borderRadius: '24px', padding: 'clamp(32px, 5vw, 48px)',
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '32px',
                    overflow: 'hidden', position: 'relative',
                }}>
                    <div style={{
                        position: 'absolute', top: '-50%', right: '-10%',
                        width: '400px', height: '400px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
                    }} />
                    <div style={{ flex: '1 1 300px', zIndex: 1 }}>
                        <h2 style={{
                            fontFamily: "'Integral CF', sans-serif",
                            fontSize: 'clamp(24px, 4vw, 36px)',
                            fontWeight: 700, color: '#fff', lineHeight: 1.2,
                            marginBottom: '12px',
                        }}>
                            Endless accessories. Epic prices.
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px', maxWidth: '400px', lineHeight: 1.7 }}>
                            Browse millions of products across every category. From tech gadgets to home essentials, find everything you need.
                        </p>
                        <Link to="/shop" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '14px 32px', borderRadius: '9999px',
                            backgroundColor: '#fff', color: '#000',
                            fontSize: '14px', fontWeight: 600,
                        }}>
                            Shop now
                        </Link>
                    </div>
                    <div style={{
                        flex: '1 1 300px', display: 'flex', gap: '12px',
                        justifyContent: 'center', zIndex: 1,
                    }}>
                        {[
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=250&fit=crop',
                            'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200&h=250&fit=crop',
                            'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=200&h=250&fit=crop',
                        ].map((img, i) => (
                            <div key={i} style={{
                                width: '140px', height: '180px', borderRadius: '16px',
                                overflow: 'hidden', backgroundColor: '#fff',
                                transform: i === 1 ? 'rotate(-3deg)' : i === 2 ? 'rotate(3deg)' : 'none',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            }}>
                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Content */}
            <div className="container-main" style={{ paddingTop: '0', paddingBottom: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '32px', marginBottom: '48px' }}>
                    {/* Brand Column */}
                    <div style={{ gridColumn: 'span 1' }}>
                        <h3 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>MARKAZ</h3>
                        <p style={{ color: '#737373', fontSize: '13px', lineHeight: 1.7, marginBottom: '20px' }}>
                            Pakistan's premier multi-vendor marketplace. Everything from electronics to fashion, home & garden to sports — all from trusted sellers.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <a href="https://twitter.com/markaz_store" target="_blank" rel="noopener noreferrer" style={{
                                width: '32px', height: '32px', border: '1px solid #d4d4d4', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
                                transition: 'all 0.2s', color: '#000',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#000'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#d4d4d4'; }}>
                                <FiTwitter size={14} />
                            </a>
                            <a href="https://facebook.com/markaz.store" target="_blank" rel="noopener noreferrer" style={{
                                width: '32px', height: '32px', border: '1px solid #d4d4d4', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
                                transition: 'all 0.2s', color: '#000',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#000'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#d4d4d4'; }}>
                                <FiFacebook size={14} />
                            </a>
                            <a href="https://instagram.com/markaz.store" target="_blank" rel="noopener noreferrer" style={{
                                width: '32px', height: '32px', border: '1px solid #d4d4d4', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
                                transition: 'all 0.2s', color: '#000',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#000'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#d4d4d4'; }}>
                                <FiInstagram size={14} />
                            </a>
                            <a href="https://wa.me/923115732241" target="_blank" rel="noopener noreferrer" style={{
                                width: '32px', height: '32px', border: '1px solid #d4d4d4', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
                                transition: 'all 0.2s', color: '#000',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#25D366'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#25D366'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#d4d4d4'; }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            </a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    {[
                        { title: 'CATEGORIES', links: [['Electronics', '/shop?search=electronics'], ['Fashion', '/shop?search=fashion'], ['Home & Garden', '/shop?search=home garden'], ['Sports', '/shop?search=sports'], ['Motors', '/shop?search=motors']] },
                        { title: 'COMPANY', links: [['About', '/about'], ['Contact', '/contact'], [sellerLabel, sellerLink], ['Brands', '/brands']] },
                        { title: 'HELP', links: [['Customer Support', '/contact'], ['Delivery Details', '/about'], ['Terms & Conditions', '/about'], ['Privacy Policy', '/about']] },
                        { title: 'RESOURCES', links: [['My Account', '/profile'], ['Track Orders', '/orders'], ['All Sellers', '/sellers'], ['All Products', '/shop']] },
                    ].map(({ title, links }) => (
                        <div key={title}>
                            <h4 style={{ fontWeight: 500, fontSize: '13px', letterSpacing: '2px', marginBottom: '16px', color: '#000' }}>{title}</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {links.map(([label, to]) => (
                                    <li key={label} style={{ marginBottom: '12px' }}>
                                        <Link to={to} style={{ color: '#737373', fontSize: '14px', transition: 'color 0.2s' }}
                                            onMouseEnter={e => e.target.style.color = '#000'}
                                            onMouseLeave={e => e.target.style.color = '#737373'}>
                                            {label}
                                        </Link>
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
