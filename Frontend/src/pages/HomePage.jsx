import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiArrowLeft, FiZap, FiUsers, FiBarChart2, FiHeart, FiChevronRight, FiChevronLeft, FiPause, FiPlay } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import ProductCard from '../components/product/ProductCard';
import FlashSalesProducts from '../components/product/FlashSalesProducts';
import FlashSalesBanner from '../components/ui/FlashSalesBanner';
import { useAuth } from '../context/AuthContext';
import { productAPI, categoryAPI, flashSaleAPI } from '../api';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import ParallaxSection from '../components/animation/ParallaxSection';

/* ════════════════════════════════════════════
   HERO SLIDES — eBay-style promotional carousel
   ════════════════════════════════════════════ */
const heroSlides = [
    {
        id: 0,
        title: '20% OFF YOUR FIRST ORDER',
        subtitle: 'Special welcome offer for new members. Join Markaz and save big on your first purchase!',
        cta: 'Claim offer',
        ctaLink: '/shop',
        bg: '#0047ab',
        textColor: '#fff',
        cards: [
            { label: 'Shop All', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop' },
            { label: 'New Arrivals', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=300&fit=crop' },
            { label: 'Best Sellers', img: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=300&h=300&fit=crop' },
        ],
    },
    {
        id: 1,
        title: 'Top tech for your ride',
        subtitle: 'Explore in-car entertainment, GPS, security devices, and more.',
        cta: 'Shop now',
        ctaLink: '/shop?search=electronics',
        bg: '#f5f5f5',
        textColor: '#000',
        cards: [
            { label: 'Entertainment', img: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=300&h=300&fit=crop' },
            { label: 'GPS', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=300&fit=crop' },
            { label: 'Security devices', img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=300&h=300&fit=crop' },
        ],
    },
    {
        id: 2,
        title: 'Endless accessories. Epic prices.',
        subtitle: 'Browse millions of upgrades for your style, home, and tech.',
        cta: 'Shop now',
        ctaLink: '/shop?search=accessories',
        bg: '#1a1a1a',
        textColor: '#fff',
        cards: [
            { label: 'Headphones', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop' },
            { label: 'Watches', img: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=300&fit=crop' },
            { label: 'Bags', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop' },
        ],
    },
    {
        id: 3,
        title: 'Your home, your style',
        subtitle: 'Discover furniture, decor, kitchen essentials, and more.',
        cta: 'Shop now',
        ctaLink: '/shop?search=home',
        bg: '#f0ebe3',
        textColor: '#000',
        cards: [
            { label: 'Furniture', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop' },
            { label: 'Decor', img: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=300&h=300&fit=crop' },
            { label: 'Kitchen', img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop' },
        ],
    },
    {
        id: 4,
        title: 'Fashion for everyone',
        subtitle: 'Trending styles from top brands — clothing, shoes, and more.',
        cta: 'Shop now',
        ctaLink: '/shop?search=fashion',
        bg: '#fdf2f8',
        textColor: '#000',
        cards: [
            { label: 'Clothing', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop' },
            { label: 'Shoes', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop' },
            { label: 'Jewelry', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&h=300&fit=crop' },
        ],
    },
];

const trendingCategories = [
    { name: 'Electronics', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop', search: 'electronics' },
    { name: 'Motors', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=200&fit=crop', search: 'motors' },
    { name: 'Luxury', img: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=200&h=200&fit=crop', search: 'luxury' },
    { name: 'Collectibles & Art', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&h=200&fit=crop', search: 'collectibles' },
    { name: 'Home & Garden', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop', search: 'home garden' },
    { name: 'Fashion', img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop', search: 'fashion' },
    { name: 'Health & Beauty', img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop', search: 'health beauty' },
    { name: 'Sports', img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=200&h=200&fit=crop', search: 'sports' },
    { name: 'Toys & Games', img: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=200&h=200&fit=crop', search: 'toys' },
    { name: 'Books', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=200&fit=crop', search: 'books' },
    { name: 'Pet Supplies', img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop', search: 'pets' },
    { name: 'Musical Instruments', img: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop', search: 'instruments' },
];

const techCategories = [
    { name: 'Laptops', img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop', search: 'laptops' },
    { name: 'Computer Parts', img: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&h=200&fit=crop', search: 'computer parts' },
    { name: 'Smartphones', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=200&h=200&fit=crop', search: 'smartphones' },
    { name: 'Networking', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&h=200&fit=crop', search: 'networking' },
    { name: 'Tablets', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&h=200&fit=crop', search: 'tablets' },
    { name: 'Storage', img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=200&h=200&fit=crop', search: 'storage' },
    { name: 'Cameras & Lenses', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&h=200&fit=crop', search: 'cameras' },
    { name: 'Smart Home', img: 'https://images.unsplash.com/photo-1591393223703-56fe1347ac62?w=200&h=200&fit=crop', search: 'smart home' },
    { name: 'Audio', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop', search: 'audio' },
    { name: 'Video Games', img: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=200&h=200&fit=crop', search: 'video games' },
    { name: 'Wearable Tech', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop', search: 'wearables' },
    { name: 'Monitors', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200&h=200&fit=crop', search: 'monitors' },
];

const browseCategories = [
    { name: 'Electronics', desc: 'Gadgets & devices', img: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&h=400&fit=crop', search: 'electronics', span: 2 },
    { name: 'Fashion', desc: 'Clothing & accessories', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=400&fit=crop', search: 'fashion', span: 1 },
    { name: 'Home & Garden', desc: 'Furniture & decor', img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop', search: 'home garden', span: 1 },
    { name: 'Sports', desc: 'Equipment & gear', img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop', search: 'sports', span: 2 },
];

const reviews = [
    { name: 'Ahmed R.', rating: 5, text: '"Markaz has become my go-to marketplace. I\'ve bought electronics, home items, and fashion — all at great prices with fast delivery!"', verified: true },
    { name: 'Fatima K.', rating: 5, text: '"The variety is incredible! I found everything from a new laptop to kitchen appliances. The seller verification gives me confidence."', verified: true },
    { name: 'Hassan M.', rating: 5, text: '"As a seller, Markaz has transformed my business. The platform is easy to use and I\'m reaching customers I never could before."', verified: true },
    { name: 'Ayesha T.', rating: 4, text: '"Excellent customer service and very high quality products. The delivery was surprising fast and the packaging was premium. Highly recommended!"', verified: true },
];

export default function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Refs for animations
    const heroRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const ctaRef = useRef(null);
    const trendingScrollRef = useRef(null);

    // Page state
    const [newArrivals, setNewArrivals] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [dealsProducts, setDealsProducts] = useState([]);
    const [flashSales, setFlashSales] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const slideTimerRef = useRef(null);

    // GSAP animation for slide changes
    useEffect(() => {
        if (!heroRef.current) return;

        const tl = gsap.timeline();

        // Reset and animate
        tl.fromTo(titleRef.current,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: "power4.out" }
        )
            .fromTo(subtitleRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power4.out" },
                "-=0.7"
            )
            .fromTo(ctaRef.current,
                { scale: 0.9, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" },
                "-=0.5"
            );
    }, [currentSlide]);

    // Data fetching
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const [newRes, topRes, dealsRes] = await Promise.all([
                    productAPI.getAll({ sort: 'newest', limit: 8 }),
                    productAPI.getAll({ sort: 'popular', limit: 8 }),
                    productAPI.getAll({ sort: 'price_asc', limit: 8 }),
                ]);
                if (newRes.data.data.products) setNewArrivals(newRes.data.data.products);
                if (topRes.data.data.products) setTrendingProducts(topRes.data.data.products);
                if (dealsRes.data.data.products) setDealsProducts(dealsRes.data.data.products);
            } catch (err) { console.error("Error fetching products:", err); }
        };
        fetchProducts();

        flashSaleAPI.getActive()
            .then(res => setFlashSales(res.data.data.flashSales || []))
            .catch(err => console.error("Error fetching flash sales:", err));
    }, []);

    // Carousel logic
    const nextSlide = useCallback(() => {
        setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, []);

    const prevSlide = useCallback(() => {
        setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
    }, []);

    useEffect(() => {
        if (isPlaying) {
            slideTimerRef.current = setInterval(nextSlide, 5000);
        }
        return () => clearInterval(slideTimerRef.current);
    }, [isPlaying, nextSlide]);

    const scrollTrending = (dir) => {
        if (trendingScrollRef.current) {
            trendingScrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
        }
    };

    const currentHero = heroSlides[currentSlide];

    return (
        <div style={{ background: '#fff' }}>

            {/* ═══════════════════ HERO CAROUSEL ═══════════════════ */}
            <section ref={heroRef} className="hero-carousel" style={{ backgroundColor: currentHero.bg, transition: 'background-color 0.8s cubic-bezier(0.22, 1, 0.36, 1)', position: 'relative', overflow: 'hidden' }}>
                <div className="container-main" style={{ padding: '0 20px' }}>
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                        minHeight: '440px', padding: '60px 0', gap: '32px',
                    }}>
                        {/* Text side */}
                        <div style={{ flex: '1 1 300px', minWidth: '280px', zIndex: 2 }}>
                            <h1 ref={titleRef} style={{
                                fontFamily: "'Satoshi', sans-serif",
                                fontSize: 'clamp(32px, 5vw, 56px)',
                                fontWeight: 800,
                                lineHeight: 1.1,
                                marginBottom: '20px',
                                color: currentHero.textColor,
                            }}>
                                {currentHero.title}
                            </h1>
                            <p ref={subtitleRef} style={{
                                color: currentHero.textColor === '#fff' ? 'rgba(255,255,255,0.75)' : '#4a4a4a',
                                fontSize: '18px', lineHeight: 1.6, marginBottom: '32px', maxWidth: '450px',
                            }}>
                                {currentHero.subtitle}
                            </p>
                            <Link ref={ctaRef} to={currentHero.ctaLink} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '16px 40px', borderRadius: '9999px',
                                backgroundColor: currentHero.textColor === '#fff' ? '#fff' : '#000',
                                color: currentHero.textColor === '#fff' ? '#000' : '#fff',
                                fontSize: '15px', fontWeight: 700, transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                textDecoration: 'none'
                            }}
                                className="hover:scale-105 active:scale-95">
                                {currentHero.cta} <FiArrowRight />
                            </Link>
                        </div>

                        {/* Product cards side */}
                        <div style={{
                            flex: '1 1 400px', display: 'flex', gap: '32px',
                            justifyContent: 'center', flexWrap: 'wrap',
                        }}>
                            <AnimatePresence mode="popLayout">
                                {currentHero.cards.map((card, idx) => (
                                    <motion.div
                                        key={`${currentSlide}-${idx}`}
                                        initial={{ opacity: 0, scale: 0.8, y: 40 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                        transition={{
                                            duration: 0.8,
                                            delay: idx * 0.1,
                                            ease: [0.22, 1, 0.36, 1]
                                        }}
                                        style={{
                                            width: '160px', backgroundColor: 'rgba(255,255,255,0.15)',
                                            backdropFilter: 'blur(10px)',
                                            borderRadius: '24px', padding: '16px',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            cursor: 'pointer'
                                        }}
                                        whileHover={{ y: -10, backgroundColor: 'rgba(255,255,255,0.25)' }}
                                    >
                                        <div style={{
                                            width: '120px', height: '120px', borderRadius: '18px',
                                            overflow: 'hidden', marginBottom: '12px',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                                        }}>
                                            <motion.img
                                                src={card.img}
                                                alt={card.label}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                whileHover={{ scale: 1.15 }}
                                                transition={{ duration: 0.6 }}
                                            />
                                        </div>
                                        <p style={{
                                            fontSize: '13px', fontWeight: 700,
                                            color: currentHero.textColor, textAlign: 'center'
                                        }}>
                                            {card.label}
                                        </p>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Carousel controls */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingBottom: '20px',
                    }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {heroSlides.map((_, i) => (
                                <button key={i} onClick={() => setCurrentSlide(i)}
                                    style={{
                                        width: i === currentSlide ? '24px' : '8px',
                                        height: '8px',
                                        borderRadius: '9999px',
                                        backgroundColor: currentHero.textColor === '#fff'
                                            ? (i === currentSlide ? '#fff' : 'rgba(255,255,255,0.3)')
                                            : (i === currentSlide ? '#000' : '#d4d4d4'),
                                        border: 'none', cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button onClick={prevSlide} className="carousel-btn"
                                style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    border: `1px solid ${currentHero.textColor === '#fff' ? 'rgba(255,255,255,0.3)' : '#d4d4d4'}`,
                                    background: 'transparent', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: currentHero.textColor,
                                }}>
                                <FiChevronLeft size={18} />
                            </button>
                            <button onClick={nextSlide} className="carousel-btn"
                                style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    border: `1px solid ${currentHero.textColor === '#fff' ? 'rgba(255,255,255,0.3)' : '#d4d4d4'}`,
                                    background: 'transparent', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: currentHero.textColor,
                                }}>
                                <FiChevronRight size={18} />
                            </button>
                            <button onClick={() => setIsPlaying(!isPlaying)}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    border: `1px solid ${currentHero.textColor === '#fff' ? 'rgba(255,255,255,0.3)' : '#d4d4d4'}`,
                                    background: 'transparent', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: currentHero.textColor,
                                }}>
                                {isPlaying ? <FiPause size={14} /> : <FiPlay size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════ FLASH SALES COUNTDOWN ═══════════════════ */}
            <FlashSalesBanner flashSales={flashSales} />

            {/* ═══════════════════ FLASH SALES PRODUCTS ═══════════════════ */}
            <FlashSalesProducts flashSales={flashSales} />

            {/* ═══════════════════ TRENDING ON MARKAZ ═══════════════════ */}
            <section className="section-pad" style={{ paddingTop: '8px', paddingBottom: '32px' }}>
                <div className="container-main">
                    <h2 style={{
                        fontFamily: "'Satoshi', sans-serif", fontSize: '22px',
                        fontWeight: 700, marginBottom: '28px', color: '#000',
                    }}>
                        Trending on Markaz
                    </h2>
                    <div style={{
                        display: 'flex', gap: '24px', overflowX: 'auto',
                        paddingBottom: '8px', scrollbarWidth: 'none',
                    }} className="scrollbar-hide">
                        {trendingCategories.map((cat) => (
                            <Link key={cat.name} to={`/shop?search=${cat.search}`}
                                style={{ textAlign: 'center', flex: '0 0 auto', cursor: 'pointer', textDecoration: 'none' }}
                                className="trending-cat-hover">
                                <div style={{
                                    width: '120px', height: '120px', borderRadius: '50%',
                                    overflow: 'hidden', backgroundColor: '#f5f5f5',
                                    margin: '0 auto 10px', transition: 'transform 0.3s, box-shadow 0.3s',
                                }}>
                                    <img src={cat.img} alt={cat.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        loading="lazy" />
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 500, color: '#000' }}>
                                    {cat.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section >

            {/* ═══════════════════ TRENDING PRODUCTS (Scrollable) ═══════════════════ */}
            {trendingProducts.length > 0 && (
                <section style={{ paddingBottom: '48px' }}>
                    <div className="container-main">
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: '24px',
                        }}>
                            <h2 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '22px', fontWeight: 700 }}>
                                Trending Products
                            </h2>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => scrollTrending(-1)} className="carousel-btn"
                                    style={{
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        border: '1px solid #d4d4d4', background: '#fff',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                    <FiChevronLeft size={18} />
                                </button>
                                <button onClick={() => scrollTrending(1)} className="carousel-btn"
                                    style={{
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        border: '1px solid #d4d4d4', background: '#fff',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                    <FiChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                        <div ref={trendingScrollRef} className="scrollbar-hide"
                            style={{
                                display: 'flex', gap: '16px', overflowX: 'auto',
                                scrollSnapType: 'x mandatory', paddingBottom: '8px',
                            }}>
                            {trendingProducts.map((product) => (
                                <div key={product._id} style={{
                                    flex: '0 0 220px', scrollSnapAlign: 'start',
                                }}>
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════════════ TECH CATEGORIES — "The future in your hands" ═══════════════════ */}
            <section style={{ padding: '48px 0', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                <div className="container-main">
                    <h2 style={{
                        fontFamily: "'Satoshi', sans-serif", fontSize: '22px',
                        fontWeight: 700, marginBottom: '32px', color: '#000',
                    }}>
                        The future in your hands
                    </h2>
                    <div style={{
                        display: 'flex', gap: '20px', overflowX: 'auto',
                        paddingBottom: '8px',
                    }} className="scrollbar-hide">
                        {techCategories.map((cat) => (
                            <Link key={cat.name} to={`/shop?search=${cat.search}`}
                                style={{ textAlign: 'center', flex: '0 0 auto', cursor: 'pointer', textDecoration: 'none' }}
                                className="trending-cat-hover">
                                <div style={{
                                    width: '130px', height: '130px', borderRadius: '50%',
                                    overflow: 'hidden', backgroundColor: '#f0f0f0',
                                    margin: '0 auto 10px', transition: 'transform 0.3s, box-shadow 0.3s',
                                }}>
                                    <img src={cat.img} alt={cat.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        loading="lazy" />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 500, color: '#000', maxWidth: '120px', display: 'block', margin: '0 auto' }}>
                                    {cat.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════ CINEMATIC PARALLAX SECTION ═══════════════════ */}
            <ParallaxSection
                bgImage="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=900&fit=crop"
                height="50vh"
            >
                <h2 style={{
                    fontFamily: "'Integral CF', sans-serif",
                    fontSize: 'clamp(32px, 6vw, 64px)',
                    fontWeight: 900,
                    lineHeight: 1,
                    marginBottom: '16px',
                    textTransform: 'uppercase'
                }}>
                    Millions of Products
                </h2>
                <p style={{
                    fontSize: 'clamp(16px, 2vw, 20px)',
                    fontWeight: 500,
                    opacity: 0.9,
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    Everything you need, delivered with premium speed and care across the nation.
                </p>
            </ParallaxSection>

            {/* ═══════════════════ NEW ARRIVALS ═══════════════════ */}
            <section className="section-pad">
                <div className="container-main">
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: '32px',
                    }}>
                        <h2 style={{
                            fontFamily: "'Integral CF', sans-serif",
                            fontSize: 'clamp(24px, 4vw, 36px)',
                            fontWeight: 700,
                        }}>
                            NEW ARRIVALS
                        </h2>
                        <Link to="/shop?sort=newest" style={{
                            fontSize: '14px', fontWeight: 600, color: '#000',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            textDecoration: 'none'
                        }}>
                            See all <FiArrowRight size={16} />
                        </Link>
                    </div>
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '20px',
                        }}
                    >
                        {newArrivals.slice(0, 8).map((product) => (
                            <motion.div
                                key={product._id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    show: { opacity: 1, y: 0 }
                                }}
                            >
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            <hr style={{ maxWidth: '1400px', margin: '0 auto', border: 'none', borderTop: '1px solid #f0f0f0' }} />

            {/* ═══════════════════ TOP SELLING ═══════════════════ */}
            <section className="section-pad">
                <div className="container-main">
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: '32px',
                    }}>
                        <h2 style={{
                            fontFamily: "'Integral CF', sans-serif",
                            fontSize: 'clamp(24px, 4vw, 36px)',
                            fontWeight: 700,
                        }}>
                            TOP SELLING
                        </h2>
                        <Link to="/shop?sort=popular" style={{
                            fontSize: '14px', fontWeight: 600, color: '#000',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            textDecoration: 'none'
                        }}>
                            See all <FiArrowRight size={16} />
                        </Link>
                    </div>
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '20px',
                        }}
                    >
                        {dealsProducts.slice(0, 8).map((product) => (
                            <motion.div
                                key={product._id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    show: { opacity: 1, y: 0 }
                                }}
                            >
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════ BROWSE BY CATEGORY (Grid) ═══════════════════ */}
            <section className="section-pad">
                <div className="container-main">
                    <div style={{
                        backgroundColor: '#f5f5f5', borderRadius: '32px',
                        padding: 'clamp(24px, 4vw, 56px)',
                    }}>
                        <h2 style={{
                            fontFamily: "'Integral CF', sans-serif",
                            fontSize: 'clamp(24px, 4vw, 42px)',
                            textAlign: 'center', fontWeight: 700, marginBottom: '40px',
                        }}>
                            BROWSE BY CATEGORY
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '16px',
                        }}>
                            {browseCategories.map(({ name, desc, img, search, span }) => (
                                <Link key={name} to={`/shop?search=${search}`}
                                    className="browse-card"
                                    style={{
                                        position: 'relative', height: '240px', borderRadius: '20px',
                                        overflow: 'hidden', gridColumn: window.innerWidth > 768 ? `span ${span}` : 'span 1',
                                        textDecoration: 'none'
                                    }}>
                                    <img src={img} alt={name} style={{
                                        width: '100%', height: '100%', objectFit: 'cover',
                                        transition: 'transform 0.6s ease',
                                    }} loading="lazy" />
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                                    }} />
                                    <div style={{
                                        position: 'absolute', bottom: '24px', left: '24px',
                                    }}>
                                        <h3 style={{
                                            color: '#fff', fontSize: 'clamp(18px, 2.5vw, 26px)',
                                            fontWeight: 700, fontFamily: "'Satoshi', sans-serif",
                                            marginBottom: '4px',
                                        }}>{name}</h3>
                                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{desc}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════ HAPPY CUSTOMERS ═══════════════════ */}
            <section className="section-pad" style={{ paddingBottom: '48px' }}>
                <div className="container-main">
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: '40px', flexWrap: 'wrap', gap: '16px',
                    }}>
                        <h2 style={{
                            fontFamily: "'Integral CF', sans-serif",
                            fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 700,
                        }}>
                            OUR HAPPY CUSTOMERS
                        </h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                border: '1px solid #d4d4d4', background: '#fff',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <FiArrowLeft size={18} />
                            </button>
                            <button style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                border: '1px solid #d4d4d4', background: '#fff',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <FiArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '20px',
                    }}>
                        {reviews.map((review, i) => (
                            <div key={i} style={{
                                border: '1px solid #e5e5e5', borderRadius: '20px',
                                padding: '28px 32px', transition: 'box-shadow 0.3s, transform 0.3s',
                            }}
                                className="review-card-hover">
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                                    {Array.from({ length: review.rating }, (_, j) => (
                                        <FaStar key={j} style={{ color: '#FFC107' }} size={20} />
                                    ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                                    <span style={{ fontWeight: 700, fontFamily: "'Satoshi', sans-serif", fontSize: '16px' }}>
                                        {review.name}
                                    </span>
                                    {review.verified && (
                                        <span style={{
                                            width: '20px', height: '20px', backgroundColor: '#01ab31',
                                            borderRadius: '50%', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                                                <path d="M5 7l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                                <p style={{ color: '#737373', fontSize: '14px', lineHeight: 1.7 }}>{review.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════ BECOME A SELLER ═══════════════════ */}
            <section className="section-pad">
                <div className="container-main">
                    <div style={{
                        background: 'linear-gradient(135deg, #000 0%, #1a1a2e 50%, #16213e 100%)',
                        borderRadius: '32px', padding: 'clamp(32px, 5vw, 64px)',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.04) 0%, transparent 50%)',
                        }} />
                        <div style={{
                            position: 'relative', zIndex: 1, display: 'flex',
                            flexWrap: 'wrap', alignItems: 'center', gap: 40,
                        }}>
                            <div style={{ flex: '1 1 400px', minWidth: 280 }}>
                                <span style={{
                                    fontSize: 12, fontWeight: 600,
                                    color: 'rgba(255,255,255,0.5)',
                                    textTransform: 'uppercase', letterSpacing: 3,
                                }}>
                                    Start Selling Today
                                </span>
                                <h2 style={{
                                    fontFamily: "'Integral CF', sans-serif",
                                    fontSize: 'clamp(24px, 4vw, 42px)',
                                    fontWeight: 700, color: '#fff', lineHeight: 1.15,
                                    margin: '12px 0 20px',
                                }}>
                                    GROW YOUR BUSINESS WITH MARKAZ
                                </h2>
                                <p style={{
                                    color: 'rgba(255,255,255,0.7)', fontSize: 15,
                                    lineHeight: 1.8, marginBottom: 28, maxWidth: 520,
                                }}>
                                    Join hundreds of successful sellers on Pakistan's fastest-growing marketplace.
                                    Sell anything — electronics, fashion, home goods, and more.
                                    Reach millions of customers and watch your business grow.
                                </p>
                                <Link to={user?.role === 'SELLER' ? '/seller/dashboard' : '/become-seller'}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '16px 40px', borderRadius: 9999,
                                        backgroundColor: '#fff', color: '#000',
                                        fontSize: 15, fontWeight: 600, textDecoration: 'none',
                                    }}>
                                    {user?.role === 'SELLER' ? 'Seller Dashboard' : 'Start Selling'} <FiArrowRight size={18} />
                                </Link>
                            </div>
                            <div style={{
                                flex: '1 1 300px', minWidth: 260,
                                display: 'flex', flexDirection: 'column', gap: 16,
                            }}>
                                {[
                                    { icon: <FiZap size={24} color="#fff" />, title: 'Sell Anything', desc: 'From electronics to fashion — list any product and start earning immediately.' },
                                    { icon: <FiUsers size={24} color="#fff" />, title: 'Millions of Customers', desc: 'Access our growing customer base across Pakistan with instant exposure.' },
                                    { icon: <FiBarChart2 size={24} color="#fff" />, title: 'Powerful Analytics', desc: 'Track sales, manage inventory, and optimize your business with real-time insights.' },
                                ].map(({ icon, title, desc }) => (
                                    <div key={title} style={{
                                        display: 'flex', gap: 16, padding: '20px 24px',
                                        borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}>
                                        <span style={{ fontSize: 28, flexShrink: 0 }}>{icon}</span>
                                        <div>
                                            <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</h4>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
