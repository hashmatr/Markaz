import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sellerAPI } from '../api';
import StarRating from '../components/ui/StarRating';
import Breadcrumb from '../components/ui/Breadcrumb';

export default function SellersPage() {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        sellerAPI.getAll({ status: 'active' }).then(r => setSellers(r.data.data.sellers || [])).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const demoSellers = [
        { _id: 's1', storeName: 'Versace Store', storeSlug: 'versace', storeDescription: 'Luxury fashion brand offering premium clothing.', rating: 4.8, totalProducts: 45 },
        { _id: 's2', storeName: 'Urban Wear', storeSlug: 'urban-wear', storeDescription: 'Streetwear and casual fashion for everyday style.', rating: 4.5, totalProducts: 62 },
        { _id: 's3', storeName: 'Elite Fashion', storeSlug: 'elite-fashion', storeDescription: 'Contemporary fashion designed for the modern individual.', rating: 4.2, totalProducts: 31 },
        { _id: 's4', storeName: 'Classic Couture', storeSlug: 'classic-couture', storeDescription: 'Timeless elegance meets modern sophistication.', rating: 4.7, totalProducts: 78 },
    ];

    const displaySellers = sellers.length > 0 ? sellers : demoSellers;

    return (
        <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
            <Breadcrumb items={[{ label: 'Brands & Sellers' }]} />
            <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 700, marginBottom: '32px' }}>OUR SELLERS</h1>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '200px', backgroundColor: '#f0f0f0', borderRadius: '20px', animation: 'pulse 1.5s infinite' }} />)}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {displaySellers.map(seller => (
                        <Link key={seller._id} to={`/store/${seller.storeSlug}`} className="animate-fade-in"
                            style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '28px', display: 'block', transition: 'box-shadow 0.3s' }}>
                            <div style={{ width: '56px', height: '56px', backgroundColor: '#f0f0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '20px', fontWeight: 700, fontFamily: "'Integral CF', sans-serif" }}>
                                {seller.storeName?.charAt(0)}
                            </div>
                            <h3 style={{ fontWeight: 700, fontSize: '17px', marginBottom: '6px' }}>{seller.storeName}</h3>
                            <StarRating rating={seller.rating || 0} size={14} showText />
                            <p style={{ color: '#737373', fontSize: '13px', marginTop: '10px', lineHeight: 1.6 }}>{seller.storeDescription}</p>
                            <p style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '12px' }}>{seller.totalProducts || 0} Products</p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
