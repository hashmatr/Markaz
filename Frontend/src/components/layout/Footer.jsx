import { Link } from 'react-router-dom';
import { FiTwitter, FiFacebook, FiInstagram, FiGithub } from 'react-icons/fi';

export default function Footer() {
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '350px' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                style={{ width: '100%', backgroundColor: '#fff', borderRadius: '9999px', padding: '14px 16px 14px 44px', fontSize: '14px', outline: 'none', border: 'none' }}
                            />
                            <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                        </div>
                        <button style={{ width: '100%', backgroundColor: '#fff', color: '#000', fontWeight: 500, borderRadius: '9999px', padding: '14px', fontSize: '14px', border: 'none', cursor: 'pointer' }}>
                            Subscribe to Newsletter
                        </button>
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
                            We have clothes that suits your style and which you're proud to wear. From women to men.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {[FiTwitter, FiFacebook, FiInstagram, FiGithub].map((Icon, i) => (
                                <a key={i} href="#" style={{
                                    width: '32px', height: '32px', border: '1px solid #d4d4d4', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
                                    transition: 'all 0.2s', color: '#000'
                                }}>
                                    <Icon size={14} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns */}
                    {[
                        { title: 'COMPANY', links: [['About', '/about'], ['Features', '/about'], ['Works', '/about'], ['Career', '/about']] },
                        { title: 'HELP', links: [['Customer Support', '/about'], ['Delivery Details', '/about'], ['Terms & Conditions', '/about'], ['Privacy Policy', '/about']] },
                        { title: 'FAQ', links: [['Account', '/profile'], ['Manage Deliveries', '/orders'], ['Orders', '/orders'], ['Payments', '/orders']] },
                        { title: 'RESOURCES', links: [['Free eBooks', '/shop'], ['Development Tutorial', '/shop'], ['How to - Blog', '/shop'], ['Youtube Playlist', '/shop']] },
                    ].map(({ title, links }) => (
                        <div key={title}>
                            <h4 style={{ fontWeight: 500, fontSize: '13px', letterSpacing: '2px', marginBottom: '16px', color: '#000' }}>{title}</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {links.map(([label, to]) => (
                                    <li key={label} style={{ marginBottom: '12px' }}>
                                        <Link to={to} style={{ color: '#737373', fontSize: '14px', transition: 'color 0.2s' }}>{label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div style={{ borderTop: '1px solid #d4d4d4', paddingTop: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <p style={{ color: '#737373', fontSize: '13px' }}>
                        Markaz &copy; 2000-2025. All Rights Reserved
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
