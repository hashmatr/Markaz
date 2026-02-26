import { useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiZap } from 'react-icons/fi';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';

export default function FlashSalesProducts({ flashSales = [] }) {
    const scrollRef = useRef(null);

    // Flatten all products from all active flash sales
    const allFlashProducts = flashSales.reduce((acc, sale) => {
        const products = sale.products?.map(p => ({
            ...p.product,
            price: p.originalPrice,
            discountedPrice: p.flashPrice,
            discountPercent: p.flashDiscountPercent,
            isFlashSale: true
        })) || [];
        return [...acc, ...products];
    }, []);

    if (allFlashProducts.length === 0) return null;

    const scroll = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
        }
    };

    return (
        <section style={{ paddingTop: '48px', paddingBottom: '24px', backgroundColor: '#fff' }}>
            <div className="container-main">
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '24px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <FiZap size={18} color="#fff" />
                        </div>
                        <h2 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '22px', fontWeight: 700 }}>
                            Flash Sale Products
                        </h2>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => scroll(-1)} className="carousel-btn"
                            style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                border: '1px solid #d4d4d4', background: '#fff',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                            <FiChevronLeft size={18} />
                        </button>
                        <button onClick={() => scroll(1)} className="carousel-btn"
                            style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                border: '1px solid #d4d4d4', background: '#fff',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                            <FiChevronRight size={18} />
                        </button>
                    </div>
                </div>

                <motion.div
                    ref={scrollRef}
                    className="scrollbar-hide"
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
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
                        display: 'flex', gap: '20px', overflowX: 'auto',
                        scrollSnapType: 'x mandatory', paddingBottom: '12px',
                    }}>
                    {allFlashProducts.map((product, idx) => (
                        <motion.div
                            key={`${product._id}-${idx}`}
                            variants={{
                                hidden: { opacity: 0, scale: 0.95 },
                                show: { opacity: 1, scale: 1 }
                            }}
                            style={{
                                flex: '0 0 240px', scrollSnapAlign: 'start',
                                position: 'relative'
                            }}>
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
