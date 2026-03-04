import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiFilter, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import ProductCard from '../components/product/ProductCard';
import Breadcrumb from '../components/ui/Breadcrumb';
import { productAPI, categoryAPI, sellerAPI } from '../api';
import SEO from '../components/ui/SEO';
import { motion } from 'framer-motion';

const colors = [
    { name: 'Black', hex: '#000' }, { name: 'White', hex: '#fff' }, { name: 'Navy', hex: '#1a3a5c' },
    { name: 'Silver', hex: '#C0C0C0' }, { name: 'Grey', hex: '#808080' }, { name: 'Gold', hex: '#FFD700' },
    { name: 'Red', hex: '#ff3333' }, { name: 'Blue', hex: '#3b82f6' }, { name: 'Green', hex: '#01ab31' },
];

// Removed hardcoded departments to use dynamic categories from database

const conditions = ['New', 'Certified Refurbished', 'Used', 'Open Box'];
const topBrands = ['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Zara', 'Toyota', 'Honda', 'Dell', 'HP'];
const commonSizes = ['S', 'M', 'L', 'XL', 'Universal', '4GB', '8GB', '16GB', '256GB', '512GB', '1TB'];
const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
];

const FilterSection = ({ title, filterKey, expanded, onToggle, children }) => (
    <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 20, marginBottom: 20 }}>
        <button type="button" onClick={() => onToggle(filterKey)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontWeight: 600, fontSize: 14, marginBottom: expanded ? 12 : 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            {title}
            {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </button>
        {expanded && children}
    </div>
);

export default function ShopPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalProducts: 0 });
    const [categories, setCategories] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 200000]);
    const [expandedFilters, setExpandedFilters] = useState({ categories: true, price: true, colors: false, specs: true, condition: true, brands: true, sellers: false, delivery: false });
    const [expandedDepts, setExpandedDepts] = useState({});
    const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
    const { categorySlug } = useParams();

    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
    useEffect(() => { const h = () => setIsDesktop(window.innerWidth >= 1024); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);

    // Read all current params
    const currentSort = searchParams.get('sort') || 'popular';
    const currentSearch = searchParams.get('search') || '';
    const currentPage = parseInt(searchParams.get('page') || '1');
    const currentCategory = searchParams.get('category') || '';
    const currentMinPrice = searchParams.get('minPrice') || '';
    const currentMaxPrice = searchParams.get('maxPrice') || '';
    const currentColor = searchParams.get('color') || '';
    const currentSize = searchParams.get('size') || '';
    const currentBrand = searchParams.get('brand') || '';
    const currentSeller = searchParams.get('seller') || '';

    const currentFreeDelivery = searchParams.get('freeDelivery') === 'true';
    const currentFlashSale = searchParams.get('flashSale') || '';

    // Sync slider from URL on load
    useEffect(() => {
        if (currentMinPrice || currentMaxPrice) setPriceRange([parseInt(currentMinPrice) || 0, parseInt(currentMaxPrice) || 200000]);
    }, [currentMinPrice, currentMaxPrice]);

    useEffect(() => { categoryAPI.getAll().then(r => setCategories(r.data.data.categories || [])).catch(() => { }); }, []);
    useEffect(() => { sellerAPI.getAll({ status: 'active', limit: 100 }).then(r => setSellers(r.data.data.sellers || [])).catch(() => { }); }, []);

    const hasProducts = products.length > 0;

    // Fetch products whenever URL params change
    useEffect(() => {
        let cancelled = false;
        const conditionParam = searchParams.get('condition');
        const fetchProducts = async () => {
            if (location.state?.visualSearchResults) {
                setProducts(location.state.visualSearchResults);
                setPagination({ currentPage: 1, totalPages: 1, totalProducts: location.state.visualSearchResults.length });
                setLoading(false);
                return;
            }

            if (hasProducts) setIsBackgroundLoading(true);
            else setLoading(true);

            try {
                const params = { sort: currentSort, page: currentPage, limit: 30 };
                if (currentSearch) params.search = currentSearch;

                const categoryIdentifier = categorySlug || currentCategory;
                if (categoryIdentifier) params.category = categoryIdentifier;

                if (currentMinPrice) params.minPrice = currentMinPrice;
                if (currentMaxPrice) params.maxPrice = currentMaxPrice;
                if (currentColor) params.color = currentColor;
                if (currentSize) params.size = currentSize;
                if (currentBrand) params.brand = currentBrand;
                if (currentSeller) params.seller = currentSeller;
                if (currentFlashSale) params.flashSale = currentFlashSale;
                if (currentFreeDelivery) params.freeDelivery = true;
                if (conditionParam) params.condition = conditionParam;

                const res = await productAPI.getAll(params);

                if (cancelled) return;

                const rawProducts = res.data.data.products || [];
                const seen = new Map();
                const uniqueProducts = rawProducts.filter(p => {
                    const id = p._id?.toString();
                    if (!id || seen.has(id)) return false;
                    seen.set(id, true);
                    return true;
                });

                if (!cancelled) {
                    setProducts(uniqueProducts);
                    setPagination(res.data.data.pagination);
                }
            } catch { if (!cancelled) { setProducts([]); } }
            finally {
                if (!cancelled) {
                    setLoading(false);
                    setIsBackgroundLoading(false);
                }
            }
        };
        fetchProducts();

        return () => { cancelled = true; };
    }, [currentSort, currentSearch, currentPage, currentCategory, categorySlug, currentMinPrice, currentMaxPrice, currentColor, currentSize, currentBrand, currentSeller, currentFlashSale, currentFreeDelivery, location.state, hasProducts, searchParams]);

    // SEO Redirect: If accessed by ID query param and we have the slug
    useEffect(() => {
        if (currentCategory && !categorySlug && categories.length > 0) {
            const matchedCat = categories.find(c => c._id === currentCategory);
            if (matchedCat && matchedCat.slug) {
                const p = new URLSearchParams(searchParams);
                p.delete('category');
                const searchStr = p.toString();
                navigate(`/category/${matchedCat.slug}${searchStr ? '?' + searchStr : ''}`, { replace: true });
            }
        }
    }, [currentCategory, categorySlug, categories, navigate, searchParams]);

    // Category/Search meta metadata helper
    const currentCategoryObj = categorySlug ? categories.find(c => c.slug === categorySlug) : null;
    const categoryName = currentCategoryObj?.name || (products.length > 0 && products[0].category?.slug === categorySlug ? products[0].category.name : '');
    // Check if filters are active (excluding category and page)
    const p = new URLSearchParams(searchParams);
    p.delete('category');
    p.delete('page');
    const isFiltered = p.toString().length > 0;

    // Breadcrumb Schema
    const breadcrumbSchema = categoryName ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": `${window.location.origin}`
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Shop",
                "item": `${window.location.origin}/shop`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": categoryName,
                "item": `${window.location.origin}/category/${categorySlug}`
            }
        ]
    } : null;

    // Helper to update a single filter param and reset page
    const setFilter = (key, value) => {
        const p = new URLSearchParams(searchParams);
        if (value) p.set(key, value);
        else p.delete(key);
        p.set('page', '1');
        setSearchParams(p, { replace: true, preventScrollReset: true });
    };

    const handleSortChange = (v) => setFilter('sort', v);
    const handlePageChange = (pg) => {
        const p = new URLSearchParams(searchParams);
        p.set('page', pg.toString());
        setSearchParams(p, { replace: true, preventScrollReset: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const toggleExpand = (k) => setExpandedFilters(prev => ({ ...prev, [k]: !prev[k] }));

    const handleCategoryClick = (cat) => {
        const p = new URLSearchParams(searchParams);
        p.set('page', '1');
        if (cat.slug) {
            // Keep existing search params except maybe the old 'category' ID if it was there
            p.delete('category');
            const searchStr = p.toString();
            navigate(`/category/${cat.slug}${searchStr ? '?' + searchStr : ''}`, { replace: true, preventScrollReset: true });
        } else {
            currentCategory === cat._id ? p.delete('category') : p.set('category', cat._id);
            setSearchParams(p, { replace: true, preventScrollReset: true });
        }
        if (!isDesktop) setFiltersOpen(false);
    };

    const handleColorClick = (colorName) => {
        setFilter('color', currentColor === colorName ? '' : colorName);
        if (!isDesktop) setFiltersOpen(false);
    };

    const handleSizeClick = (s) => {
        setFilter('size', currentSize === s ? '' : s);
        if (!isDesktop) setFiltersOpen(false);
    };

    const applyPriceFilter = (e) => {
        if (e) e.preventDefault();
        const p = new URLSearchParams(searchParams);
        p.set('minPrice', priceRange[0].toString());
        p.set('maxPrice', priceRange[1].toString());
        p.set('page', '1');
        setSearchParams(p, { replace: true, preventScrollReset: true });
        if (!isDesktop) setFiltersOpen(false);
    };

    const resetAllFilters = () => {
        setSearchParams({}, { replace: true, preventScrollReset: true });
        setPriceRange([0, 200000]);
        if (!isDesktop) setFiltersOpen(false);
    };

    // Count active filters
    const activeFilterCount = [currentCategory, currentColor, currentSize, currentMinPrice, currentMaxPrice, currentBrand, currentSeller].filter(Boolean).length;

    const showFilters = isDesktop || filtersOpen;

    const seoTitle = categoryName ? `Buy ${categoryName} Online in Pakistan | Best Prices` : (currentSearch ? `Search: ${currentSearch} | Markaz` : 'Shop | Markaz');
    const seoDescription = currentCategoryObj?.description || (categoryName ? `Shop the latest ${categoryName} trends on Markaz. Best prices and quality in Pakistan.` : 'Browse our wide range of products across all categories.');

    return (
        <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
            <SEO
                title={seoTitle}
                description={seoDescription}
                url={categorySlug ? `${window.location.origin}/category/${categorySlug}` : `${window.location.origin}/shop${location.search}`}
                noIndex={isFiltered}
                schemaData={breadcrumbSchema}
            />
            <Breadcrumb items={[{ label: currentSearch || currentBrand || 'Shop' }]} />

            <div style={{ display: 'flex', gap: 32 }}>
                {/* ═══════════ FILTERS SIDEBAR ═══════════ */}
                {showFilters && (
                    <aside style={{
                        position: filtersOpen && !isDesktop ? 'fixed' : 'static',
                        inset: filtersOpen && !isDesktop ? 0 : 'auto',
                        zIndex: filtersOpen && !isDesktop ? 40 : 'auto',
                        backgroundColor: '#fff',
                        width: isDesktop ? 260 : '100%',
                        minWidth: isDesktop ? 260 : 'auto',
                        flexShrink: 0,
                        overflowY: filtersOpen && !isDesktop ? 'auto' : 'visible',
                    }}>
                        <div style={{ border: isDesktop ? '1px solid #e5e5e5' : 'none', borderRadius: 16, padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <h3 style={{ fontWeight: 700, fontSize: 18 }}>
                                    Filters {activeFilterCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', backgroundColor: '#000', padding: '2px 8px', borderRadius: 9999, marginLeft: 6 }}>{activeFilterCount}</span>}
                                </h3>
                                {!isDesktop ? (
                                    <button onClick={() => setFiltersOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiX size={22} /></button>
                                ) : (
                                    <FiFilter size={20} style={{ color: '#a3a3a3' }} />
                                )}
                            </div>

                            {/* Categories / Departments */}
                            <FilterSection title="Departments" filterKey="categories" expanded={expandedFilters.categories} onToggle={toggleExpand}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {/* Handle hierarchical categories */}
                                    {categories.filter(c => !c.parentCategory).map(parent => (
                                        <div key={parent._id} style={{ marginBottom: 4 }}>
                                            <button
                                                onClick={() => setExpandedDepts(prev => ({ ...prev, [parent._id]: !prev[parent._id] }))}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, fontSize: 13,
                                                    fontWeight: (categorySlug === parent.slug || currentCategory === parent._id) ? 700 : 500,
                                                    color: (categorySlug === parent.slug || currentCategory === parent._id) ? '#000' : '#525252',
                                                    border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%',
                                                    backgroundColor: (categorySlug === parent.slug || currentCategory === parent._id) ? '#f5f5f5' : 'transparent'
                                                }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => { e.stopPropagation(); handleCategoryClick(parent); }}>
                                                    {parent.name}
                                                </div>
                                                <div onClick={() => setExpandedDepts(prev => ({ ...prev, [parent._id]: !prev[parent._id] }))}>
                                                    <FiChevronDown size={14} style={{ transform: expandedDepts[parent._id] ? 'rotate(180deg)' : 'rotate(0)' }} />
                                                </div>
                                            </button>

                                            {expandedDepts[parent._id] && (
                                                <div style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                                                    {categories.filter(c => c.parentCategory === parent._id).map(child => (
                                                        <button
                                                            key={child._id}
                                                            onClick={() => handleCategoryClick(child)}
                                                            style={{
                                                                padding: '8px 12px', borderRadius: 6, fontSize: 13, textAlign: 'left', border: 'none', cursor: 'pointer',
                                                                backgroundColor: (categorySlug === child.slug || currentCategory === child._id) ? '#000' : 'transparent',
                                                                color: (categorySlug === child.slug || currentCategory === child._id) ? '#fff' : '#737373',
                                                                transition: 'all 0.15s'
                                                            }}
                                                        >
                                                            {child.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Fallback for categories without hierarchy logic if needed */}
                                    {categories.length === 0 && <div style={{ padding: '0 12px', fontSize: 13, color: '#a3a3a3' }}>Loading categories...</div>}
                                </div>
                            </FilterSection>

                            {/* Price Range */}
                            <FilterSection title="Price" filterKey="price" expanded={expandedFilters.price} onToggle={toggleExpand}>
                                <div style={{ padding: '0 8px' }}>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: 11, color: '#a3a3a3', marginBottom: 4, display: 'block' }}>Min</label>
                                            <input type="number" min="0" max={priceRange[1]} value={priceRange[0]}
                                                onChange={e => setPriceRange([Math.max(0, parseInt(e.target.value) || 0), priceRange[1]])}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 13, outline: 'none' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: 11, color: '#a3a3a3', marginBottom: 4, display: 'block' }}>Max</label>
                                            <input type="number" min={priceRange[0]} value={priceRange[1]}
                                                onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value) || 200000])}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 13, outline: 'none' }} />
                                        </div>
                                    </div>
                                    <input type="range" min="0" max="200000" step="1000" value={priceRange[1]}
                                        onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                        style={{ width: '100%', accentColor: '#000' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#737373', marginTop: 4 }}>
                                        <span>PKR {priceRange[0].toLocaleString()}</span><span>PKR {priceRange[1].toLocaleString()}</span>
                                    </div>
                                    <button type="button" onClick={applyPriceFilter}
                                        style={{
                                            width: '100%', marginTop: 12, padding: '10px', borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                            backgroundColor: '#000', color: '#fff', border: 'none', transition: 'opacity 0.15s',
                                        }}>
                                        Apply Price
                                    </button>
                                </div>
                            </FilterSection>

                            {/* Colors */}
                            <FilterSection title="Colors" filterKey="colors" expanded={expandedFilters.colors} onToggle={toggleExpand}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {colors.map(c => (
                                        <button key={c.name} onClick={() => handleColorClick(c.name)} title={c.name}
                                            style={{
                                                width: 32, height: 32, borderRadius: '50%', backgroundColor: c.hex,
                                                border: currentColor === c.name ? '3px solid #000' : '2px solid #e5e5e5',
                                                cursor: 'pointer', transition: 'all 0.15s',
                                                boxShadow: currentColor === c.name ? '0 0 0 2px #fff, 0 0 0 4px #000' : 'none',
                                            }} />
                                    ))}
                                </div>
                                {currentColor && (
                                    <button onClick={() => setFilter('color', '')}
                                        style={{ marginTop: 8, fontSize: 12, color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500 }}>
                                        Clear color
                                    </button>
                                )}
                            </FilterSection>

                            {/* Condition */}
                            <FilterSection title="Condition" filterKey="condition" expanded={expandedFilters.condition} onToggle={toggleExpand}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {conditions.map(cond => (
                                        <button key={cond}
                                            onClick={() => setFilter('condition', searchParams.get('condition') === cond.toLowerCase() ? '' : cond.toLowerCase())}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', fontSize: 14,
                                                color: searchParams.get('condition') === cond.toLowerCase() ? '#fff' : '#525252',
                                                backgroundColor: searchParams.get('condition') === cond.toLowerCase() ? '#000' : 'transparent',
                                                borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.15s',
                                            }}>
                                            {cond}<FiChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* Brands */}
                            <FilterSection title="Top Brands" filterKey="brands" expanded={expandedFilters.brands} onToggle={toggleExpand}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {topBrands.map(brand => (
                                        <button key={brand}
                                            onClick={() => setFilter('brand', currentBrand === brand ? '' : brand)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', fontSize: 14,
                                                color: currentBrand === brand ? '#fff' : '#525252',
                                                backgroundColor: currentBrand === brand ? '#000' : 'transparent',
                                                borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.15s',
                                            }}>
                                            {brand}<FiChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* Seller / Store */}
                            <FilterSection title="Seller / Store" filterKey="sellers" expanded={expandedFilters.sellers} onToggle={toggleExpand}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                                    {sellers.map(s => (
                                        <button key={s._id}
                                            onClick={() => { setFilter('seller', currentSeller === s.storeSlug ? '' : s.storeSlug); if (!isDesktop) setFiltersOpen(false); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', fontSize: 14,
                                                color: currentSeller === s.storeSlug ? '#fff' : '#525252',
                                                backgroundColor: currentSeller === s.storeSlug ? '#000' : 'transparent',
                                                borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.15s',
                                            }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{
                                                    width: 24, height: 24, borderRadius: 6, backgroundColor: currentSeller === s.storeSlug ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: 'hidden',
                                                }}>
                                                    {s.storeLogo?.url ? <img src={s.storeLogo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : s.storeName?.charAt(0)}
                                                </span>
                                                {s.storeName}
                                            </span>
                                            <span style={{ fontSize: 11, opacity: 0.6 }}>{s.totalProducts || 0}</span>
                                        </button>
                                    ))}
                                    {sellers.length === 0 && <div style={{ padding: '0 12px', fontSize: 13, color: '#a3a3a3' }}>Loading sellers...</div>}
                                </div>
                            </FilterSection>

                            {/* Specs / Sizes */}
                            <FilterSection title="Specs & Sizes" filterKey="specs" expanded={expandedFilters.specs} onToggle={toggleExpand}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {commonSizes.map(s => (
                                        <button key={s} onClick={() => handleSizeClick(s)}
                                            style={{
                                                padding: '8px 16px', borderRadius: 9999, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                                backgroundColor: currentSize === s ? '#000' : '#f0f0f0',
                                                color: currentSize === s ? '#fff' : '#525252',
                                                border: 'none', transition: 'all 0.15s',
                                            }}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* Delivery Section */}
                            <FilterSection title="Delivery" filterKey="delivery" expanded={expandedFilters.delivery} onToggle={toggleExpand}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', borderRadius: 10, backgroundColor: currentFreeDelivery ? '#f0fdf4' : '#f9f9f9', border: currentFreeDelivery ? '1px solid #bbf7d0' : '1px solid #eee', transition: 'all 0.2s' }}>
                                    <input
                                        type="checkbox"
                                        checked={currentFreeDelivery}
                                        onChange={(e) => setFilter('freeDelivery', e.target.checked ? 'true' : '')}
                                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#000' }}
                                    />
                                    <span style={{ fontSize: 14, fontWeight: currentFreeDelivery ? 700 : 500, color: currentFreeDelivery ? '#166534' : '#525252' }}>Free Delivery</span>
                                </label>
                            </FilterSection>

                            {/* Reset + Apply */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="button" onClick={resetAllFilters}
                                    style={{ flex: 1, padding: 12, borderRadius: 9999, background: '#f5f5f5', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                                    Reset All
                                </button>
                            </div>

                            {/* Active filter tags */}
                            {activeFilterCount > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                                    {currentCategory && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 9999, backgroundColor: '#f0f0f0', fontSize: 11, fontWeight: 500 }}>
                                            {categories.find(c => c._id === currentCategory)?.name || 'Category'}
                                            <button onClick={() => setFilter('category', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}><FiX size={12} /></button>
                                        </span>
                                    )}
                                    {currentColor && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 9999, backgroundColor: '#f0f0f0', fontSize: 11, fontWeight: 500 }}>
                                            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: currentColor, border: '1px solid #d4d4d4' }} /> Color
                                            <button onClick={() => setFilter('color', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}><FiX size={12} /></button>
                                        </span>
                                    )}
                                    {currentSize && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 9999, backgroundColor: '#f0f0f0', fontSize: 11, fontWeight: 500 }}>
                                            Size: {currentSize}
                                            <button onClick={() => setFilter('size', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}><FiX size={12} /></button>
                                        </span>
                                    )}
                                    {currentBrand && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 9999, backgroundColor: '#f0f0f0', fontSize: 11, fontWeight: 500 }}>
                                            Brand: {currentBrand}
                                            <button onClick={() => setFilter('brand', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}><FiX size={12} /></button>
                                        </span>
                                    )}
                                    {currentSeller && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 9999, backgroundColor: '#f0f0f0', fontSize: 11, fontWeight: 500 }}>
                                            Seller: {sellers.find(s => s.storeSlug === currentSeller)?.storeName || currentSeller}
                                            <button onClick={() => setFilter('seller', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}><FiX size={12} /></button>
                                        </span>
                                    )}
                                    {((currentMinPrice && currentMinPrice !== '0') || (currentMaxPrice && currentMaxPrice !== '200000')) && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 9999, backgroundColor: '#f0f0f0', fontSize: 11, fontWeight: 500 }}>
                                            PKR {currentMinPrice || 0}-{currentMaxPrice || '200k'}
                                            <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('minPrice'); p.delete('maxPrice'); p.set('page', '1'); setSearchParams(p, { replace: true, preventScrollReset: true }); setPriceRange([0, 200000]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}><FiX size={12} /></button>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>
                )}

                {/* ═══════════ PRODUCTS ═══════════ */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {location.state?.visualSearchResults && (
                        <div style={{
                            marginBottom: 24, padding: '12px 20px', borderRadius: 12,
                            background: 'linear-gradient(90deg, #f0fdf4 0%, #fff 100%)',
                            border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', gap: 16
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 8, overflow: 'hidden',
                                    backgroundColor: '#fff', border: '1px solid #e5e5e5'
                                }}>
                                    <img src={location.state.visualSearchImage} alt="Search query" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#166534', margin: 0 }}>Visual Search Results</h4>
                                    <p style={{ fontSize: 12, color: '#15803d', margin: 0 }}>Showing products matching your uploaded image</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    navigate('/shop', { replace: true, state: null });
                                }}
                                style={{
                                    fontSize: 12, fontWeight: 600, color: '#166534',
                                    background: '#dcfce7', border: 'none', padding: '6px 12px',
                                    borderRadius: 8, cursor: 'pointer'
                                }}
                            >
                                Clear x
                            </button>
                        </div>
                    )}



                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700 }}>
                                {location.state?.visualSearchResults ? 'Visual Matches' : (currentBrand || currentSearch || 'All Products')}
                            </h1>
                            {!isDesktop && (
                                <button onClick={() => setFiltersOpen(true)} style={{ padding: 8, border: '1px solid #e5e5e5', borderRadius: 8, background: '#fff', cursor: 'pointer', position: 'relative' }}>
                                    <FiFilter size={18} />
                                    {activeFilterCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#000', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilterCount}</span>}
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#737373' }}>
                            <span>Showing 1-{products.length} of {pagination.totalProducts || products.length} Products</span>
                            {isDesktop && (
                                <>
                                    <span style={{ marginLeft: 8 }}>Sort by:</span>
                                    <select value={currentSort} onChange={e => handleSortChange(e.target.value)}
                                        style={{ fontWeight: 600, color: '#000', outline: 'none', background: 'transparent', cursor: 'pointer', border: 'none', fontSize: 14 }}>
                                        {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </>
                            )}
                        </div>
                    </div>

                    {!isDesktop && (
                        <div style={{ marginBottom: 16 }}>
                            <select value={currentSort} onChange={e => handleSortChange(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 14, fontWeight: 500, outline: 'none' }}>
                                {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        {isBackgroundLoading && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(255,255,255,0.4)', zIndex: 10,
                                borderRadius: 16, pointerEvents: 'none', transition: 'opacity 0.2s'
                            }} />
                        )}
                        {loading ? (
                            <div className="product-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, minHeight: 400 }}>
                                {Array.from({ length: 9 }, (_, i) => (
                                    <div key={i}>
                                        <div style={{ backgroundColor: '#f0f0f0', borderRadius: 16, aspectRatio: '1', marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
                                        <div style={{ backgroundColor: '#f0f0f0', height: 14, borderRadius: 4, marginBottom: 8, width: '75%' }} />
                                        <div style={{ backgroundColor: '#f0f0f0', height: 12, borderRadius: 4, width: '50%' }} />
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '64px 0', minHeight: 400 }}>
                                <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
                                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No products found</h3>
                                <p style={{ color: '#737373', fontSize: 14, marginBottom: 16 }}>Try adjusting your filters or search terms.</p>
                                {activeFilterCount > 0 && (
                                    <button type="button" onClick={resetAllFilters}
                                        style={{ padding: '10px 24px', borderRadius: 9999, backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <motion.div
                                initial="hidden"
                                animate="show"
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
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}
                            >
                                {products.map(product => (
                                    <motion.div
                                        key={product._id}
                                        layout
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            show: { opacity: 1, y: 0 }
                                        }}
                                    >
                                        <ProductCard product={product} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {pagination.totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 40, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 14, fontWeight: 500, background: '#fff', cursor: 'pointer', opacity: currentPage <= 1 ? 0.4 : 1 }}>
                                ← Previous
                            </button>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => i + 1).map(page => (
                                    <button key={page} onClick={() => handlePageChange(page)}
                                        style={{ width: 36, height: 36, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: currentPage === page ? '#000' : 'transparent', color: currentPage === page ? '#fff' : '#000' }}>
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= pagination.totalPages}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 14, fontWeight: 500, background: '#fff', cursor: 'pointer', opacity: currentPage >= pagination.totalPages ? 0.4 : 1 }}>
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
