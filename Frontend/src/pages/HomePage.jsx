import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiArrowLeft, FiZap, FiUsers, FiBarChart2, FiHeart, FiChevronRight, FiChevronLeft, FiPause, FiPlay, FiStar, FiShield } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import ProductCard from '../components/product/ProductCard';
import FlashSalesProducts from '../components/product/FlashSalesProducts';
import FlashSalesBanner from '../components/ui/FlashSalesBanner';
import { useAuth } from '../context/AuthContext';
import { productAPI, categoryAPI, flashSaleAPI } from '../api';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import ParallaxSection from '../components/animation/ParallaxSection';
import SEO from '../components/ui/SEO';

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
        bg: 'linear-gradient(135deg, #0047ab 0%, #002d6b 100%)',
        textColor: '#fff',
        mainImg: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
    },
    {
        id: 1,
        title: 'Top tech for your ride',
        subtitle: 'Explore in-car entertainment, GPS, security devices, and more.',
        cta: 'Shop now',
        ctaLink: '/category/electronics',
        bg: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
        textColor: '#000',
        mainImg: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
    },
    {
        id: 2,
        title: 'Endless accessories. Epic prices.',
        subtitle: 'Browse millions of upgrades for your style, home, and tech.',
        cta: 'Shop now',
        ctaLink: '/category/accessories',
        bg: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
        textColor: '#fff',
        mainImg: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    },
    {
        id: 3,
        title: 'Your home, your style',
        subtitle: 'Discover furniture, decor, kitchen essentials, and more.',
        cta: 'Shop now',
        ctaLink: '/category/home-and-living',
        bg: 'linear-gradient(135deg, #f0ebe3 0%, #d7cec1 100%)',
        textColor: '#000',
        mainImg: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
    },
    {
        id: 4,
        title: 'Fashion for everyone',
        subtitle: 'Trending styles from top brands — clothing, shoes, and more.',
        cta: 'Shop now',
        ctaLink: '/category/fashion',
        bg: 'linear-gradient(135deg, #fdf2f8 0%, #fbcfe8 100%)',
        textColor: '#000',
        mainImg: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=800&q=80',
    },
];

/* ════════════════════════════════════════════
   CATEGORY IMAGE FALLBACKS — mapped by name/keyword
   ════════════════════════════════════════════ */
const categoryImageMap = {
    'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop',
    'fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop',
    'beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop',
    'home': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop',
    'sports': 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=200&h=200&fit=crop',
    'toys': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=200&h=200&fit=crop',
    'books': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=200&fit=crop',
    'furniture': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop',
    'groceries': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop',
    'fragrances': 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=200&h=200&fit=crop',
    'watches': 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=200&h=200&fit=crop',
    'men': 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=200&h=200&fit=crop',
    'women': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&h=200&fit=crop',
    'kids': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop',
    'footwear': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop',
    'accessories': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop',
    'laptops': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop',
    'smartphones': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=200&h=200&fit=crop',
    'mobiles': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=200&h=200&fit=crop',
    'tablets': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&h=200&fit=crop',
    'headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop',
    'gaming': 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=200&h=200&fit=crop',
    'jewellery': 'https://images.unsplash.com/photo-1515562141589-67f0d0da306f?w=200&h=200&fit=crop',
    'jewelery': 'https://images.unsplash.com/photo-1515562141589-67f0d0da306f?w=200&h=200&fit=crop',
    'vehicle': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=200&fit=crop',
    'motorcycle': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',
    'sunglasses': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&h=200&fit=crop',
    'skin': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&h=200&fit=crop',
    'clothes': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=200&fit=crop',
    'anime': 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&h=200&fit=crop',
    'digital': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&h=200&fit=crop',
    'kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
    'decoration': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&h=200&fit=crop',
    'mobile': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=200&h=200&fit=crop',
};

const getCategoryImage = (cat) => {
    // Use category's own image if available
    if (cat.image?.url) return cat.image.url;
    // Try matching by slug keywords
    const slug = (cat.slug || '').toLowerCase();
    const name = (cat.name || '').toLowerCase();
    for (const [key, url] of Object.entries(categoryImageMap)) {
        if (slug.includes(key) || name.includes(key)) return url;
    }
    // Default fallback
    return `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop`;
};

