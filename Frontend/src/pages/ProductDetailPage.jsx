import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiCheck, FiX } from 'react-icons/fi';
import { FaStar, FaRegStar } from 'react-icons/fa';
import StarRating from '../components/ui/StarRating';
import Breadcrumb from '../components/ui/Breadcrumb';
import ProductCard from '../components/product/ProductCard';
import { productAPI, reviewAPI, stylistAPI, commentAPI } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductComments from '../components/product/ProductComments';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function ProductDetailPage() {
    const { id } = useParams();
    const { addToCart } = useCart();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedColor, setSelectedColor] = useState(0);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedOptions, setSelectedOptions] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('reviews');
    const [loadingCart, setLoadingCart] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);

    // Review form state
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        setSelectedImage(0);
        setSelectedColor(0);
        setQuantity(1);
        setShowAllReviews(false);
        setLoading(true);
        window.scrollTo(0, 0);

        // Always fetch real product from backend
        productAPI.getById(id)
            .then(r => {
                const fetchedProduct = r.data.data.product;
                setProduct(fetchedProduct);

                // Record this view for AI Stylist recommendations
                if (user?._id) {
                    stylistAPI.recordView({ productId: id }).catch(() => { });
                }

                // Set default size (legacy)
                const sizes = fetchedProduct?.sizes;
                if (sizes?.length > 0) {
                    const firstSize = typeof sizes[0] === 'object' ? sizes[0].name : sizes[0];
                    setSelectedSize(firstSize);
                }

                // Initialize default options for the new variant system
                if (fetchedProduct?.variantOptions?.length > 0) {
                    const defaults = {};
                    fetchedProduct.variantOptions.forEach(opt => {
                        if (opt.values?.length > 0) {
                            defaults[opt.name] = opt.values[0];
                        }
                    });
                    setSelectedOptions(defaults);
                }
            })
            .catch(() => setProduct(null))
            .finally(() => setLoading(false));

        reviewAPI.getProductReviews(id)
            .then(r => {
                if (r.data.data.reviews?.length) setReviews(r.data.data.reviews);
                else setReviews([]);
            })
            .catch(() => setReviews([]));

        productAPI.getAll({ limit: 4 })
            .then(r => {
                if (r.data.data.products?.length) {
                    // Filter out current product from related
                    setRelatedProducts(r.data.data.products.filter(p => p._id !== id));
                }
            })
            .catch(() => { });
    }, [id]);

    const handleAddToCart = async () => {
        if (!user) { toast.error('Please login to add items to cart'); return; }
        if (!product) return;

        // Validation: ensure all variant options are selected
        if (product.variantOptions?.length > 0) {
            for (const opt of product.variantOptions) {
                if (!selectedOptions[opt.name]) {
                    toast.error(`Please select ${opt.name}`);
                    return;
                }
            }
        }

        setLoadingCart(true);
        try {
            await addToCart(
                product._id,
                quantity,
                selectedSize,
                product.colors?.[selectedColor] || product.color,
                selectedOptions
            );
            toast.success('Added to cart!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add to cart');
        } finally { setLoadingCart(false); }
    };

    const handleOptionSelect = (optionName, value) => {
        setSelectedOptions(prev => ({
            ...prev,
            [optionName]: value
        }));
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!user) { toast.error('Please login to write a review'); return; }
        if (!reviewForm.comment.trim()) { toast.error('Please write a comment'); return; }
        setSubmittingReview(true);
        try {
            await reviewAPI.create({
                productId: id,
                rating: reviewForm.rating,
                comment: reviewForm.comment,
            });
            toast.success('Review submitted successfully!');
            setShowReviewForm(false);
            setReviewForm({ rating: 5, comment: '' });
            // Refresh reviews
            const r = await reviewAPI.getProductReviews(id);
            if (r.data.data.reviews?.length) setReviews(r.data.data.reviews);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally { setSubmittingReview(false); }
    };

    // Loading state
    if (loading) {
        return (
            <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginTop: '16px' }}>
                    <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                        <div style={{ backgroundColor: '#f0f0f0', borderRadius: '20px', aspectRatio: '1', animation: 'pulse 1.5s infinite' }} />
                    </div>
                    <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                        <div style={{ backgroundColor: '#f0f0f0', height: '40px', borderRadius: '8px', marginBottom: '16px', width: '80%', animation: 'pulse 1.5s infinite' }} />
                        <div style={{ backgroundColor: '#f0f0f0', height: '20px', borderRadius: '8px', marginBottom: '12px', width: '40%', animation: 'pulse 1.5s infinite' }} />
                        <div style={{ backgroundColor: '#f0f0f0', height: '30px', borderRadius: '8px', marginBottom: '24px', width: '30%', animation: 'pulse 1.5s infinite' }} />
                        <div style={{ backgroundColor: '#f0f0f0', height: '60px', borderRadius: '8px', marginBottom: '24px', width: '100%', animation: 'pulse 1.5s infinite' }} />
                    </div>
                </div>
            </div>
        );
    }

    // Product not found
    if (!product) {
        return (
            <div className="container-main" style={{ paddingTop: '64px', paddingBottom: '64px', textAlign: 'center' }}>
                <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>Product Not Found</h2>
                <p style={{ color: '#737373', marginBottom: '24px' }}>The product you're looking for doesn't exist or has been removed.</p>
                <Link to="/shop" className="btn-primary">Browse Shop</Link>
            </div>
        );
    }

    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 6);
    const productImages = product.images?.length > 0 ? product.images : [{ url: 'https://placehold.co/600x600/f0f0f0/999?text=No+Image' }];
    const productColors = product.color ? [product.color] : [];
    const productSizes = product.sizes?.length > 0 ? product.sizes : [];

    return (
        <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
            <Breadcrumb items={[{ label: 'Shop', to: '/shop' }, { label: product.category?.name || 'Products', to: '/shop' }, { label: product.title }]} />

            {/* PRODUCT SECTION */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginTop: '16px' }}>
                {/* Images */}
                <div style={{ flex: '1 1 45%', minWidth: '300px', display: 'flex', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
                        {productImages.map((img, i) => (
                            <button key={i} onClick={() => setSelectedImage(i)}
                                style={{ width: '76px', height: '76px', borderRadius: '12px', overflow: 'hidden', border: selectedImage === i ? '2px solid #000' : '2px solid #e5e5e5', padding: 0, cursor: 'pointer' }}>
                                <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        const currentSrc = e.target.src;
                                        if (currentSrc.includes('/api/proxy/image') || currentSrc.includes('placehold.co')) return;
                                        e.target.src = `${BACKEND_URL}/api/proxy/image?url=${encodeURIComponent(img.url)}`;
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#f0f0f0', borderRadius: '20px', overflow: 'hidden', aspectRatio: '1' }}>
                        <img src={productImages[selectedImage]?.url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                const currentSrc = e.target.src;
                                if (currentSrc.includes('/api/proxy/image') || currentSrc.includes('placehold.co')) return;
                                e.target.src = `${BACKEND_URL}/api/proxy/image?url=${encodeURIComponent(productImages[selectedImage]?.url)}`;
                            }}
                        />
                    </div>
                </div>

                {/* Details */}
                <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                    <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 700, lineHeight: 1.15, marginBottom: '12px' }}>
                        {product.title}
                    </h1>
                    <div style={{ marginBottom: '12px' }}>
                        <StarRating rating={product.rating || 0} size={20} showText />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 700 }}>${product.discountedPrice || product.price}</span>
                        {product.discountPercent > 0 && (
                            <>
                                <span style={{ fontSize: '24px', color: '#a3a3a3', textDecoration: 'line-through' }}>${product.price}</span>
                                <span className="badge-danger" style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '9999px', fontWeight: 500 }}>
                                    -{product.discountPercent}%
                                </span>
                            </>
                        )}
                    </div>
                    <p style={{ color: '#737373', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f0f0f0' }}>
                        {product.description}
                    </p>

                    {/* DYNAMIC VARIANT OPTIONS (The "Selection Filters") */}
                    {product.variantOptions?.length > 0 ? (
                        <div style={{ marginBottom: '4px' }}>
                            {product.variantOptions.map((opt) => (
                                <div key={opt.name} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f0f0f0' }}>
                                    <p style={{ fontSize: '13px', color: '#737373', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Select {opt.name}</span>
                                        {selectedOptions[opt.name] && <span style={{ color: '#000', fontWeight: 600 }}>{selectedOptions[opt.name]}</span>}
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {opt.values.map(val => {
                                            const isSelected = selectedOptions[opt.name] === val;

                                            return (
                                                <button key={val} onClick={() => handleOptionSelect(opt.name, val)}
                                                    style={{
                                                        padding: '10px 20px', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none',
                                                        backgroundColor: isSelected ? '#000' : '#f0f0f0', color: isSelected ? '#fff' : '#000',
                                                        transition: 'all 0.15s',
                                                    }}>
                                                    {val}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* LEGACY FALLBACK: Colors */}
                            {productColors.length > 0 && (
                                <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f0f0f0' }}>
                                    <p style={{ fontSize: '13px', color: '#737373', marginBottom: '12px' }}>Select Colors</p>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {productColors.map((color, i) => (
                                            <button key={i} onClick={() => setSelectedColor(i)}
                                                style={{
                                                    width: '36px', height: '36px', borderRadius: '50%', backgroundColor: color, border: 'none', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    outline: selectedColor === i ? '2px solid #000' : 'none', outlineOffset: '3px',
                                                }}>
                                                {selectedColor === i && <FiCheck style={{ color: '#fff' }} size={16} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* LEGACY FALLBACK: Sizes */}
                            {productSizes.length > 0 && (
                                <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f0f0f0' }}>
                                    <p style={{ fontSize: '13px', color: '#737373', marginBottom: '12px' }}>Choose Size</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {productSizes.map(size => {
                                            const sizeName = typeof size === 'object' ? size.name : size;
                                            return (
                                                <button key={sizeName} onClick={() => setSelectedSize(sizeName)}
                                                    style={{
                                                        padding: '10px 20px', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none',
                                                        backgroundColor: selectedSize === sizeName ? '#000' : '#f0f0f0', color: selectedSize === sizeName ? '#fff' : '#000',
                                                        transition: 'all 0.15s',
                                                    }}>
                                                    {sizeName}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Quantity + Add to Cart */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: '9999px' }}>
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer' }}>
                                <FiMinus size={18} />
                            </button>
                            <span style={{ width: '48px', textAlign: 'center', fontWeight: 500, fontSize: '15px' }}>{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer' }}>
                                <FiPlus size={18} />
                            </button>
                        </div>
                        <button onClick={handleAddToCart} disabled={loadingCart}
                            className="btn-primary" style={{ flex: 1, padding: '16px', fontSize: '15px' }}>
                            {loadingCart ? 'Adding...' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══════════ TABS ═══════════ */}
            <div style={{ marginTop: '64px' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
                    {[{ key: 'details', label: 'Product Details' }, { key: 'reviews', label: 'Rating & Reviews' }, { key: 'qa', label: 'Q&A' }, { key: 'faqs', label: 'FAQs' }].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1, padding: '16px 0', textAlign: 'center', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                                background: 'none', border: 'none', borderBottom: activeTab === tab.key ? '2px solid #000' : '2px solid transparent',
                                color: activeTab === tab.key ? '#000' : '#a3a3a3', transition: 'all 0.2s',
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                    <div style={{ paddingTop: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'Satoshi', sans-serif" }}>
                                All Reviews <span style={{ color: '#a3a3a3', fontWeight: 400, fontSize: '14px' }}>({reviews.length})</span>
                            </h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select style={{ border: '1px solid #e5e5e5', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', outline: 'none', background: '#fff' }}>
                                    <option>Latest</option><option>Highest</option><option>Lowest</option>
                                </select>
                                <button onClick={() => {
                                    if (!user) { toast.error('Please login to write a review'); return; }
                                    setShowReviewForm(true);
                                }} className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>Write a Review</button>
                            </div>
                        </div>

                        {/* Review Form Modal */}
                        {showReviewForm && (
                            <div style={{
                                position: 'fixed', inset: 0, zIndex: 50,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: 'rgba(0,0,0,0.5)',
                            }} onClick={(e) => { if (e.target === e.currentTarget) setShowReviewForm(false); }}>
                                <div style={{
                                    backgroundColor: '#fff', borderRadius: '24px', padding: '32px',
                                    width: '90%', maxWidth: '500px', position: 'relative',
                                    animation: 'slideUp 0.3s ease-out',
                                }}>
                                    <button onClick={() => setShowReviewForm(false)}
                                        style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <FiX size={22} />
                                    </button>
                                    <h3 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Write a Review</h3>
                                    <form onSubmit={handleSubmitReview}>
                                        <div style={{ marginBottom: '20px' }}>
                                            <p style={{ fontSize: '13px', color: '#737373', marginBottom: '8px' }}>Your Rating</p>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                                        {star <= reviewForm.rating
                                                            ? <FaStar size={28} style={{ color: '#fbbf24' }} />
                                                            : <FaRegStar size={28} style={{ color: '#d4d4d4' }} />
                                                        }
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '24px' }}>
                                            <p style={{ fontSize: '13px', color: '#737373', marginBottom: '8px' }}>Your Review</p>
                                            <textarea
                                                value={reviewForm.comment}
                                                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                                placeholder="Share your thoughts about this product..."
                                                required
                                                style={{
                                                    width: '100%', minHeight: '120px', backgroundColor: '#f0f0f0', borderRadius: '12px',
                                                    padding: '14px 16px', fontSize: '14px', outline: 'none', border: '2px solid transparent',
                                                    resize: 'vertical', fontFamily: "'Satoshi', sans-serif",
                                                }}
                                            />
                                        </div>
                                        <button type="submit" disabled={submittingReview} className="btn-primary"
                                            style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
                                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {reviews.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                <p style={{ color: '#737373', fontSize: '14px', marginBottom: '16px' }}>No reviews yet. Be the first to review this product!</p>
                                <button onClick={() => {
                                    if (!user) { toast.error('Please login to write a review'); return; }
                                    setShowReviewForm(true);
                                }} className="btn-outline">Write a Review</button>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                    {displayedReviews.map(review => (
                                        <div key={review._id} style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '24px 28px' }}>
                                            <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
                                                {Array.from({ length: review.rating }, (_, i) => <FaStar key={i} className="star-filled" size={18} />)}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                                <span style={{ fontWeight: 700, fontFamily: "'Satoshi', sans-serif" }}>{review.user?.fullName}</span>
                                                <span style={{ width: '20px', height: '20px', backgroundColor: '#01ab31', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M5 7l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </span>
                                            </div>
                                            <p style={{ color: '#737373', fontSize: '14px', lineHeight: 1.7, marginBottom: '12px' }}>"{review.comment}"</p>
                                            <p style={{ color: '#a3a3a3', fontSize: '12px' }}>
                                                Posted on {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {reviews.length > 6 && (
                                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                                        <button onClick={() => setShowAllReviews(!showAllReviews)} className="btn-outline">
                                            {showAllReviews ? 'Show Less' : 'Load More Reviews'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'details' && (
                    <div style={{ paddingTop: '32px' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <h4 style={{ fontWeight: 700, fontSize: '16px', color: '#000', marginBottom: '12px' }}>About This Product</h4>
                            <p style={{ color: '#525252', lineHeight: 1.8, fontSize: '14px' }}>{product.description}</p>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '32px' }}>
                            {product.brand && (
                                <Link to={`/shop?brand=${encodeURIComponent(product.brand)}`}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9999px', backgroundColor: '#f0f0f0', fontSize: '13px', fontWeight: 600, color: '#000', textDecoration: 'none' }}>
                                    🏷️ {product.brand}
                                </Link>
                            )}
                            {product.category?.name && (
                                <Link to={`/shop?category=${product.category._id}`}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9999px', backgroundColor: '#f0f0f0', fontSize: '13px', fontWeight: 600, color: '#000', textDecoration: 'none' }}>
                                    📂 {product.category.name}
                                </Link>
                            )}
                            {product.rating > 0 && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9999px', backgroundColor: '#fef9c3', fontSize: '13px', fontWeight: 600, color: '#854d0e' }}>
                                    ⭐ {product.rating.toFixed(1)} / 5
                                </span>
                            )}
                        </div>

                        {product.specifications?.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <h4 style={{ fontWeight: 700, fontSize: '16px', color: '#000', marginBottom: '16px' }}>Specifications</h4>
                                <div style={{ border: '1px solid #e5e5e5', borderRadius: '16px', overflow: 'hidden' }}>
                                    {product.specifications.map((spec, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'flex-start',
                                            padding: '14px 20px',
                                            borderBottom: i < product.specifications.length - 1 ? '1px solid #f0f0f0' : 'none',
                                            backgroundColor: i % 2 === 0 ? '#fafafa' : '#fff',
                                        }}>
                                            <span style={{ fontWeight: 600, width: '38%', minWidth: '120px', color: '#374151', fontSize: '13px', flexShrink: 0 }}>
                                                {spec.key}
                                            </span>
                                            <span style={{ color: '#525252', fontSize: '13px', lineHeight: 1.6 }}>
                                                {spec.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Seller Info Card - FIXED AND LINKED */}
                        {product.seller?.storeName && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '16px',
                                padding: '24px', borderRadius: '20px',
                                border: '1px solid #f0f0f0', backgroundColor: '#fafafa',
                                marginBottom: '24px', flexWrap: 'wrap'
                            }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '16px',
                                    backgroundColor: '#000', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '20px' }}>
                                        {product.seller.storeName.charAt(0)}
                                    </span>
                                </div>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <p style={{ fontSize: '12px', color: '#737373', marginBottom: '2px' }}>Sold by</p>
                                    <Link to={`/store/${product.seller.storeSlug}`} style={{ fontWeight: 700, fontSize: '17px', color: '#000', textDecoration: 'none' }}>
                                        {product.seller.storeName}
                                    </Link>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                        <StarRating rating={product.seller.rating || 0} size={12} />
                                        <span style={{ fontSize: '12px', color: '#737373' }}>
                                            {product.seller.rating?.toFixed(1) || '0.0'} Rating
                                        </span>
                                    </div>
                                </div>
                                <Link to={`/store/${product.seller.storeSlug}`} style={{
                                    padding: '12px 24px', borderRadius: '9999px', border: '1px solid #000',
                                    fontSize: '14px', fontWeight: 700, color: '#000', textDecoration: 'none',
                                    backgroundColor: '#fff', transition: 'all 0.2s',
                                }} onMouseEnter={(e) => { e.target.style.backgroundColor = '#000'; e.target.style.color = '#fff'; }}
                                    onMouseLeave={(e) => { e.target.style.backgroundColor = '#fff'; e.target.style.color = '#000'; }}>
                                    View Store
                                </Link>
                            </div>
                        )}

                        {product.tags?.length > 0 && (
                            <div>
                                <h4 style={{ fontWeight: 700, fontSize: '14px', color: '#737373', marginBottom: '10px' }}>TAGS</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {product.tags.map((tag, i) => (
                                        <Link key={i} to={`/shop?search=${encodeURIComponent(tag)}`}
                                            style={{ padding: '6px 14px', borderRadius: '9999px', border: '1px solid #e5e5e5', fontSize: '12px', color: '#525252', textDecoration: 'none', backgroundColor: '#fff' }}>
                                            #{tag}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Q&A Tab (Buyer-Seller Chat) */}
                {activeTab === 'qa' && (
                    <div style={{ paddingTop: '32px' }}>
                        <ProductComments productId={id} sellerId={product?.seller?._id} />
                    </div>
                )}


                {activeTab === 'faqs' && (
                    <div style={{ paddingTop: '32px', maxWidth: '800px' }}>
                        <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>
                            Frequently Asked Questions
                        </h3>
                        {(() => {
                            const specs = product.specifications || [];
                            const getSpec = (key) => specs.find(s => s.key?.toLowerCase().includes(key))?.value;
                            const faqs = [
                                { q: "Is this product genuine?", a: "Yes, all products on Markaz are 100% authentic and sourced directly from verified sellers." },
                                { q: "What is the return policy?", a: "We offer a 7-day easy return policy for this product if it's damaged or not as described." },
                                { q: "How long does shipping take?", a: "Standard shipping takes 3-5 business days across Pakistan." }
                            ];
                            return faqs.map((faq, i) => (
                                <FAQItem key={i} question={faq.q} answer={faq.a} defaultOpen={i === 0} />
                            ));
                        })()}
                    </div>
                )}
            </div>

            {relatedProducts.length > 0 && (
                <section style={{ marginTop: '64px' }}>
                    <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '32px', textAlign: 'center', fontWeight: 700, marginBottom: '40px' }}>
                        YOU MIGHT ALSO LIKE
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                        {relatedProducts.map(p => <ProductCard key={p._id} product={p} />)}
                    </div>
                </section>
            )}
        </div>
    );
}

function FAQItem({ question, answer, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ borderBottom: '1px solid #e5e5e5' }}>
            <button onClick={() => setOpen(!open)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#000' }}>{question}</span>
                <span style={{ fontSize: '18px' }}>{open ? '−' : '+'}</span>
            </button>
            {open && (
                <div style={{ paddingBottom: '18px', fontSize: '14px', color: '#737373', lineHeight: 1.7 }}>
                    {answer}
                </div>
            )}
        </div>
    );
}
