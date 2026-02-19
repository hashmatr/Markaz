import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sellerAPI, productAPI } from '../api';
import StarRating from '../components/ui/StarRating';
import Breadcrumb from '../components/ui/Breadcrumb';
import ProductCard from '../components/product/ProductCard';
import { FiMapPin, FiPhone, FiMail, FiGlobe, FiInfo } from 'react-icons/fi';

export default function StorePage() {
    const { slug } = useParams();
    const [seller, setSeller] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        setLoading(true);

        sellerAPI.getBySlug(slug)
            .then(r => {
                const sellerData = r.data.data.seller;
                setSeller(sellerData);

                // Fetch products for this seller
                setLoadingProducts(true);
                productAPI.getAll({ seller: sellerData._id, limit: 20 })
                    .then(pr => {
                        setProducts(pr.data.data.products || []);
                    })
                    .catch(() => setProducts([]))
                    .finally(() => setLoadingProducts(false));
            })
            .catch(() => setSeller(null))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) {
        return (
            <div className="container-main" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
                <div style={{ height: '300px', backgroundColor: '#f5f5f5', borderRadius: '32px', animation: 'pulse 1.5s infinite', marginBottom: '40px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '350px', backgroundColor: '#f5f5f5', borderRadius: '20px', animation: 'pulse 1.5s infinite' }} />)}
                </div>
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="container-main" style={{ paddingTop: '80px', paddingBottom: '80px', textAlign: 'center' }}>
                <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '32px', fontWeight: 700, marginBottom: '16px' }}>Store Not Found</h2>
                <p style={{ color: '#737373', marginBottom: '32px' }}>The store you're looking for doesn't exist or has been closed.</p>
                <Link to="/sellers" className="btn-primary">Browse All Sellers</Link>
            </div>
        );
    }

    return (
        <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '80px' }}>
            <Breadcrumb items={[{ label: 'Sellers', to: '/sellers' }, { label: seller.storeName }]} />

            {/* STORE HEADER */}
            <div style={{
                marginTop: '24px',
                backgroundColor: '#000',
                borderRadius: '32px',
                padding: '48px',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '60px'
            }}>
                {/* Decorative background gradients */}
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)' }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        backgroundColor: '#fff',
                        borderRadius: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '48px',
                        fontWeight: 900,
                        color: '#000',
                        fontFamily: "'Integral CF', sans-serif",
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                    }}>
                        {seller.storeLogo ? (
                            <img src={seller.storeLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '32px' }} />
                        ) : (
                            seller.storeName?.charAt(0)
                        )}
                    </div>

                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                            <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, margin: 0 }}>
                                {seller.storeName}
                            </h1>
                            {seller.isVerified && (
                                <span style={{ backgroundColor: '#01ab31', color: '#fff', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5 7l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    Verified
                                </span>
                            )}
                        </div>

                        <p style={{ fontSize: '16px', opacity: 0.8, lineHeight: 1.6, maxWidth: '700px', marginBottom: '24px' }}>
                            {seller.storeDescription || "Official store on Markaz. We provide top-quality products with exceptional service across Pakistan."}
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <StarRating rating={seller.rating || 0} size={18} />
                                <span style={{ fontWeight: 600, fontSize: '18px' }}>{seller.rating?.toFixed(1) || 'No ratings'}</span>
                                <span style={{ opacity: 0.6, fontSize: '14px' }}>({seller.totalReviews || 0} Reviews)</span>
                            </div>
                            <div style={{ height: '24px', width: '1px', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 600, fontSize: '18px' }}>{seller.totalProducts || 0}</span>
                                <span style={{ opacity: 0.6, fontSize: '14px' }}>Products Live</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '40px', alignItems: 'start' }}>
                {/* PRODUCTS LIST */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '24px', fontWeight: 700 }}>AVAILABLE PRODUCTS</h2>
                        <div style={{ fontSize: '14px', color: '#737373' }}>Showing {products.length} items</div>
                    </div>

                    {loadingProducts ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ height: '350px', backgroundColor: '#f5f5f5', borderRadius: '20px', animation: 'pulse 1.5s infinite' }} />)}
                        </div>
                    ) : products.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#f9f9f9', borderRadius: '24px' }}>
                            <p style={{ color: '#737373' }}>No products found in this store yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                            {products.map(p => <ProductCard key={p._id} product={p} />)}
                        </div>
                    )}
                </div>

                {/* STORE SIDEBAR (Contact & Map) */}
                <aside style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Contact Info Card */}
                    <div style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FiInfo /> Contact Information
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', backgroundColor: '#f5f5f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <FiMail style={{ color: '#000' }} />
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <p style={{ fontSize: '12px', color: '#737373', margin: 0 }}>Email Us</p>
                                    <p style={{ fontSize: '14px', fontWeight: 600, margin: 0, wordBreak: 'break-all' }}>{seller.businessEmail}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', backgroundColor: '#f5f5f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <FiPhone style={{ color: '#000' }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#737373', margin: 0 }}>Call Us</p>
                                    <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{seller.businessPhone || "+92 300 1234567"}</p>
                                </div>
                            </div>

                            {seller.officialWebsite && (
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', backgroundColor: '#f5f5f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FiGlobe style={{ color: '#000' }} />
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <p style={{ fontSize: '12px', color: '#737373', margin: 0 }}>Website</p>
                                        <a href={seller.officialWebsite} target="_blank" rel="noreferrer" style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#000', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>
                                            Visit Link
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Map Card */}
                    <div style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FiMapPin /> Store Location
                        </h3>

                        <p style={{ fontSize: '14px', color: '#525252', lineHeight: 1.5, marginBottom: '20px' }}>
                            {seller.businessDetails?.registeredAddress?.flatNo || "House 123"}, {seller.businessDetails?.registeredAddress?.area || "Phase 6 DHA"}, {seller.businessDetails?.registeredAddress?.city || "Lahore"}, Pakistan
                        </p>

                        <div style={{ height: '200px', backgroundColor: '#eee', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                            {/* Static Map via iframe for demo */}
                            <iframe
                                title="store-location"
                                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d108844.20521191244!2d74.22515082167969!3d31.5204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39190483e58107d9%3A0xc202c607751d974d!2sLahore%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s`}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                            />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
