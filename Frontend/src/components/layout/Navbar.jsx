import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const megaMenuCategories = [
    {
        title: 'Electronics',
        links: [
            { label: 'Smartphones', search: 'smartphones' },
            { label: 'Laptops', search: 'laptops' },
            { label: 'Tablets', search: 'tablets' },
            { label: 'Headphones', search: 'headphones' },
            { label: 'Cameras', search: 'cameras' },
            { label: 'Smart Watches', search: 'smart watches' },
        ],
    },
    {
        title: 'Fashion',
        links: [
            { label: 'Men\'s Clothing', search: 'mens clothing' },
            { label: 'Women\'s Clothing', search: 'womens clothing' },
            { label: 'Shoes', search: 'shoes' },
            { label: 'Accessories', search: 'accessories' },
            { label: 'Jewelry', search: 'jewelry' },
            { label: 'Watches', search: 'watches' },
        ],
    },
    {
        title: 'Home & Garden',
        links: [
            { label: 'Furniture', search: 'furniture' },
            { label: 'Kitchen', search: 'kitchen' },
            { label: 'Decor', search: 'decor' },
            { label: 'Bedding', search: 'bedding' },
            { label: 'Garden Tools', search: 'garden' },
            { label: 'Lighting', search: 'lighting' },
        ],
    },
    {
        title: 'Sports & Outdoors',
        links: [
            { label: 'Exercise Equipment', search: 'exercise' },
            { label: 'Outdoor Gear', search: 'outdoor' },
            { label: 'Team Sports', search: 'team sports' },
            { label: 'Cycling', search: 'cycling' },
            { label: 'Fitness', search: 'fitness' },
            { label: 'Camping', search: 'camping' },
        ],
    },
    {
        title: 'Motors',
        links: [
            { label: 'Car Parts', search: 'car parts' },
            { label: 'Car Accessories', search: 'car accessories' },
            { label: 'Motorcycle Parts', search: 'motorcycle' },
            { label: 'Tools', search: 'automotive tools' },
        ],
    },
    {
        title: 'More',
        links: [
            { label: 'Health & Beauty', search: 'health beauty' },
            { label: 'Toys & Games', search: 'toys games' },
            { label: 'Books', search: 'books' },
            { label: 'Collectibles', search: 'collectibles' },
            { label: 'Pet Supplies', search: 'pet supplies' },
            { label: 'Musical Instruments', search: 'musical instruments' },
        ],
    },
];

const mobileCategories = [
    { label: 'Electronics', search: 'electronics' },
    { label: 'Fashion', search: 'fashion' },
    { label: 'Home & Garden', search: 'home garden' },
    { label: 'Sports', search: 'sports' },
    { label: 'Motors', search: 'motors' },
    { label: 'Health & Beauty', search: 'health beauty' },
    { label: 'Toys & Games', search: 'toys games' },
    { label: 'Collectibles', search: 'collectibles' },
];

