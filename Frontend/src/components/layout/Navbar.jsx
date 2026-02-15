import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [shopDropdown, setShopDropdown] = useState(false);
    const [userDropdown, setUserDropdown] = useState(false);
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

    // Close user dropdown on outside click
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
        shopDropdownTimeout.current = setTimeout(() => setShopDropdown(false), 150);
    };

    // Responsive: detect window width for filter sidebar
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
                <div style={{ backgroundColor: '#000', color: '#fff', textAlign: 'center', fontSize: '12px', padding: '8px 16px' }}>
                    Sign up and get 20% off to your first order.{' '}
                    <Link to="/register" style={{ textDecoration: 'underline', fontWeight: 600 }}>Sign Up Now</Link>
                </div>
            )}

            {/* ═══════ Main Navbar ═══════ */}
            <header style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#fff', borderBottom: '1px solid #e5e5e5' }}>
                <div className="container-main">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', gap: '16px' }}>

                        {/* Mobile menu button */}
                        {!isDesktop && (
                            <button onClick={() => { setMobileOpen(!mobileOpen); setSearchOpen(false); }}
                                style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                            </button>
                        )}

                        {/* Logo */}
                        <Link to="/" style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', color: '#000', whiteSpace: 'nowrap' }}>
                            MARKAZ
                        </Link>

                        {/* Desktop Nav */}
                        {isDesktop && (
                            <nav style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px' }}>
                                {/* Shop with dropdown */}
                                <div style={{ position: 'relative' }}
                                    onMouseEnter={handleShopEnter}
                                    onMouseLeave={handleShopLeave}>
                                    <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 0', transition: 'color 0.2s' }}>
                                        Shop <FiChevronDown size={14} />
                                    </Link>
                                    {shopDropdown && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, paddingTop: '4px', zIndex: 60,
                                        }}>
                                            <div className="animate-fade-in" style={{
                                                backgroundColor: '#fff', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                                borderRadius: '12px', padding: '8px 0', minWidth: '180px', border: '1px solid #f0f0f0',
                                            }}>
                                                {[
                                                    { to: '/shop?sort=newest', label: 'New Arrivals' },
                                                    { to: '/shop?sort=popular', label: 'Top Selling' },
                                                    { to: '/shop?sort=price_asc', label: 'Price: Low to High' },
                                                    { to: '/shop?sort=price_desc', label: 'Price: High to Low' },
                                                ].map(item => (
                                                    <Link key={item.to} to={item.to}
                                                        onClick={() => setShopDropdown(false)}
                                                        style={{ display: 'block', padding: '10px 20px', fontSize: '13px', transition: 'background 0.2s' }}
                                                        onMouseOver={e => e.target.style.background = '#f9f9f9'}
                                                        onMouseOut={e => e.target.style.background = 'transparent'}>
                                                        {item.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Link to="/shop?sort=price_desc" style={{ transition: 'color 0.2s' }}>On Sale</Link>
                                <Link to="/shop?sort=newest" style={{ transition: 'color 0.2s' }}>New Arrivals</Link>
                                <Link to="/brands" style={{ transition: 'color 0.2s' }}>Brands</Link>
                            </nav>
                        )}

                        {/* Search Bar (Desktop) */}
                        {isDesktop && (
                            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: '9999px', padding: '10px 16px', width: '380px', flexShrink: 0 }}>
                                <FiSearch style={{ color: '#a3a3a3', marginRight: '10px', flexShrink: 0 }} size={18} />
                                <input
                                    type="text"
                                    placeholder="Search for products..."
                                    style={{ background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', border: 'none' }}
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
                                    <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#000', color: '#fff', fontSize: '10px', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* User Dropdown */}
                            <div style={{ position: 'relative' }} ref={userDropdownRef}>
                                <button onClick={() => setUserDropdown(!userDropdown)} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <FiUser size={22} />
                                </button>
                                {userDropdown && (
                                    <div className="animate-fade-in" style={{ position: 'absolute', right: 0, top: '100%', marginTop: '8px', backgroundColor: '#fff', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', borderRadius: '16px', padding: '8px 0', minWidth: '220px', border: '1px solid #f0f0f0', zIndex: 60 }}>
                                        {user ? (
                                            <>
                                                <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0' }}>
                                                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{user.fullName}</p>
                                                    <p style={{ fontSize: '12px', color: '#737373' }}>{user.email}</p>
                                                </div>
                                                <Link to="/profile" onClick={() => setUserDropdown(false)} style={{ display: 'block', padding: '10px 20px', fontSize: '14px' }}>My Profile</Link>
                                                <Link to="/orders" onClick={() => setUserDropdown(false)} style={{ display: 'block', padding: '10px 20px', fontSize: '14px' }}>My Orders</Link>
                                                {user.role === 'SELLER' && (
                                                    <Link to="/seller/dashboard" onClick={() => setUserDropdown(false)} style={{ display: 'block', padding: '10px 20px', fontSize: '14px' }}>Seller Dashboard</Link>
                                                )}
                                                {user.role === 'ADMIN' && (
                                                    <Link to="/admin" onClick={() => setUserDropdown(false)} style={{ display: 'block', padding: '10px 20px', fontSize: '14px' }}>Admin Panel</Link>
                                                )}
                                                <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 20px', fontSize: '14px', color: '#ff3333', background: 'none', border: 'none', cursor: 'pointer', borderTop: '1px solid #f0f0f0' }}>Logout</button>
                                            </>
                                        ) : (
                                            <>
                                                <Link to="/login" onClick={() => setUserDropdown(false)} style={{ display: 'block', padding: '12px 20px', fontSize: '14px', fontWeight: 600 }}>Sign In</Link>
                                                <Link to="/register" onClick={() => setUserDropdown(false)} style={{ display: 'block', padding: '12px 20px', fontSize: '14px' }}>Create Account</Link>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Search */}
                {searchOpen && !isDesktop && (
                    <div className="animate-fade-in" style={{ padding: '0 20px 16px' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: '9999px', padding: '10px 16px' }}>
                            <FiSearch style={{ color: '#a3a3a3', marginRight: '10px' }} size={18} />
                            <input type="text" placeholder="Search for products..." style={{ background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', border: 'none' }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
                        </form>
                    </div>
                )}

                {/* Mobile Menu */}
                {mobileOpen && !isDesktop && (
                    <div className="animate-fade-in" style={{ borderTop: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
                        <div style={{ padding: '16px 20px' }}>
                            <Link to="/shop" onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '12px 0', fontWeight: 500, fontSize: '16px' }}>Shop</Link>
                            <Link to="/shop?sort=newest" onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '12px 0', fontSize: '16px' }}>New Arrivals</Link>
                            <Link to="/shop?sort=price_desc" onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '12px 0', fontSize: '16px' }}>On Sale</Link>
                            <Link to="/brands" onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '12px 0', fontSize: '16px' }}>Brands</Link>
                        </div>
                    </div>
                )}
            </header>
        </>
    );
}
