import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiCheck } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import StarRating from '../components/ui/StarRating';
import Breadcrumb from '../components/ui/Breadcrumb';
import ProductCard from '../components/product/ProductCard';
import { productAPI, reviewAPI } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// All demo products in one place for lookup by _id
const allDemoProducts = {
    '1': { _id: '1', title: 'T-shirt with Tape Details', description: 'A classic T-shirt with tape details on the sleeves. Made from 100% cotton for a comfortable fit. Perfect for everyday casual wear.', images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop' }, { url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=600&fit=crop' }], price: 120, discountedPrice: 120, discountPercent: 0, rating: 4.5, totalReviews: 45, colors: ['#000', '#314F4A', '#31457A'], sizes: ['Small', 'Medium', 'Large', 'X-Large'], category: { name: 'T-shirts' } },
    '2': { _id: '2', title: 'Skinny Fit Jeans', description: 'Slim-fitting jeans in a classic wash. Made with stretch denim for maximum comfort and a flattering silhouette. Perfect for any occasion.', images: [{ url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=600&fit=crop' }], price: 260, discountedPrice: 240, discountPercent: 8, rating: 3.5, totalReviews: 32, colors: ['#1a3a5c', '#000'], sizes: ['Small', 'Medium', 'Large', 'X-Large'], category: { name: 'Jeans' } },
    '3': { _id: '3', title: 'Checkered Shirt', description: 'A timeless checkered shirt crafted from premium cotton. Features a button-down collar and a relaxed fit. Great for layering or wearing on its own.', images: [{ url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=600&fit=crop' }], price: 180, discountedPrice: 180, discountPercent: 0, rating: 4.8, totalReviews: 61, colors: ['#ff0000', '#00c12b', '#0000ff'], sizes: ['Small', 'Medium', 'Large'], category: { name: 'Shirts' } },
    '4': { _id: '4', title: 'Sleeve Striped T-shirt', description: 'A modern striped T-shirt with contrasting sleeve details. Made from soft cotton blend for all-day comfort with a contemporary casual look.', images: [{ url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=600&fit=crop' }], price: 160, discountedPrice: 130, discountPercent: 19, rating: 4.0, totalReviews: 28, colors: ['#314F4A', '#31457A', '#800080'], sizes: ['Small', 'Medium', 'Large', 'X-Large'], category: { name: 'T-shirts' } },
    '5': { _id: '5', title: 'Vertical Striped Shirt', description: 'An elegant vertical striped shirt perfect for both work and casual settings. Features a slim fit design with a button-front closure.', images: [{ url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop' }], price: 232, discountedPrice: 212, discountPercent: 9, rating: 5.0, totalReviews: 54, colors: ['#fff', '#1a3a5c'], sizes: ['Small', 'Medium', 'Large'], category: { name: 'Shirts' } },
    '6': { _id: '6', title: 'Courage Graphic T-shirt', description: 'Express yourself with this bold graphic T-shirt. Features a unique artistic print on premium cotton. A statement piece for your wardrobe.', images: [{ url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=600&fit=crop' }], price: 145, discountedPrice: 145, discountPercent: 0, rating: 4.0, totalReviews: 41, colors: ['#000', '#ff8800'], sizes: ['Small', 'Medium', 'Large', 'X-Large'], category: { name: 'T-shirts' } },
    '7': { _id: '7', title: 'Loose Fit Bermuda Shorts', description: 'Comfortable bermuda shorts with a relaxed loose fit. Perfect for summer outings and casual weekend wear. Made from breathable fabric.', images: [{ url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=600&fit=crop' }], price: 80, discountedPrice: 80, discountPercent: 0, rating: 3.0, totalReviews: 30, colors: ['#314F4A', '#000'], sizes: ['Small', 'Medium', 'Large'], category: { name: 'Shorts' } },
    '8': { _id: '8', title: 'Faded Skinny Jeans', description: 'Trendy faded skinny jeans with a modern wash effect. Crafted from stretch denim for comfort and style. A must-have wardrobe staple.', images: [{ url: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=600&fit=crop' }], price: 210, discountedPrice: 210, discountPercent: 0, rating: 4.5, totalReviews: 55, colors: ['#1a3a5c', '#000'], sizes: ['Small', 'Medium', 'Large', 'X-Large'], category: { name: 'Jeans' } },
    '9': { _id: '9', title: 'Loose Fit Bermuda Shorts', description: 'Comfortable bermuda shorts perfect for summer. Made from lightweight, breathable cotton with a relaxed fit.', images: [{ url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=600&fit=crop' }], price: 80, discountedPrice: 80, discountPercent: 0, rating: 3.0, totalReviews: 30, colors: ['#314F4A'], sizes: ['Small', 'Medium', 'Large'], category: { name: 'Shorts' } },
    'r1': { _id: 'r1', title: 'Polo with Contrast Trims', description: 'A classic polo shirt with contrast trim details. Made from premium piqué cotton for a polished casual look.', images: [{ url: 'https://images.unsplash.com/photo-1625910513413-5fc08ef4e8a1?w=600&h=600&fit=crop' }], price: 242, discountedPrice: 212, discountPercent: 12, rating: 4.0, totalReviews: 43, colors: ['#000', '#314F4A'], sizes: ['Small', 'Medium', 'Large'], category: { name: 'T-shirts' } },
    'r2': { _id: 'r2', title: 'Gradient Graphic T-shirt', description: 'Stand out with this vibrant gradient graphic tee. Premium quality print on soft cotton fabric.', images: [{ url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=600&fit=crop' }], price: 145, discountedPrice: 145, discountPercent: 0, rating: 3.5, totalReviews: 32, colors: ['#ff8800', '#000'], sizes: ['Small', 'Medium', 'Large'], category: { name: 'T-shirts' } },
    'r3': { _id: 'r3', title: 'Polo with Tipping Details', description: 'Refined polo shirt with subtle tipping details on the collar and sleeves. A sophisticated casual essential.', images: [{ url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=600&fit=crop' }], price: 180, discountedPrice: 180, discountPercent: 0, rating: 4.5, totalReviews: 55, colors: ['#31457A', '#000'], sizes: ['Small', 'Medium', 'Large', 'X-Large'], category: { name: 'T-shirts' } },
    'r4': { _id: 'r4', title: 'Black Striped T-shirt', description: 'Classic black striped T-shirt for a timeless casual look. Made from soft blend fabric for everyday comfort.', images: [{ url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=600&fit=crop' }], price: 160, discountedPrice: 120, discountPercent: 25, rating: 5.0, totalReviews: 30, colors: ['#000'], sizes: ['Small', 'Medium', 'Large'], category: { name: 'T-shirts' } },
};

const defaultProduct = allDemoProducts['1']; // fallback

const demoReviews = [
    { _id: '1', user: { fullName: 'Samantha D.' }, rating: 5, comment: 'I absolutely love this t-shirt! The design is unique and the fabric feels so comfortable. I\'ve received so many compliments.', createdAt: '2023-08-14', verified: true },
    { _id: '2', user: { fullName: 'Alex M.' }, rating: 4, comment: 'The t-shirt exceeded my expectations! The colors are vibrant and the print quality is top-notch. Highly recommend.', createdAt: '2023-08-15', verified: true },
    { _id: '3', user: { fullName: 'Ethan R.' }, rating: 5, comment: 'This t-shirt is a must-have for anyone who appreciates good design. The quality is amazing.', createdAt: '2023-08-16', verified: false },
    { _id: '4', user: { fullName: 'Olivia P.' }, rating: 4, comment: 'As a UI/UX enthusiast, I value simplicity and functionality. This t-shirt not only represents those principles but also looks great.', createdAt: '2023-08-17', verified: true },
    { _id: '5', user: { fullName: 'Liam K.' }, rating: 4, comment: 'This t-shirt is a fusion of comfort and creativity. The fabric is soft, and the design speaks volumes.', createdAt: '2023-08-18', verified: false },
    { _id: '6', user: { fullName: 'Ava H.' }, rating: 5, comment: 'I\'m not just wearing a t-shirt; I\'m wearing a piece of design philosophy. It\'s comfortable and stylish.', createdAt: '2023-08-19', verified: true },
];

const demoRelated = [
    allDemoProducts['r1'], allDemoProducts['r2'], allDemoProducts['r3'], allDemoProducts['r4'],
];

// Check if an id looks like a valid MongoDB ObjectId (24 hex characters)
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

export default function ProductDetailPage() {
    const { id } = useParams();
    const { addToCart } = useCart();
    const { user } = useAuth();

    // Determine initial product: if it's a demo ID, use the demo lookup
    const initialProduct = isValidObjectId(id) ? defaultProduct : (allDemoProducts[id] || defaultProduct);

    const [product, setProduct] = useState(initialProduct);
    const [reviews, setReviews] = useState(demoReviews);
    const [relatedProducts, setRelatedProducts] = useState(demoRelated);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedColor, setSelectedColor] = useState(0);
    const [selectedSize, setSelectedSize] = useState('Large');
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('reviews');
    const [loadingCart, setLoadingCart] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);

    useEffect(() => {
        // Reset state
        setSelectedImage(0);
        setSelectedColor(0);
        setQuantity(1);
        setShowAllReviews(false);
        window.scrollTo(0, 0);

        if (isValidObjectId(id)) {
            // Fetch real product from backend
            productAPI.getById(id)
                .then(r => setProduct(r.data.data.product))
                .catch(() => setProduct(defaultProduct));
            reviewAPI.getProductReviews(id)
                .then(r => { if (r.data.data.reviews?.length) setReviews(r.data.data.reviews); else setReviews(demoReviews); })
                .catch(() => setReviews(demoReviews));
            productAPI.getAll({ limit: 4 })
                .then(r => { if (r.data.data.products?.length) setRelatedProducts(r.data.data.products); })
                .catch(() => { });
        } else {
            // Demo product — look up by ID
            const demo = allDemoProducts[id];
            if (demo) {
                setProduct(demo);
            } else {
                setProduct(defaultProduct);
            }
            setReviews(demoReviews);
            setRelatedProducts(demoRelated);
        }
    }, [id]);

    const handleAddToCart = async () => {
        if (!user) { toast.error('Please login to add items to cart'); return; }
        if (!isValidObjectId(product._id)) { toast.error('This is a demo product. Add real products from the shop!'); return; }
        setLoadingCart(true);
        try {
            await addToCart(product._id, quantity, selectedSize, product.colors?.[selectedColor]);
            toast.success('Added to cart!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add to cart');
        } finally { setLoadingCart(false); }
    };

    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 6);
    const productImages = product.images?.length > 0 ? product.images : defaultProduct.images;
    const productColors = product.colors?.length > 0 ? product.colors : ['#314F4A', '#314F4B', '#31457A'];
    const productSizes = product.sizes?.length > 0 ? product.sizes : ['Small', 'Medium', 'Large', 'X-Large'];

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
                                <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </button>
                        ))}
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#f0f0f0', borderRadius: '20px', overflow: 'hidden', aspectRatio: '1' }}>
                        <img src={productImages[selectedImage]?.url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                </div>

                {/* Details */}
                <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                    <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 700, lineHeight: 1.15, marginBottom: '12px' }}>
                        {product.title}
                    </h1>
                    <div style={{ marginBottom: '12px' }}>
                        <StarRating rating={product.rating || 4.5} size={20} showText />
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

                    {/* Colors */}
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

                    {/* Sizes */}
                    <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f0f0f0' }}>
                        <p style={{ fontSize: '13px', color: '#737373', marginBottom: '12px' }}>Choose Size</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {productSizes.map(size => (
                                <button key={size} onClick={() => setSelectedSize(size)}
                                    style={{
                                        padding: '10px 20px', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none',
                                        backgroundColor: selectedSize === size ? '#000' : '#f0f0f0', color: selectedSize === size ? '#fff' : '#000',
                                        transition: 'all 0.15s',
                                    }}>
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

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
                    {[{ key: 'details', label: 'Product Details' }, { key: 'reviews', label: 'Rating & Reviews' }, { key: 'faqs', label: 'FAQs' }].map(tab => (
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
                                <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>Write a Review</button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                            {displayedReviews.map(review => (
                                <div key={review._id} style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '24px 28px' }}>
                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
                                        {Array.from({ length: review.rating }, (_, i) => <FaStar key={i} className="star-filled" size={18} />)}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                        <span style={{ fontWeight: 700, fontFamily: "'Satoshi', sans-serif" }}>{review.user?.fullName}</span>
                                        {review.verified !== false && (
                                            <span style={{ width: '20px', height: '20px', backgroundColor: '#01ab31', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M5 7l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </span>
                                        )}
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
                    </div>
                )}

                {activeTab === 'details' && (
                    <div style={{ paddingTop: '32px', color: '#525252', lineHeight: 1.7, fontSize: '14px' }}>
                        <p>{product.description}</p>
                    </div>
                )}

                {activeTab === 'faqs' && (
                    <div style={{ paddingTop: '32px', color: '#737373', fontSize: '14px' }}>
                        <p>FAQs coming soon...</p>
                    </div>
                )}
            </div>

            {/* ═══════════ RELATED PRODUCTS ═══════════ */}
            <section style={{ marginTop: '64px' }}>
                <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(24px, 4vw, 48px)', textAlign: 'center', fontWeight: 700, marginBottom: '40px' }}>
                    YOU MIGHT ALSO LIKE
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                    {relatedProducts.map(p => <ProductCard key={p._id} product={p} />)}
                </div>
            </section>
        </div>
    );
}
