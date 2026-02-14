import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiFilter, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import ProductCard from '../components/product/ProductCard';
import Breadcrumb from '../components/ui/Breadcrumb';
import { productAPI, categoryAPI } from '../api';

const colors = ['#ff0000', '#00c12b', '#0000ff', '#ff8800', '#00aaff', '#800080', '#ff69b4', '#ffc0cb', '#ff6347', '#000'];
const sizes = ['XX-Small', 'X-Small', 'Small', 'Medium', 'Large', 'X-Large', 'XX-Large', '3X-Large'];
const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
];

const demoProducts = [];

export default function ShopPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState(demoProducts);
    const [loading, setLoading] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalProducts: 0 });
    const [categories, setCategories] = useState([]);
    const [priceRange, setPriceRange] = useState([50, 200]);
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [expandedFilters, setExpandedFilters] = useState({ categories: true, price: true, colors: true, size: true, style: true });

    // Responsive detection
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
    useEffect(() => {
        const onResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const currentSort = searchParams.get('sort') || 'popular';
    const currentSearch = searchParams.get('search') || '';
    const currentPage = parseInt(searchParams.get('page') || '1');
    const currentCategory = searchParams.get('category') || '';
    const currentMinPrice = searchParams.get('minPrice') || '';
    const currentMaxPrice = searchParams.get('maxPrice') || '';
    const currentColor = searchParams.get('color') || '';

    // Sync local state from URL params on load
    useEffect(() => {
        if (currentMinPrice || currentMaxPrice) {
            setPriceRange([parseInt(currentMinPrice) || 50, parseInt(currentMaxPrice) || 500]);
        }
        if (currentColor) setSelectedColor(currentColor);
    }, []);

    useEffect(() => { categoryAPI.getAll().then(res => setCategories(res.data.data.categories || [])).catch(() => { }); }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = { sort: currentSort, page: currentPage, limit: 9 };
                if (currentSearch) params.search = currentSearch;
                if (currentCategory) params.category = currentCategory;
                if (currentMinPrice) params.minPrice = currentMinPrice;
                if (currentMaxPrice) params.maxPrice = currentMaxPrice;
                if (currentColor) params.color = currentColor;
                const res = await productAPI.getAll(params);
                if (res.data.data.products.length >= 0) {
                    setProducts(res.data.data.products);
                    setPagination(res.data.data.pagination);
                }
            } catch {
                setProducts([]);
            } finally { setLoading(false); }
        };
        fetchProducts();
    }, [currentSort, currentSearch, currentPage, currentCategory, currentMinPrice, currentMaxPrice, currentColor]);

    const handleSortChange = (v) => { const p = new URLSearchParams(searchParams); p.set('sort', v); p.set('page', '1'); setSearchParams(p); };
    const handlePageChange = (pg) => { const p = new URLSearchParams(searchParams); p.set('page', pg.toString()); setSearchParams(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const toggleFilter = (k) => setExpandedFilters(prev => ({ ...prev, [k]: !prev[k] }));

    const FilterSection = ({ title, filterKey, children }) => (
        <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '20px' }}>
            <button onClick={() => toggleFilter(filterKey)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontWeight: 600, fontSize: '14px', marginBottom: expandedFilters[filterKey] ? '12px' : 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                {title}
                {expandedFilters[filterKey] ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>
            {expandedFilters[filterKey] && children}
        </div>
    );

    const hasRealCategories = categories.length > 0;
    const catList = hasRealCategories ? categories : [
        { _id: 'tshirts', name: 'T-shirts' }, { _id: 'shorts', name: 'Shorts' },
        { _id: 'shirts', name: 'Shirts' }, { _id: 'hoodie', name: 'Hoodie' }, { _id: 'jeans', name: 'Jeans' },
    ];

    // Determine if a category is "active"
    const isCatActive = (cat) => {
        if (hasRealCategories) return currentCategory === cat._id;
        return currentSearch === cat.name.toLowerCase();
    };

    const handleCatClick = (cat) => {
        const p = new URLSearchParams(searchParams);
        if (hasRealCategories) {
            currentCategory === cat._id ? p.delete('category') : p.set('category', cat._id);
        } else {
            currentSearch === cat.name.toLowerCase() ? p.delete('search') : p.set('search', cat.name.toLowerCase());
            p.delete('category');
        }
        p.set('page', '1');
        setSearchParams(p);
        if (!isDesktop) setFiltersOpen(false);
    };

    // Show filter sidebar: on desktop always, on mobile only when filtersOpen
    const showFilters = isDesktop || filtersOpen;

    return (
        <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
            <Breadcrumb items={[{ label: currentSearch || 'Shop' }]} />

            <div style={{ display: 'flex', gap: '32px' }}>
                {/* ═══════════ FILTERS ═══════════ */}
                {showFilters && (
                    <aside style={{
                        position: filtersOpen && !isDesktop ? 'fixed' : 'static',
                        inset: filtersOpen && !isDesktop ? 0 : 'auto',
                        zIndex: filtersOpen && !isDesktop ? 40 : 'auto',
                        backgroundColor: '#fff',
                        width: isDesktop ? '260px' : '100%',
                        minWidth: isDesktop ? '260px' : 'auto',
                        flexShrink: 0,
                        overflowY: filtersOpen && !isDesktop ? 'auto' : 'visible',
                    }}>
                        <div style={{ border: isDesktop ? '1px solid #e5e5e5' : 'none', borderRadius: '16px', padding: '20px' }}>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '18px' }}>Filters</h3>
                                {!isDesktop ? (
                                    <button onClick={() => setFiltersOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiX size={22} /></button>
                                ) : (
                                    <FiFilter size={20} style={{ color: '#a3a3a3' }} />
                                )}
                            </div>

                            <FilterSection title="Categories" filterKey="categories">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {catList.map(cat => (
                                        <button key={cat._id}
                                            onClick={() => handleCatClick(cat)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', fontSize: '14px',
                                                backgroundColor: isCatActive(cat) ? '#000' : 'transparent',
                                                color: isCatActive(cat) ? '#fff' : '#525252',
                                                border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%'
                                            }}>
                                            {cat.name}
                                            <FiChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>

                            <FilterSection title="Price" filterKey="price">
                                <div style={{ padding: '0 8px' }}>
                                    <input type="range" min="0" max="500" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                        style={{ width: '100%', accentColor: '#000' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#737373', marginTop: '4px' }}>
                                        <span>${priceRange[0]}</span><span>${priceRange[1]}</span>
                                    </div>
                                </div>
                            </FilterSection>

                            <FilterSection title="Colors" filterKey="colors">
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {colors.map(c => (
                                        <button key={c} onClick={() => setSelectedColor(selectedColor === c ? '' : c)}
                                            style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: c, border: selectedColor === c ? '3px solid #000' : '2px solid #e5e5e5', cursor: 'pointer', transition: 'all 0.15s' }} />
                                    ))}
                                </div>
                            </FilterSection>

                            <FilterSection title="Size" filterKey="size">
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {sizes.map(s => (
                                        <button key={s} onClick={() => setSelectedSize(selectedSize === s ? '' : s)}
                                            style={{
                                                padding: '8px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                                                backgroundColor: selectedSize === s ? '#000' : '#f0f0f0', color: selectedSize === s ? '#fff' : '#525252', border: 'none',
                                            }}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>

                            <FilterSection title="Dress Style" filterKey="style">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {['Casual', 'Formal', 'Party', 'Gym'].map(style => (
                                        <button key={style}
                                            onClick={() => {
                                                const p = new URLSearchParams(searchParams);
                                                currentSearch === style.toLowerCase() ? p.delete('search') : p.set('search', style.toLowerCase());
                                                p.set('page', '1');
                                                setSearchParams(p);
                                                if (!isDesktop) setFiltersOpen(false);
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', fontSize: '14px',
                                                color: currentSearch === style.toLowerCase() ? '#fff' : '#525252',
                                                backgroundColor: currentSearch === style.toLowerCase() ? '#000' : 'transparent',
                                                borderRadius: '8px',
                                                border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.15s',
                                            }}>
                                            {style}<FiChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>

                            <button className="btn-primary" style={{ width: '100%', padding: '14px' }}
                                onClick={() => {
                                    const p = new URLSearchParams(searchParams);
                                    // Price
                                    if (priceRange[0] > 0) p.set('minPrice', priceRange[0].toString());
                                    else p.delete('minPrice');
                                    if (priceRange[1] < 500) p.set('maxPrice', priceRange[1].toString());
                                    else p.delete('maxPrice');
                                    // Color
                                    if (selectedColor) p.set('color', selectedColor);
                                    else p.delete('color');
                                    p.set('page', '1');
                                    setSearchParams(p);
                                    if (!isDesktop) setFiltersOpen(false);
                                }}>
                                Apply Filter
                            </button>
                        </div>
                    </aside>
                )}

                {/* ═══════════ PRODUCTS ═══════════ */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700 }}>{currentSearch || 'Casual'}</h1>
                            {!isDesktop && (
                                <button onClick={() => setFiltersOpen(true)} style={{ padding: '8px', border: '1px solid #e5e5e5', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>
                                    <FiFilter size={18} />
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#737373' }}>
                            <span>Showing 1-{products.length} of {pagination.totalProducts || products.length} Products</span>
                            {isDesktop && (
                                <>
                                    <span style={{ marginLeft: '8px' }}>Sort by:</span>
                                    <select value={currentSort} onChange={(e) => handleSortChange(e.target.value)}
                                        style={{ fontWeight: 600, color: '#000', outline: 'none', background: 'transparent', cursor: 'pointer', border: 'none', fontSize: '14px' }}>
                                        {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile sort */}
                    {!isDesktop && (
                        <div style={{ marginBottom: '16px' }}>
                            <select value={currentSort} onChange={(e) => handleSortChange(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px', fontWeight: 500, outline: 'none' }}>
                                {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                            {Array.from({ length: 9 }, (_, i) => (
                                <div key={i}>
                                    <div style={{ backgroundColor: '#f0f0f0', borderRadius: '16px', aspectRatio: '1', marginBottom: '12px', animation: 'pulse 1.5s infinite' }} />
                                    <div style={{ backgroundColor: '#f0f0f0', height: '14px', borderRadius: '4px', marginBottom: '8px', width: '75%' }} />
                                    <div style={{ backgroundColor: '#f0f0f0', height: '12px', borderRadius: '4px', width: '50%' }} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                            {products.map((product) => <ProductCard key={product._id} product={product} />)}
                        </div>
                    )}

                    {pagination.totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '40px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '14px', fontWeight: 500, background: '#fff', cursor: 'pointer', opacity: currentPage <= 1 ? 0.4 : 1 }}>
                                ← Previous
                            </button>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(page => (
                                    <button key={page} onClick={() => handlePageChange(page)}
                                        style={{ width: '36px', height: '36px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: currentPage === page ? '#000' : 'transparent', color: currentPage === page ? '#fff' : '#000' }}>
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= pagination.totalPages}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '14px', fontWeight: 500, background: '#fff', cursor: 'pointer', opacity: currentPage >= pagination.totalPages ? 0.4 : 1 }}>
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