// Browse section — curated larger cards
const browseSectionConfig = [
    { slug: 'electronics', span: 2 },
    { slug: 'fashion', span: 1 },
    { slug: 'home-and-living', span: 1 },
    { slug: 'sports', span: 2 },
    { slug: 'beauty', span: 1 },
    { slug: 'footwear', span: 1 },
];


const reviews = [
    { name: 'Ahmed R.', rating: 5, text: '"Markaz has become my go-to marketplace. I\'ve bought electronics, home items, and fashion — all at great prices with fast delivery!"', verified: true },
    { name: 'Fatima K.', rating: 5, text: '"The variety is incredible! I found everything from a new laptop to kitchen appliances. The seller verification gives me confidence."', verified: true },
    { name: 'Hassan M.', rating: 5, text: '"As a seller, Markaz has transformed my business. The platform is easy to use and I\'m reaching customers I never could before."', verified: true },
    { name: 'Ayesha T.', rating: 4, text: '"Excellent customer service and very high quality products. The delivery was surprising fast and the packaging was premium. Highly recommended!"', verified: true },
];

const FloatingBadge = ({ children, icon: Icon, delay = 0, position = {} }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
            opacity: 1,
            y: [0, -10, 0],
        }}
        transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: delay
        }}
        style={{
            position: 'absolute',
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            padding: '10px 16px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            zIndex: 10,
            whiteSpace: 'nowrap',
            fontSize: '13px',
            fontWeight: 700,
            color: '#000',
            ...position
        }}
    >
        {Icon && <Icon size={16} color="#000" />}
        {children}
    </motion.div>
);

