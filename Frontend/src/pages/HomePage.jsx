import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import ProductCard from '../components/product/ProductCard';
import { productAPI } from '../api';

const demoProducts = [];
const topSelling = [];

const reviews = [
    { name: 'Sarah M.', rating: 5, text: '"I\'m blown away by the quality and style of the clothes I received from Markaz. From casual wear to elegant dresses, every piece I\'ve bought has exceeded my expectations."', verified: true },
    { name: 'Alex K.', rating: 5, text: '"Finding clothes that align with my personal style used to be a challenge until I discovered Markaz. The range of options they offer is truly remarkable, catering to a variety of tastes."', verified: true },
    { name: 'James L.', rating: 5, text: '"As someone who\'s always on the lookout for unique fashion pieces, I\'m thrilled to have stumbled upon Markaz. The selection of clothes is not only diverse but also on-point with the latest trends."', verified: true },
];

export default function HomePage() {
    const [newArrivals, setNewArrivals] = useState(demoProducts);
    const [topProducts, setTopProducts] = useState(topSelling);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const [newRes, topRes] = await Promise.all([
                    productAPI.getAll({ sort: 'newest', limit: 4 }),
                    productAPI.getAll({ sort: 'popular', limit: 4 }),
                ]);
                if (newRes.data.data.products.length >= 0) setNewArrivals(newRes.data.data.products);
                if (topRes.data.data.products.length >= 0) setTopProducts(topRes.data.data.products);
            } catch { }
        };
        fetchProducts();
    }, []);

    return (
        <div>
            {/* ═══════════════════ HERO ═══════════════════ */}
            <section style={{ backgroundColor: '#f2f0f1' }}>
                <div className="container-main" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Text */}
                    <div style={{ flex: '1 1 50%', minWidth: '300px', padding: '48px 0' }}>
                        <h1 style={{
                            fontFamily: "'Integral CF', sans-serif",
                            fontSize: 'clamp(32px, 6vw, 64px)',
                            fontWeight: 800,
                            lineHeight: 1.1,
                            marginBottom: '24px',
                            color: '#000',
                        }}>
                            FIND CLOTHES<br />THAT MATCHES<br />YOUR STYLE
                        </h1>
                        <p style={{ color: '#737373', fontSize: '14px', maxWidth: '480px', lineHeight: 1.7, marginBottom: '32px' }}>
                            Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style.
                        </p>
                        <Link to="/shop" className="btn-primary" style={{ padding: '16px 48px', fontSize: '15px' }}>
                            Shop Now
                        </Link>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', marginTop: '40px' }}>
                            {[
                                { num: '200+', label: 'International Brands' },
                                { num: '2,000+', label: 'High-Quality Products' },
                                { num: '30,000+', label: 'Happy Customers' },
                            ].map(({ num, label }, i) => (
                                <div key={label} style={{ borderRight: i < 2 ? '1px solid #d4d4d4' : 'none', paddingRight: i < 2 ? '32px' : 0 }}>
                                    <p style={{ fontSize: 'clamp(20px, 3vw, 36px)', fontWeight: 700 }}>{num}</p>
                                    <p style={{ color: '#737373', fontSize: '12px' }}>{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Hero Image */}
                    <div style={{ flex: '1 1 40%', minWidth: '280px', position: 'relative' }}>
                        <img
                            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&h=800&fit=crop"
                            alt="Fashion hero"
                            style={{ width: '100%', height: '500px', objectFit: 'cover', objectPosition: 'center top' }}
                        />
                        <div style={{ position: 'absolute', top: '40px', right: '40px', fontSize: '32px', opacity: 0.3 }}>✦</div>
                        <div style={{ position: 'absolute', bottom: '80px', left: '20px', fontSize: '56px', opacity: 0.3 }}>✦</div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════ BRAND BAR ═══════════════════ */}
            <section style={{ backgroundColor: '#000', padding: '20px 0', overflow: 'hidden' }}>
                <div className="container-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'nowrap', overflow: 'hidden' }}>
                    {['VERSACE', 'ZARA', 'GUCCI', 'PRADA', 'Calvin Klein'].map((brand) => (
                        <span key={brand} style={{
                            color: '#fff', fontSize: 'clamp(16px, 2.5vw, 28px)', fontWeight: 700, whiteSpace: 'nowrap',
                            fontFamily: "'Integral CF', sans-serif", opacity: 0.85, cursor: 'pointer', transition: 'opacity 0.2s',
                            flexShrink: 0
                        }}>
                            {brand}
                        </span>
                    ))}
                </div>
            </section>

            {/* ═══════════════════ NEW ARRIVALS ═══════════════════ */}
            <section className="section-pad">
                <div className="container-main">
                    <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(28px, 4vw, 48px)', textAlign: 'center', fontWeight: 700, marginBottom: '48px' }}>
                        NEW ARRIVALS
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                        {newArrivals.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '36px' }}>
                        <Link to="/shop?sort=newest" className="btn-outline" style={{ padding: '14px 48px' }}>
                            View All
                        </Link>
                    </div>
                </div>
            </section>

            <hr style={{ maxWidth: '1200px', margin: '0 auto', border: 'none', borderTop: '1px solid #f0f0f0' }} />

            {/* ═══════════════════ TOP SELLING ═══════════════════ */}
            <section className="section-pad">
                <div className="container-main">
                    <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(28px, 4vw, 48px)', textAlign: 'center', fontWeight: 700, marginBottom: '48px' }}>
                        TOP SELLING
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                        {topProducts.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '36px' }}>
                        <Link to="/shop?sort=popular" className="btn-outline" style={{ padding: '14px 48px' }}>
                            View All
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════ BROWSE BY DRESS STYLE ═══════════════════ */}
            <section className="section-pad">
                <div className="container-main">
                    <div style={{ backgroundColor: '#f0f0f0', borderRadius: '32px', padding: 'clamp(24px, 4vw, 64px)' }}>
                        <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(24px, 4vw, 48px)', textAlign: 'center', fontWeight: 700, marginBottom: '40px' }}>
                            BROWSE BY DRESS STYLE
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 2fr',
                            gridTemplateRows: 'auto auto',
                            gap: '16px',
                        }}>
                            {[
                                { name: 'Casual', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=500&h=300&fit=crop' },
                                { name: 'Formal', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=300&fit=crop' },
                                { name: 'Party', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&h=300&fit=crop' },
                                { name: 'Gym', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop' },
                            ].map(({ name, image }, i) => (
                                <Link
                                    key={name}
                                    to={`/shop?search=${name.toLowerCase()}`}
                                    style={{
                                        position: 'relative',
                                        height: '220px',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        gridColumn: i === 1 || i === 2 ? 'span 1' : 'span 1',
                                    }}
                                >
                                    <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }} />
                                    <h3 style={{
                                        position: 'absolute', top: '20px', left: '24px',
                                        color: '#000', fontSize: 'clamp(18px, 2.5vw, 28px)', fontWeight: 700,
                                        fontFamily: "'Satoshi', sans-serif",
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                        padding: '4px 12px',
                                        borderRadius: '8px'
                                    }}>{name}</h3>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════ HAPPY CUSTOMERS ═══════════════════ */}
            <section className="section-pad" style={{ paddingBottom: '100px' }}>
                <div className="container-main">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
                        <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(24px, 4vw, 48px)', fontWeight: 700 }}>
                            OUR HAPPY CUSTOMERS
                        </h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #d4d4d4', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FiArrowLeft size={18} />
                            </button>
                            <button style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #d4d4d4', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FiArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {reviews.map((review, i) => (
                            <div key={i} style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '28px 32px' }}>
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                                    {Array.from({ length: review.rating }, (_, j) => (
                                        <FaStar key={j} className="star-filled" size={20} />
                                    ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                                    <span style={{ fontWeight: 700, fontFamily: "'Satoshi', sans-serif", fontSize: '16px' }}>{review.name}</span>
                                    {review.verified && (
                                        <span style={{ width: '20px', height: '20px', backgroundColor: '#01ab31', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M5 7l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </span>
                                    )}
                                </div>
                                <p style={{ color: '#737373', fontSize: '14px', lineHeight: 1.7 }}>{review.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
