import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiZap } from 'react-icons/fi';

/**
 * FlashSalesBanner — Live countdown timer for flash deals.
 * Displays active flash sales with urgency-inducing countdowns.
 */
export default function FlashSalesBanner({ flashSales = [] }) {
    const [timeLeft, setTimeLeft] = useState({});
    const intervalRef = useRef(null);

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date().getTime();
            const updates = {};
            flashSales.forEach(sale => {
                const end = new Date(sale.endTime).getTime();
                const diff = end - now;
                if (diff > 0) {
                    updates[sale._id] = {
                        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                        seconds: Math.floor((diff % (1000 * 60)) / 1000),
                    };
                } else {
                    updates[sale._id] = null; // expired
                }
            });
            setTimeLeft(updates);
        };

        calculateTime();
        intervalRef.current = setInterval(calculateTime, 1000);
        return () => clearInterval(intervalRef.current);
    }, [flashSales]);

    // Use flashSales if they are inherently active (start <= now <= end)
    // even if the countdown timer state hasn't updated yet.
    const activeSales = flashSales.filter(sale => {
        const now = new Date();
        const start = new Date(sale.startTime);
        const end = new Date(sale.endTime);
        return sale.isActive && start <= now && end >= now;
    });

    if (activeSales.length === 0) return null;

    return (
        <section style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 40%, #991b1b 100%)',
            padding: '0',
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* Animated background pulse */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                animation: 'flashPulse 3s ease-in-out infinite',
            }} />

            <div className="container-main" style={{ padding: '20px' }}>
                {activeSales.map(sale => {
                    const t = timeLeft[sale._id] || { days: 0, hours: 0, minutes: 0, seconds: 0 };

                    return (
                        <div key={sale._id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1,
                        }}>
                            {/* Left - Title & Icon */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    animation: 'flashBounce 1s ease-in-out infinite',
                                }}>
                                    <FiZap size={22} color="#fff" />
                                </div>
                                <div>
                                    <h3 style={{
                                        color: '#fff', fontWeight: 800, fontSize: '18px',
                                        fontFamily: "'Satoshi', sans-serif",
                                        textTransform: 'uppercase', letterSpacing: '1px',
                                    }}>
                                        {sale.title || 'FLASH SALE'}
                                    </h3>
                                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                                        {sale.description || 'Limited time offers - Don\'t miss out!'}
                                    </p>
                                </div>
                            </div>

                            {/* Center - Countdown */}
                            <div style={{
                                display: 'flex', gap: '8px', alignItems: 'center',
                            }}>
                                {[
                                    { value: t.days, label: 'Days' },
                                    { value: t.hours, label: 'Hrs' },
                                    { value: t.minutes, label: 'Min' },
                                    { value: t.seconds, label: 'Sec' },
                                ].map(({ value, label }, i) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)',
                                            borderRadius: '12px', padding: '8px 12px', textAlign: 'center',
                                            minWidth: '52px', border: '1px solid rgba(255,255,255,0.1)',
                                        }}>
                                            <span style={{
                                                color: '#fff', fontSize: '22px', fontWeight: 800, display: 'block',
                                                fontFamily: "'Inter', monospace",
                                                fontVariantNumeric: 'tabular-nums',
                                            }}>
                                                {String(value).padStart(2, '0')}
                                            </span>
                                            <span style={{
                                                color: 'rgba(255,255,255,0.6)', fontSize: '9px',
                                                textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600,
                                            }}>
                                                {label}
                                            </span>
                                        </div>
                                        {i < 3 && (
                                            <span style={{
                                                color: 'rgba(255,255,255,0.5)', fontSize: '20px', fontWeight: 700,
                                                animation: 'flashBlink 1s step-end infinite',
                                            }}>:</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Right - CTA */}
                            <Link to="/shop?flashSale=true" style={{
                                background: '#fff', color: '#dc2626',
                                padding: '12px 28px', borderRadius: '9999px',
                                fontWeight: 700, fontSize: '14px', textDecoration: 'none',
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            }}>
                                Shop Now
                            </Link>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes flashPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes flashBounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes flashBlink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>
        </section>
    );
}
