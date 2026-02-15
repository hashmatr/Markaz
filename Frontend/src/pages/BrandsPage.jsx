import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import Breadcrumb from '../components/ui/Breadcrumb';
import { productAPI } from '../api';

export default function BrandsPage() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        productAPI.getBrands()
            .then(r => setBrands(r.data.data.brands || []))
            .catch(() => setBrands([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = search
        ? brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
        : brands;

    return (
        <div className="container-main" style={{ paddingTop: 24, paddingBottom: 64 }}>
            <Breadcrumb items={[{ label: 'Brands' }]} />

            {/* Hero */}
            <div style={{
                textAlign: 'center', padding: '48px 20px', marginBottom: 40,
                background: 'linear-gradient(135deg, #000 0%, #1a1a2e 50%, #16213e 100%)',
                borderRadius: 24, color: '#fff',
            }}>
                <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, marginBottom: 12 }}>
                    OUR BRANDS
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, maxWidth: 500, margin: '0 auto 28px' }}>
                    Explore products from the top brands available on our platform
                </p>
                <input
                    type="text" placeholder="Search brands..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{
                        width: '100%', maxWidth: 400, padding: '14px 24px',
                        borderRadius: 9999, border: '2px solid rgba(255,255,255,0.2)',
                        backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 14,
                        outline: 'none', backdropFilter: 'blur(10px)',
                    }}
                />
            </div>

            {/* Stats */}
            {!loading && brands.length > 0 && (
                <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div style={{ padding: '14px 28px', borderRadius: 9999, backgroundColor: '#f5f5f5', fontSize: 14, fontWeight: 600 }}>
                        {brands.length} Brands
                    </div>
                    <div style={{ padding: '14px 28px', borderRadius: 9999, backgroundColor: '#f5f5f5', fontSize: 14, fontWeight: 600 }}>
                        {brands.reduce((s, b) => s + b.productCount, 0)} Products
                    </div>
                </div>
            )}

            {/* Brand Grid */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                    {Array.from({ length: 8 }, (_, i) => (
                        <div key={i} style={{ borderRadius: 20, height: 180, backgroundColor: '#f0f0f0', animation: 'pulse 1.5s infinite' }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0' }}>
                    <p style={{ fontSize: 48, marginBottom: 16, color: '#a3a3a3' }}>-</p>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                        {search ? 'No brands found' : 'No brands available yet'}
                    </h3>
                    <p style={{ color: '#737373', fontSize: 14 }}>
                        {search ? 'Try a different search term.' : 'Check back later for new brands.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                    {filtered.map(brand => (
                        <Link key={brand.name}
                            to={`/shop?brand=${encodeURIComponent(brand.name)}`}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                padding: '32px 24px', borderRadius: 20,
                                border: '1px solid #e5e5e5', textDecoration: 'none', color: '#000',
                                transition: 'all 0.25s ease', cursor: 'pointer',
                                background: '#fff', position: 'relative', overflow: 'hidden',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#000'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e5e5e5'; }}
                        >
                            {/* Brand icon */}
                            <div style={{
                                width: 64, height: 64, borderRadius: 16, backgroundColor: '#f5f5f5',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 16, fontSize: 24, fontWeight: 800,
                                fontFamily: "'Integral CF', sans-serif", color: '#000',
                                overflow: 'hidden',
                            }}>
                                {brand.image ? (
                                    <img src={brand.image} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    brand.name.charAt(0).toUpperCase()
                                )}
                            </div>

                            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, fontFamily: "'Satoshi', sans-serif" }}>
                                {brand.name}
                            </h3>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                                <span style={{ color: '#737373' }}>
                                    {brand.productCount} {brand.productCount === 1 ? 'product' : 'products'}
                                </span>
                                {brand.avgRating > 0 && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#737373' }}>
                                        <FaStar size={12} style={{ color: '#fbbf24' }} />
                                        {brand.avgRating}
                                    </span>
                                )}
                            </div>

                            <div style={{
                                marginTop: 16, padding: '8px 20px', borderRadius: 9999,
                                backgroundColor: '#000', color: '#fff', fontSize: 12, fontWeight: 600,
                                transition: 'all 0.2s',
                            }}>
                                View Products →
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
