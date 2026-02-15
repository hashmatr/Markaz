import { Link } from 'react-router-dom';
import { FiTruck, FiShield, FiHeadphones, FiRefreshCw, FiUsers, FiGlobe, FiPackage, FiAward, FiZap, FiHeart, FiLock, FiStar, FiFeather } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/ui/Breadcrumb';

export default function AboutPage() {
    const { user } = useAuth();
    return (
        <div style={{ paddingBottom: 80 }}>
            {/* Hero */}
            <section style={{
                background: 'linear-gradient(135deg, #000 0%, #1a1a2e 50%, #16213e 100%)',
                color: '#fff', padding: '80px 0', textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(255,255,255,0.03) 0%, transparent 50%)',
                }} />
                <div className="container-main" style={{ position: 'relative', zIndex: 1 }}>
                    <Breadcrumb items={[{ label: 'About Us' }]} />
                    <h1 style={{
                        fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(36px, 6vw, 64px)',
                        fontWeight: 700, marginBottom: 20, lineHeight: 1.1,
                    }}>
                        ABOUT MARKAZ
                    </h1>
                    <p style={{
                        color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(15px, 2vw, 18px)',
                        maxWidth: 640, margin: '0 auto 32px', lineHeight: 1.7,
                    }}>
                        Pakistan's premier multi-vendor e-commerce marketplace connecting quality sellers with millions of shoppers nationwide.
                    </p>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/shop" style={{
                            padding: '14px 36px', borderRadius: 9999, backgroundColor: '#fff', color: '#000',
                            fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s',
                        }}>
                            Shop Now
                        </Link>
                        <Link to={user?.role === 'SELLER' ? '/seller/dashboard' : '/become-seller'} style={{
                            padding: '14px 36px', borderRadius: 9999, border: '1px solid rgba(255,255,255,0.3)',
                            color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s',
                        }}>
                            {user?.role === 'SELLER' ? 'Seller Dashboard' : 'Become a Seller'}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="container-main" style={{ marginTop: -40, marginBottom: 64 }}>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16,
                    background: '#fff', borderRadius: 24, padding: '32px 24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                }}>
                    {[
                        { num: '500+', label: 'Active Sellers', icon: FiUsers },
                        { num: '50K+', label: 'Products Listed', icon: FiPackage },
                        { num: '10K+', label: 'Happy Customers', icon: FiGlobe },
                        { num: '99%', label: 'Satisfaction Rate', icon: FiAward },
                    ].map(({ num, label, icon: Icon }) => (
                        <div key={label} style={{ textAlign: 'center', padding: '16px 0' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 12, backgroundColor: '#f5f5f5',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                            }}>
                                <Icon size={22} />
                            </div>
                            <div style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{num}</div>
                            <div style={{ fontSize: 13, color: '#737373' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Our Story */}
            <section className="container-main" style={{ marginBottom: 80 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center' }}>
                    <div style={{ flex: '1 1 360px', minWidth: 300 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>Our Story</span>
                        <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, margin: '12px 0 20px', lineHeight: 1.15 }}>
                            BUILDING THE FUTURE OF ONLINE SHOPPING
                        </h2>
                        <p style={{ color: '#525252', lineHeight: 1.8, fontSize: 15, marginBottom: 16 }}>
                            Founded with a vision to revolutionize e-commerce in Pakistan, Markaz is a multi-vendor marketplace that empowers local sellers to reach customers across the nation. We believe every entrepreneur deserves a platform to showcase their products.
                        </p>
                        <p style={{ color: '#525252', lineHeight: 1.8, fontSize: 15, marginBottom: 16 }}>
                            Our platform provides sellers with powerful analytics, inventory management, and marketing tools — while offering customers a seamless, secure, and enjoyable shopping experience with thousands of products at competitive prices.
                        </p>
                        <p style={{ color: '#525252', lineHeight: 1.8, fontSize: 15 }}>
                            From fashion to electronics, groceries to home décor — Markaz is your one-stop marketplace. We handle payments, logistics, and customer support so our sellers can focus on what they do best: creating amazing products.
                        </p>
                    </div>
                    <div style={{ flex: '1 1 360px', minWidth: 300 }}>
                        <div style={{
                            borderRadius: 24, overflow: 'hidden',
                            background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                            padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', minHeight: 340,
                        }}>
                            <div style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 72, fontWeight: 800, color: '#000', marginBottom: 16 }}>M</div>
                            <div style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 4 }}>MARKAZ</div>
                            <p style={{ color: '#737373', fontSize: 13, marginTop: 8 }}>Est. 2024 • Pakistan</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Values */}
            <section style={{ backgroundColor: '#fafafa', padding: '80px 0' }}>
                <div className="container-main">
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>What Drives Us</span>
                        <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, margin: '12px 0 0', lineHeight: 1.15 }}>
                            OUR MISSION & VALUES
                        </h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                        {[
                            {
                                title: 'Empowering Sellers',
                                desc: 'We provide powerful tools, analytics, and support to help local businesses thrive in the digital marketplace.',
                                Icon: FiZap,
                            },
                            {
                                title: 'Customer First',
                                desc: 'Every decision we make is centered around delivering the best shopping experience — from discovery to delivery.',
                                Icon: FiHeart,
                            },
                            {
                                title: 'Trust & Transparency',
                                desc: 'We ensure secure payments, genuine products, and honest reviews. Your trust is our most valuable asset.',
                                Icon: FiLock,
                            },
                            {
                                title: 'Innovation',
                                desc: 'We continuously improve our platform with cutting-edge technology to make shopping effortless and enjoyable.',
                                Icon: FiStar,
                            },
                            {
                                title: 'Community',
                                desc: 'We\'re building more than a marketplace — we\'re building a community of passionate sellers and loyal customers.',
                                Icon: FiUsers,
                            },
                            {
                                title: 'Sustainability',
                                desc: 'We promote eco-friendly practices and support local artisans to create a sustainable shopping ecosystem.',
                                Icon: FiFeather,
                            },
                        ].map(({ title, desc, Icon }) => (
                            <div key={title} style={{
                                padding: 28, borderRadius: 20, backgroundColor: '#fff', border: '1px solid #e5e5e5',
                                transition: 'all 0.25s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                            >
                                <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                    <Icon size={22} color="#fff" />
                                </div>
                                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{title}</h3>
                                <p style={{ color: '#737373', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Shop With Us */}
            <section className="container-main" style={{ padding: '80px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>Why Choose Us</span>
                    <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, margin: '12px 0 0', lineHeight: 1.15 }}>
                        WHY SHOP WITH MARKAZ
                    </h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
                    {[
                        { icon: FiTruck, title: 'Fast Delivery', desc: 'Nationwide delivery within 3-7 business days with real-time tracking.' },
                        { icon: FiShield, title: 'Secure Payments', desc: 'Multiple payment options including COD, online banking, and digital wallets.' },
                        { icon: FiHeadphones, title: '24/7 Support', desc: 'Our dedicated support team is always ready to help you with any queries.' },
                        { icon: FiRefreshCw, title: 'Easy Returns', desc: '30-day hassle-free return policy on all products. No questions asked.' },
                    ].map(({ icon: Icon, title, desc }) => (
                        <div key={title} style={{ textAlign: 'center', padding: 28 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: '50%', backgroundColor: '#000',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                            }}>
                                <Icon size={24} color="#fff" />
                            </div>
                            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{title}</h3>
                            <p style={{ color: '#737373', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="container-main">
                <div style={{
                    background: 'linear-gradient(135deg, #000 0%, #1a1a2e 100%)',
                    borderRadius: 24, padding: 'clamp(32px, 5vw, 64px)', textAlign: 'center', color: '#fff',
                }}>
                    <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.15 }}>
                        READY TO START SHOPPING?
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, maxWidth: 500, margin: '0 auto 28px', lineHeight: 1.7 }}>
                        Join thousands of happy customers and discover amazing products from trusted sellers.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/shop" style={{
                            padding: '14px 36px', borderRadius: 9999, backgroundColor: '#fff', color: '#000',
                            fontSize: 14, fontWeight: 600, textDecoration: 'none',
                        }}>
                            Browse Products
                        </Link>
                        <Link to="/contact" style={{
                            padding: '14px 36px', borderRadius: 9999, border: '1px solid rgba(255,255,255,0.3)',
                            color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                        }}>
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
