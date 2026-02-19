import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sellerAPI } from '../api';
import StarRating from '../components/ui/StarRating';
import Breadcrumb from '../components/ui/Breadcrumb';

export default function SellersPage() {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Increase limit to 100 to ensure all 14+ sellers are shown
        sellerAPI.getAll({ status: 'active', limit: 100 })
            .then(r => setSellers(r.data.data.sellers || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
            <Breadcrumb items={[{ label: 'Brands & Sellers' }]} />

            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 700, marginBottom: '8px' }}>OUR SELLERS</h1>
                <p style={{ color: '#737373', fontSize: '15px' }}>Discover unique stores and premium products from our community of sellers.</p>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} style={{ height: '320px', backgroundColor: '#f5f5f5', borderRadius: '24px', animation: 'pulse 1.5s infinite' }} />
                    ))}
                </div>
            ) : sellers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏬</div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No Active Sellers Found</h2>
                    <p style={{ color: '#737373' }}>We're currently onboarding new sellers. Check back soon!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {sellers.map((seller, index) => (
                        <Link key={seller._id} to={`/store/${seller.storeSlug}`} className="animate-fade-in"
                            style={{
                                border: '1px solid #f0f0f0',
                                borderRadius: '24px',
                                padding: '32px',
                                display: 'block',
                                transition: 'all 0.3s ease',
                                textDecoration: 'none',
                                color: 'inherit',
                                backgroundColor: '#fff',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                                animationDelay: `${index * 0.05}s`
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
                                e.currentTarget.style.borderColor = '#000';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)';
                                e.currentTarget.style.borderColor = '#f0f0f0';
                            }}
                        >
                            <div style={{
                                width: '64px',
                                height: '64px',
                                backgroundColor: '#f0f0f0',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '20px',
                                fontSize: '24px',
                                fontWeight: 700,
                                fontFamily: "'Integral CF', sans-serif"
                            }}>
                                {seller.storeLogo ? (
                                    <img src={seller.storeLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} />
                                ) : (
                                    seller.storeName?.charAt(0)
                                )}
                            </div>

                            <h3 style={{ fontWeight: 700, fontSize: '19px', marginBottom: '8px', color: '#000' }}>{seller.storeName}</h3>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <StarRating rating={seller.rating || 0} size={14} />
                                <span style={{ fontSize: '13px', color: '#737373', fontWeight: 500 }}>
                                    {seller.rating ? seller.rating.toFixed(1) : 'New'}
                                </span>
                            </div>

                            <p style={{
                                color: '#737373',
                                fontSize: '14px',
                                lineHeight: 1.6,
                                marginBottom: '20px',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                height: '67px'
                            }}>
                                {seller.storeDescription || "A trusted Markaz seller offering high-quality products and excellent service."}
                            </p>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingTop: '20px',
                                borderTop: '1px solid #f5f5f5',
                                marginTop: 'auto'
                            }}>
                                <span style={{ fontSize: '13px', color: '#000', fontWeight: 600 }}>
                                    {seller.totalProducts || 0} Products
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#000', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Visit Store ➔
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