export default function Navbar() {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [shopDropdown, setShopDropdown] = useState(false);
    const [userDropdown, setUserDropdown] = useState(false);
    const [mobileCatOpen, setMobileCatOpen] = useState(false);
    const userDropdownRef = useRef(null);
    const shopDropdownTimeout = useRef(null);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setSearchOpen(false);
            setMobileOpen(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        setUserDropdown(false);
        navigate('/');
    };

    useEffect(() => {
        const handleClick = (e) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
                setUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleShopEnter = () => {
        if (shopDropdownTimeout.current) clearTimeout(shopDropdownTimeout.current);
        setShopDropdown(true);
    };
    const handleShopLeave = () => {
        shopDropdownTimeout.current = setTimeout(() => setShopDropdown(false), 200);
    };

    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
    useEffect(() => {
        const onResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return (
        <>
            {/* ═══════ Top Banner ═══════ */}
            {!user && (
                <div style={{
                    backgroundColor: '#000', color: '#fff', textAlign: 'center',
                    fontSize: '12px', padding: '8px 16px',
                }}>
                    Sign up and get 20% off your first order.{' '}
                    <Link to="/register" style={{ textDecoration: 'underline', fontWeight: 600 }}>
                        Sign Up Now
                    </Link>
                </div>
            )}

            {/* ═══════ Main Navbar ═══════ */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 50,
                backgroundColor: '#fff', borderBottom: '1px solid #e5e5e5',
            }}>
                <div className="container-main">
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', height: '64px', gap: '16px',
                    }}>
                        {/* Mobile menu button */}
                        {!isDesktop && (
                            <button onClick={() => { setMobileOpen(!mobileOpen); setSearchOpen(false); }}
                                style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                            </button>
                        )}

                        {/* Logo */}
                        <Link to="/" style={{
                            fontFamily: "'Integral CF', sans-serif",
                            fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px',
                            color: '#000', whiteSpace: 'nowrap',
                        }}>
                            MARKAZ
                        </Link>

                        {/* Desktop Nav */}
                        {isDesktop && (
                            <nav style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px' }}>
                                {/* Shop with mega dropdown */}
                                <div style={{ position: 'relative' }}
                                    onMouseEnter={handleShopEnter}
                                    onMouseLeave={handleShopLeave}>
                                    <Link to="/shop" style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        padding: '8px 0', transition: 'color 0.2s', fontWeight: 500,
                                    }}>
                                        Shop <FiChevronDown size={14} />
                                    </Link>
                                    {shopDropdown && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: '50%',
                                            transform: 'translateX(-50%)', paddingTop: '4px', zIndex: 60,
                                        }}>
                                            <div className="animate-fade-in" style={{
                                                backgroundColor: '#fff',
                                                boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                                                borderRadius: '20px', padding: '32px',
                                                minWidth: '680px', border: '1px solid #f0f0f0',
                                            }}>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                                    gap: '28px',
                                                }}>
                                                    {megaMenuCategories.map((col) => (
                                                        <div key={col.title}>
                                                            <h4 style={{
                                                                fontWeight: 700, fontSize: '14px',
                                                                marginBottom: '12px', color: '#000',
                                                                fontFamily: "'Satoshi', sans-serif",
                                                            }}>
                                                                {col.title}
                                                            </h4>
                                                            {col.links.map((item) => (
                                                                <Link key={item.label}
                                                                    to={`/shop?search=${item.search}`}
                                                                    onClick={() => setShopDropdown(false)}
                                                                    style={{
                                                                        display: 'block', padding: '6px 0',
                                                                        fontSize: '13px', color: '#737373',
                                                                        transition: 'color 0.2s',
                                                                    }}
                                                                    onMouseOver={e => e.target.style.color = '#000'}
                                                                    onMouseOut={e => e.target.style.color = '#737373'}>
                                                                    {item.label}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{
                                                    borderTop: '1px solid #f0f0f0', marginTop: '20px',
                                                    paddingTop: '16px', textAlign: 'center',
                                                }}>
                                                    <Link to="/shop" onClick={() => setShopDropdown(false)}
                                                        style={{
                                                            fontSize: '13px', fontWeight: 600, color: '#000',
                                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        }}>
                                                        View All Products <FiChevronRight size={14} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Link to="/shop?sort=price_desc" style={{ transition: 'color 0.2s', fontWeight: 500 }}>
                                    Deals
                                </Link>
                                <Link to="/shop?sort=newest" style={{ transition: 'color 0.2s', fontWeight: 500 }}>
                                    New Arrivals
                                </Link>
                                <Link to="/brands" style={{ transition: 'color 0.2s', fontWeight: 500 }}>
                                    Brands
                                </Link>
                                <Link to="/sellers" style={{ transition: 'color 0.2s', fontWeight: 500 }}>
                                    Sellers
                                </Link>
                            </nav>
                        )}

                        {/* Search Bar (Desktop) */}
                        {isDesktop && (
                            <form onSubmit={handleSearch} style={{
                                display: 'flex', alignItems: 'center',
                                backgroundColor: '#f0f0f0', borderRadius: '9999px',
                                padding: '10px 16px', width: '380px', flexShrink: 0,
                            }}>
                                <FiSearch style={{ color: '#a3a3a3', marginRight: '10px', flexShrink: 0 }} size={18} />
                                <input
                                    type="text"
                                    placeholder="Search for anything..."
                                    style={{
                                        background: 'transparent', outline: 'none',
                                        width: '100%', fontSize: '14px', border: 'none',
                                    }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </form>
                        )}

                        {/* Right Icons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {!isDesktop && (
                                <button onClick={() => { setSearchOpen(!searchOpen); setMobileOpen(false); }}
                                    style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <FiSearch size={22} />
                                </button>
                            )}

                            <Link to="/cart" style={{ position: 'relative', padding: '4px' }}>
                                <FiShoppingCart size={22} />
                                {cartCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '-6px', right: '-6px',
                                        backgroundColor: '#000', color: '#fff', fontSize: '10px',
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700,
                                    }}>
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* User Dropdown */}
                            <div style={{ position: 'relative' }} ref={userDropdownRef}>
                                <button onClick={() => setUserDropdown(!userDropdown)}
                                    style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <FiUser size={22} />
                                </button>
                                {userDropdown && (
                                    <div className="animate-fade-in" style={{
                                        position: 'absolute', right: 0, top: '100%', marginTop: '8px',
                                        backgroundColor: '#fff', boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                                        borderRadius: '16px', padding: '8px 0', minWidth: '220px',
                                        border: '1px solid #f0f0f0', zIndex: 60,
                                    }}>
                                        {user ? (
                                            <>
                                                <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0' }}>
                                                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{user.fullName}</p>
                                                    <p style={{ fontSize: '12px', color: '#737373' }}>{user.email}</p>
                                                </div>
                                                <Link to="/profile" onClick={() => setUserDropdown(false)}
                                                    style={{ display: 'block', padding: '10px 20px', fontSize: '14px' }}>
                                                    My Profile
                                                </Link>
                                                <Link to="/orders" onClick={() => setUserDropdown(false)}
                                                    style={{ display: 'block', padding: '10px 20px', fontSize: '14px' }}>
                                                    My Orders
                                                </Link>
                                                {user.role === 'SELLER' && (
                                                    <Link to="/seller/dashboard" onClick={() => setUserDropdown(false)}
                                                        style={{ display: 'block', padding: '10px 20px', fontSize: '14px' }}>
                                                        Seller Dashboard
                                                    </Link>
                                                )}
                                                {user.role === 'ADMIN' && (
                                                    <Link to="/admin" onClick={() => setUserDropdown(false)}
                                                        style={{ display: 'block', padding: '10px 20px', fontSize: '14px' }}>
                                                        Admin Panel
                                                    </Link>
                                                )}
                                                <button onClick={handleLogout}
                                                    style={{
                                                        display: 'block', width: '100%', textAlign: 'left',
                                                        padding: '10px 20px', fontSize: '14px', color: '#ff3333',
                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                        borderTop: '1px solid #f0f0f0',
                                                    }}>
                                                    Logout
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Link to="/login" onClick={() => setUserDropdown(false)}
                                                    style={{ display: 'block', padding: '12px 20px', fontSize: '14px', fontWeight: 600 }}>
                                                    Sign In
                                                </Link>
                                                <Link to="/register" onClick={() => setUserDropdown(false)}
                                                    style={{ display: 'block', padding: '12px 20px', fontSize: '14px' }}>
                                                    Create Account
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category scrollbar under navbar (desktop) */}
                {isDesktop && (
                    <div style={{
                        borderTop: '1px solid #f0f0f0',
                        backgroundColor: '#fff',
                    }}>
                        <div className="container-main">
                            <div style={{
                                display: 'flex', gap: '24px', padding: '8px 0',
                                overflowX: 'auto', fontSize: '13px',
                            }} className="scrollbar-hide">
                                {[
                                    { label: 'Electronics', search: 'electronics' },
                                    { label: 'Fashion', search: 'fashion' },
                                    { label: 'Home & Garden', search: 'home garden' },
                                    { label: 'Motors', search: 'motors' },
                                    { label: 'Collectibles & Art', search: 'collectibles' },
                                    { label: 'Sports', search: 'sports' },
                                    { label: 'Health & Beauty', search: 'health beauty' },
                                    { label: 'Toys & Games', search: 'toys games' },
                                    { label: 'Books', search: 'books' },
                                    { label: 'Pet Supplies', search: 'pet supplies' },
                                    { label: 'Musical Instruments', search: 'musical instruments' },
                                ].map((cat) => (
                                    <Link key={cat.label} to={`/shop?search=${cat.search}`}
                                        style={{
                                            whiteSpace: 'nowrap', color: '#737373',
                                            transition: 'color 0.2s', fontWeight: 500,
                                            padding: '4px 0',
                                        }}
                                        onMouseEnter={e => e.target.style.color = '#000'}
                                        onMouseLeave={e => e.target.style.color = '#737373'}>
                                        {cat.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Search */}
                {searchOpen && !isDesktop && (
                    <div className="animate-fade-in" style={{ padding: '0 20px 16px' }}>
                        <form onSubmit={handleSearch} style={{
                            display: 'flex', alignItems: 'center',
                            backgroundColor: '#f0f0f0', borderRadius: '9999px', padding: '10px 16px',
                        }}>
                            <FiSearch style={{ color: '#a3a3a3', marginRight: '10px' }} size={18} />
                            <input type="text" placeholder="Search for anything..."
                                style={{
                                    background: 'transparent', outline: 'none',
                                    width: '100%', fontSize: '14px', border: 'none',
                                }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
                        </form>
                    </div>
                )}

                {/* Mobile Menu */}
                {mobileOpen && !isDesktop && (
                    <div className="animate-fade-in" style={{
                        borderTop: '1px solid #f0f0f0', backgroundColor: '#fff',
                        maxHeight: '70vh', overflowY: 'auto',
                    }}>
                        <div style={{ padding: '16px 20px' }}>
                            <Link to="/shop" onClick={() => setMobileOpen(false)}
                                style={{ display: 'block', padding: '12px 0', fontWeight: 600, fontSize: '16px' }}>
                                All Products
                            </Link>
                            <Link to="/shop?sort=newest" onClick={() => setMobileOpen(false)}
                                style={{ display: 'block', padding: '12px 0', fontSize: '16px' }}>
                                New Arrivals
                            </Link>
                            <Link to="/shop?sort=price_desc" onClick={() => setMobileOpen(false)}
                                style={{ display: 'block', padding: '12px 0', fontSize: '16px' }}>
                                Deals
                            </Link>
                            <Link to="/brands" onClick={() => setMobileOpen(false)}
                                style={{ display: 'block', padding: '12px 0', fontSize: '16px' }}>
                                Brands
                            </Link>
                            <Link to="/sellers" onClick={() => setMobileOpen(false)}
                                style={{ display: 'block', padding: '12px 0', fontSize: '16px' }}>
                                Sellers
                            </Link>

                            {/* Categories accordion */}
                            <button onClick={() => setMobileCatOpen(!mobileCatOpen)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    width: '100%', padding: '12px 0', fontSize: '16px',
                                    fontWeight: 600, background: 'none', border: 'none',
                                    borderTop: '1px solid #f0f0f0', cursor: 'pointer',
                                    marginTop: '4px',
                                }}>
                                Categories
                                <FiChevronDown size={18} style={{
                                    transition: 'transform 0.3s',
                                    transform: mobileCatOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                }} />
                            </button>
                            {mobileCatOpen && (
                                <div className="animate-fade-in" style={{ paddingLeft: '12px' }}>
                                    {mobileCategories.map((cat) => (
                                        <Link key={cat.label} to={`/shop?search=${cat.search}`}
                                            onClick={() => { setMobileOpen(false); setMobileCatOpen(false); }}
                                            style={{
                                                display: 'block', padding: '10px 0',
                                                fontSize: '14px', color: '#737373',
                                            }}>
                                            {cat.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>
        </>
    );
}