export default function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Mobile detection for responsive layout
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);

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
    const [dbCategories, setDbCategories] = useState([]);
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

        // Fetch categories from DB
        categoryAPI.getAll()
            .then(res => setDbCategories(res.data.data.categories || []))
            .catch(err => console.error("Error fetching categories:", err));

        flashSaleAPI.getActive()
            .then(res => setFlashSales(res.data.data.flashSales || []))
            .catch(err => console.error("Error fetching flash sales:", err));
    }, []);

    // Derive display categories from DB data
    // "Trending" = first 12 root-level categories
    const trendingCategories = dbCategories
        .filter(c => !c.parentCategory)
        .slice(0, 12)
        .map(c => ({ ...c, img: getCategoryImage(c) }));

    // "Tech" = categories with tech-related slugs
    const techSlugs = ['electronics', 'laptops', 'smartphones', 'mobiles', 'tablets', 'headphones', 'gaming', 'digital-cameras', 'smart-watches', 'smart-glasses', 'video-monitors', 'video-game-consoles'];
    const techCategories = dbCategories
        .filter(c => techSlugs.includes(c.slug))
        .slice(0, 12)
        .map(c => ({ ...c, img: getCategoryImage(c) }));

    // "Browse" = curated grid categories
    const browseCategories = browseSectionConfig
        .map(cfg => {
            const cat = dbCategories.find(c => c.slug === cfg.slug);
            if (!cat) return null;
            return { ...cat, img: getCategoryImage(cat).replace('200', '600'), span: cfg.span, desc: cat.description || `Shop ${cat.name}` };
        })
        .filter(Boolean);

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

    const orgSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Markaz",
        "url": window.location.origin,
        "logo": `${window.location.origin}/logo.png`,
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+92-XXX-XXXXXXX",
            "contactType": "customer service"
        }
    };

    return (
        <div style={{ background: '#fff' }}>
            <SEO
                title="Markaz | Best Online Shopping in Pakistan - Multi-Vendor Marketplace"
                description="Shop the latest fashion, electronics, and home essentials at Markaz. Pakistan's top multi-vendor marketplace with fast delivery and secure payments."
                schemaData={orgSchema}
            />
            <section ref={heroRef} className="hero-carousel" style={{
                background: currentHero.bg,
                transition: 'background 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Animated Dynamic Background Blobs */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    <motion.div
                        animate={{
                            x: [0, 50, 0],
                            y: [0, 30, 0],
                            rotate: [0, 90, 0],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        style={{
                            position: 'absolute', top: '-10%', right: '-10%',
                            width: '600px', height: '600px', borderRadius: '50%',
                            background: `radial-gradient(circle, ${currentHero.textColor === '#fff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)'} 0%, transparent 70%)`,
                            filter: 'blur(100px)',
                        }}
                    />
                    <motion.div
                        animate={{
                            x: [0, -40, 0],
                            y: [0, -50, 0],
                            scale: [1, 1.3, 1],
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        style={{
                            position: 'absolute', bottom: '-20%', left: '-10%',
                            width: '500px', height: '500px', borderRadius: '50%',
                            background: `radial-gradient(circle, ${currentHero.textColor === '#fff' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.03)'} 0%, transparent 70%)`,
                            filter: 'blur(80px)',
                        }}
                    />
                </div>

                <div className="container-main" style={{ padding: isMobile ? '0 16px' : '0 20px', position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                        minHeight: isMobile ? '360px' : '500px',
                        padding: isMobile ? '30px 0 20px' : '80px 0 60px',
                        gap: isMobile ? '20px' : '40px',
                    }}>
                        {/* Text side */}
                        <div style={{ flex: isMobile ? '1 1 100%' : '1 1 500px', minWidth: isMobile ? '0' : '300px', zIndex: 2 }}>
                            <motion.span
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={`badge-${currentSlide}`}
                                style={{
                                    display: 'inline-block', padding: '6px 16px', borderRadius: '9999px',
                                    backgroundColor: currentHero.textColor === '#fff' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
                                    backdropFilter: 'blur(10px)',
                                    fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: currentHero.textColor,
                                    marginBottom: '20px', textTransform: 'uppercase',
                                    border: `1px solid ${currentHero.textColor === '#fff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`
                                }}
                            >
                                Exclusive Collection
                            </motion.span>
                            <h1 ref={titleRef} style={{
                                fontFamily: "'Integral CF', sans-serif",
                                fontSize: 'clamp(36px, 6vw, 76px)',
                                fontWeight: 900,
                                lineHeight: 1,
                                marginBottom: '24px',
                                color: currentHero.textColor,
                                letterSpacing: '-1px',
                                textShadow: currentHero.textColor === '#fff' ? '0 10px 30px rgba(0,0,0,0.3)' : 'none'
                            }}>
                                {currentHero.title}
                            </h1>
                            <p ref={subtitleRef} style={{
                                color: currentHero.textColor === '#fff' ? 'rgba(255,255,255,0.85)' : '#4a4a4a',
                                fontSize: isMobile ? '15px' : '20px', lineHeight: 1.5, marginBottom: isMobile ? '24px' : '40px', maxWidth: '540px',
                                fontWeight: 500
                            }}>
                                {currentHero.subtitle}
                            </p>
                            <Link ref={ctaRef} to={currentHero.ctaLink} style={{
                                display: 'inline-flex', alignItems: 'center', gap: isMobile ? '10px' : '14px',
                                padding: isMobile ? '14px 36px' : '20px 56px', borderRadius: '9999px',
                                backgroundColor: currentHero.textColor === '#fff' ? '#fff' : '#000',
                                color: currentHero.textColor === '#fff' ? '#000' : '#fff',
                                fontSize: '16px', fontWeight: 800, transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                boxShadow: currentHero.textColor === '#fff' ? '0 20px 40px rgba(0,0,0,0.25)' : '0 15px 30px rgba(0,0,0,0.15)',
                                textDecoration: 'none',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}
                                className="hover:scale-105 active:scale-95 group">
                                {currentHero.cta} <FiArrowRight size={20} style={{ transition: 'transform 0.3s ease' }} className="group-hover:translate-x-1" />
                            </Link>
                        </div>

                        {/* Image side - Ultra Premium Visual */}
                        <div style={{
                            flex: isMobile ? '1 1 100%' : '1 1 500px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative', minHeight: isMobile ? '280px' : '500px',
                        }}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentSlide}
                                    initial={{ opacity: 0, scale: 0.8, rotate: 5, x: 100 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0, x: 0 }}
                                    exit={{ opacity: 0, scale: 1.1, x: -100 }}
                                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                    style={{ width: '100%', height: '100%', position: 'relative' }}
                                >
                                    {/* Main Hero Image with Floating Hover */}
                                    <motion.div
                                        animate={{ y: [0, -15, 0] }}
                                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                        style={{
                                            width: '100%', maxWidth: isMobile ? '280px' : '460px',
                                            height: 'auto', aspectRatio: '1/1', margin: '0 auto',
                                            borderRadius: isMobile ? '32px' : '60px', overflow: 'hidden',
                                            boxShadow: isMobile ? '0 20px 40px rgba(0,0,0,0.3)' : '0 40px 80px rgba(0,0,0,0.4)',
                                            border: isMobile ? '6px solid rgba(255,255,255,0.15)' : '12px solid rgba(255,255,255,0.15)',
                                            backdropFilter: 'blur(20px)',
                                            position: 'relative',
                                            zIndex: 5
                                        }}
                                    >
                                        <img
                                            src={currentHero.mainImg}
                                            alt={currentHero.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </motion.div>

                                    {/* Floating Premium Badges — hide on mobile */}
                                    {!isMobile && (
                                        <>
                                            <FloatingBadge icon={FiStar} delay={0.5} position={{ top: '15%', left: '-5%' }}>
                                                4.9 Rated
                                            </FloatingBadge>
                                            <FloatingBadge icon={FiZap} delay={1.2} position={{ bottom: '20%', right: '0%' }}>
                                                Trending Now
                                            </FloatingBadge>
                                            <FloatingBadge icon={FiShield} delay={0.8} position={{ top: '60%', left: '0%' }}>
                                                Official Brand
                                            </FloatingBadge>
                                        </>
                                    )}

                                    {/* Visual Backdrop decoration */}
                                    <div style={{
                                        position: 'absolute', top: '50%', left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '120%', height: '120%', zIndex: -1,
                                        background: `radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)`,
                                        opacity: 0.5
                                    }} />
                                </motion.div>
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
                            <Link key={cat._id || cat.name} to={`/category/${cat.slug}`}
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
            {
                trendingProducts.length > 0 && (
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
                )
            }

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
                            <Link key={cat._id || cat.name} to={`/category/${cat.slug}`}
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
                        className="product-grid-responsive"
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
                        className="product-grid-responsive"
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
                        <div className="browse-grid-responsive" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '16px',
                        }}>
                            {browseCategories.map(({ name, desc, img, slug, span }) => (
                                <Link key={slug} to={`/category/${slug}`}
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
                    <div className="review-grid-responsive" style={{
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
            <section className="section-pad" style={{ paddingBottom: isMobile ? '80px' : undefined }}>
                <div className="container-main">
                    <div style={{
                        background: 'linear-gradient(135deg, #000 0%, #1a1a2e 50%, #16213e 100%)',
                        borderRadius: isMobile ? '20px' : '32px',
                        padding: isMobile ? '28px 20px' : 'clamp(32px, 5vw, 64px)',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.04) 0%, transparent 50%)',
                        }} />
                        <div style={{
                            position: 'relative', zIndex: 1, display: 'flex',
                            flexWrap: 'wrap', alignItems: 'center', gap: isMobile ? 24 : 40,
                        }}>
                            <div style={{ flex: '1 1 300px', minWidth: isMobile ? 0 : 280 }}>
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
                                flex: '1 1 280px', minWidth: isMobile ? 0 : 260,
                                display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 16,
                            }}>
                                {[
                                    { icon: <FiZap size={24} color="#fff" />, title: 'Sell Anything', desc: 'From electronics to fashion — list any product and start earning immediately.' },
                                    { icon: <FiUsers size={24} color="#fff" />, title: 'Millions of Customers', desc: 'Access our growing customer base across Pakistan with instant exposure.' },
                                    { icon: <FiBarChart2 size={24} color="#fff" />, title: 'Powerful Analytics', desc: 'Track sales, manage inventory, and optimize your business with real-time insights.' },
                                ].map(({ icon, title, desc }) => (
                                    <div key={title} style={{
                                        display: 'flex', gap: isMobile ? 12 : 16,
                                        padding: isMobile ? '14px 16px' : '20px 24px',
                                        borderRadius: isMobile ? 12 : 16,
                                        backgroundColor: 'rgba(255,255,255,0.06)',
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
