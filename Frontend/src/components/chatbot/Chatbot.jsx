import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiSend, FiX, FiTrash2, FiChevronDown, FiStar, FiShoppingBag, FiUser, FiTrendingUp } from 'react-icons/fi';
import { chatbotAPI, stylistAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const QUICK_ACTIONS = [
    { label: 'For You', message: 'Recommend products based on my browsing history', icon: '✨' },
    { label: 'Trending', message: 'Show me trending products', icon: '🔥' },
    { label: 'Best Deals', message: 'What are the best deals?', icon: '💰' },
    { label: 'My Style', message: 'What is my shopping style based on my history?', icon: '🎨' },
    { label: 'Track Order', message: 'How do I track my order?', icon: '📦' },
];

export default function Chatbot() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'forYou' | 'profile'
    const [messages, setMessages] = useState([
        {
            role: 'bot',
            text: user
                ? `Welcome back! I'm your Personal Shopper at Markaz. I learn from your browsing to suggest products you'll love.\n\nAsk me anything or tap "For You" to see personalized picks!`
                : `Hello! I'm your AI Personal Shopper at Markaz. I can help you find products, suggest outfits, and curate picks just for you.\n\nLogin to get personalized recommendations based on your style!`,
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(() => {
        return localStorage.getItem('markaz_stylist_session') || `stylist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    });
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    // Recommendations state
    const [recommendations, setRecommendations] = useState([]);
    const [recsLoading, setRecsLoading] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);

    // Save sessionId
    useEffect(() => {
        localStorage.setItem('markaz_stylist_session', sessionId);
    }, [sessionId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current && activeTab === 'chat') {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, activeTab]);

    // Load recommendations when "For You" tab is opened
    useEffect(() => {
        if (activeTab === 'forYou' && user && recommendations.length === 0 && !recsLoading) {
            loadRecommendations();
        }
    }, [activeTab]);

    // Load profile when profile tab opens
    useEffect(() => {
        if (activeTab === 'profile' && user && !userProfile && !profileLoading) {
            loadProfile();
        }
    }, [activeTab]);

    const loadRecommendations = async () => {
        if (!user) return;
        setRecsLoading(true);
        try {
            const res = await stylistAPI.getRecommendations({ limit: 12 });
            setRecommendations(res.data.data.products || []);
        } catch {
            setRecommendations([]);
        } finally {
            setRecsLoading(false);
        }
    };

    const loadProfile = async () => {
        if (!user) return;
        setProfileLoading(true);
        try {
            const res = await stylistAPI.getProfile();
            setUserProfile(res.data.data);
        } catch {
            setUserProfile(null);
        } finally {
            setProfileLoading(false);
        }
    };

    // Scroll detection
    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (overrideMessage) => {
        const msg = (overrideMessage || input).trim();
        if (!msg || loading) return;

        setActiveTab('chat');
        const userMsg = { role: 'user', text: msg, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await chatbotAPI.send({ message: msg, sessionId });
            const data = res.data.data;

            if (data.sessionId) setSessionId(data.sessionId);

            setMessages(prev => [
                ...prev,
                {
                    role: 'bot',
                    text: data.message,
                    products: data.products,
                    isPersonalized: data.isPersonalized,
                    timestamp: new Date(),
                },
            ]);
        } catch {
            setMessages(prev => [
                ...prev,
                {
                    role: 'bot',
                    text: "I'm having trouble connecting right now. Please try again in a moment.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClear = async () => {
        try { await chatbotAPI.clear({ sessionId }); } catch { }
        const newSession = `stylist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSession);
        setMessages([
            {
                role: 'bot',
                text: "Fresh start! How can I help you today?",
                timestamp: new Date(),
            },
        ]);
    };

    // Format markdown-lite text
    const formatText = (text) => {
        if (!text) return '';
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
            return `<a href="${url}" style="color:#6366f1;text-decoration:underline;font-weight:600">${label}</a>`;
        });
        formatted = formatted.replace(/^[•\-]\s/gm, '&bull; ');
        formatted = formatted.replace(/\n/g, '<br/>');
        return formatted;
    };

    // ─── Tab Navigation ───
    const tabs = [
        { id: 'chat', label: 'Chat', icon: <FiSend size={14} /> },
        { id: 'forYou', label: 'For You', icon: <FiStar size={14} /> },
        { id: 'profile', label: 'My Style', icon: <FiUser size={14} /> },
    ];

    return (
        <>
            {/* ═══════════ FLOATING CHAT BUTTON ═══════════ */}
            <button
                id="chatbot-toggle"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #333333 100%)',
                    color: '#fff', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isOpen ? 'scale(0)' : 'scale(1)',
                    opacity: isOpen ? 0 : 1,
                }}
                aria-label="Open Personal Shopper"
            >
                {/* Stylist icon */}
                <FiShoppingBag size={26} />
                {/* Pulse dot */}
                <span style={{
                    position: 'absolute', top: '-2px', right: '-2px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #34d399, #10b981)',
                    border: '2px solid #fff',
                    animation: 'pulse 2s infinite',
                }} />
            </button>

            {/* ═══════════ CHAT WINDOW ═══════════ */}
            <div
                id="chatbot-window"
                style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 10000,
                    width: 'min(420px, calc(100vw - 32px))',
                    height: 'min(640px, calc(100vh - 100px))',
                    borderRadius: '24px',
                    backgroundColor: '#fff',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)',
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    transformOrigin: 'bottom right',
                }}
            >
                {/* ─── Header ─── */}
                <div style={{
                    padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #262626 100%)', color: '#fff',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #333, #000)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px',
                        }}>
                            <FiShoppingBag size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 700, fontSize: '15px', margin: 0, lineHeight: 1.2 }}>
                                Personal Shopper
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span style={{
                                    width: '7px', height: '7px', borderRadius: '50%',
                                    backgroundColor: '#34d399', display: 'inline-block',
                                }} />
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                                    {user ? `Styling for ${user.fullName?.split(' ')[0]}` : 'AI-powered styling'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleClear} title="Clear chat"
                            style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                backgroundColor: 'rgba(255,255,255,0.1)', border: 'none',
                                color: '#fff', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                        >
                            <FiTrash2 size={15} />
                        </button>
                        <button onClick={() => setIsOpen(false)} title="Close"
                            style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                backgroundColor: 'rgba(255,255,255,0.1)', border: 'none',
                                color: '#fff', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                        >
                            <FiX size={17} />
                        </button>
                    </div>
                </div>

                {/* ─── Tab Bar ─── */}
                <div style={{
                    display: 'flex', borderBottom: '1px solid #f0f0f0',
                    flexShrink: 0, backgroundColor: '#fafafa',
                }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1, padding: '10px 0', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: '6px', fontSize: '12px', fontWeight: 600,
                                border: 'none', background: 'none', cursor: 'pointer',
                                color: activeTab === tab.id ? '#000000' : '#a3a3a3',
                                borderBottom: activeTab === tab.id ? '2px solid #000000' : '2px solid transparent',
                                transition: 'all 0.2s',
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ═══════════ CHAT TAB ═══════════ */}
                {activeTab === 'chat' && (
                    <>
                        {/* Messages */}
                        <div
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                            style={{
                                flex: 1, overflowY: 'auto', padding: '16px',
                                display: 'flex', flexDirection: 'column', gap: '12px',
                                background: '#f9f9f9',
                            }}
                            className="scrollbar-hide"
                        >
                            {messages.map((msg, i) => (
                                <div key={i}>
                                    {/* Message bubble */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    }}>
                                        <div style={{
                                            maxWidth: '85%', padding: '12px 16px',
                                            borderRadius: msg.role === 'user'
                                                ? '18px 18px 4px 18px'
                                                : '18px 18px 18px 4px',
                                            backgroundColor: msg.role === 'user'
                                                ? 'linear-gradient(135deg, #000012ff, #8b5cf6)'
                                                : '#fff',
                                            background: msg.role === 'user'
                                                ? 'linear-gradient(135deg, #010006ff, #000000ff)'
                                                : '#fff',
                                            color: msg.role === 'user' ? '#fff' : '#000',
                                            fontSize: '13px', lineHeight: 1.65,
                                            boxShadow: msg.role === 'bot' ? '0 1px 6px rgba(0,0,0,0.06)' : '0 2px 8px rgba(99,102,241,0.2)',
                                            border: msg.role === 'bot' ? '1px solid #f0f0f0' : 'none',
                                            wordBreak: 'break-word',
                                        }}>
                                            {msg.isPersonalized && msg.role === 'bot' && (
                                                <div style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    fontSize: '10px', fontWeight: 600, color: '#000',
                                                    backgroundColor: '#f5f5f5', padding: '2px 8px',
                                                    borderRadius: '9999px', marginBottom: '6px',
                                                }}>
                                                    <FiStar size={10} /> Personalized
                                                </div>
                                            )}
                                            <div dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                                        </div>
                                    </div>

                                    {/* Product cards */}
                                    {msg.products && msg.products.length > 0 && (
                                        <div style={{
                                            display: 'flex', gap: '10px', overflowX: 'auto',
                                            paddingBottom: '8px', paddingTop: '8px', paddingLeft: '4px',
                                        }} className="scrollbar-hide">
                                            {msg.products.map(product => (
                                                <Link key={product._id} to={`/product/${product._id}`}
                                                    onClick={() => setIsOpen(false)}
                                                    style={{
                                                        flex: '0 0 150px', borderRadius: '14px',
                                                        border: '1px solid #e5e5e5', backgroundColor: '#fff',
                                                        overflow: 'hidden', textDecoration: 'none', color: '#000',
                                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                                        position: 'relative',
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.transform = '';
                                                        e.currentTarget.style.boxShadow = '';
                                                    }}
                                                >
                                                    {/* Recommendation badge */}
                                                    {product.recommendationScore && (
                                                        <div style={{
                                                            position: 'absolute', top: '6px', left: '6px', zIndex: 2,
                                                            background: 'linear-gradient(135deg, #000, #333)',
                                                            color: '#fff', fontSize: '9px', fontWeight: 700,
                                                            padding: '2px 7px', borderRadius: '9999px',
                                                        }}>
                                                            For You
                                                        </div>
                                                    )}
                                                    {product.image ? (
                                                        <div style={{ height: '100px', backgroundColor: '#f0f0f0', overflow: 'hidden' }}>
                                                            <img src={product.image} alt={product.title}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            height: '100px', backgroundColor: '#f0f0f0',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: '#a3a3a3', fontSize: '11px',
                                                        }}>No Image</div>
                                                    )}
                                                    <div style={{ padding: '10px' }}>
                                                        <p style={{
                                                            fontSize: '12px', fontWeight: 600, marginBottom: '4px',
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        }}>{product.title}</p>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: 700 }}>
                                                                Rs.{product.discountedPrice || product.price}
                                                            </span>
                                                            {product.discountPercent > 0 && (
                                                                <span style={{
                                                                    fontSize: '10px', color: '#fff',
                                                                    backgroundColor: '#ef4444', padding: '1px 6px',
                                                                    borderRadius: '9999px', fontWeight: 600,
                                                                }}>-{product.discountPercent}%</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {loading && (
                                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                    <div style={{
                                        padding: '14px 20px', borderRadius: '18px 18px 18px 4px',
                                        backgroundColor: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                                        border: '1px solid #f0f0f0',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                    }}>
                                        {[0, 0.2, 0.4].map((delay, i) => (
                                            <span key={i} style={{
                                                width: '7px', height: '7px', borderRadius: '50%',
                                                backgroundColor: '#000', display: 'inline-block',
                                                animation: 'typingBounce 1.4s infinite ease-in-out',
                                                animationDelay: `${delay}s`,
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Scroll to bottom */}
                        {showScrollBtn && (
                            <button onClick={scrollToBottom} style={{
                                position: 'absolute', bottom: '130px', left: '50%',
                                transform: 'translateX(-50%)',
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: '#000', color: '#fff', border: 'none',
                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                zIndex: 5,
                            }}>
                                <FiChevronDown size={16} />
                            </button>
                        )}

                        {/* Quick Actions */}
                        {messages.length <= 2 && !loading && (
                            <div style={{
                                padding: '8px 16px 4px', display: 'flex', gap: '6px',
                                overflowX: 'auto', flexShrink: 0, backgroundColor: '#fff',
                                borderTop: '1px solid #f0f0f0',
                            }} className="scrollbar-hide">
                                {QUICK_ACTIONS.map((action, i) => (
                                    <button key={i} onClick={() => handleSend(action.message)}
                                        style={{
                                            flex: '0 0 auto', padding: '7px 14px', borderRadius: '9999px',
                                            border: '1px solid #e5e5e5', backgroundColor: '#fafafa',
                                            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                                            whiteSpace: 'nowrap', transition: 'all 0.2s', color: '#000',
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#000'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fafafa'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#e5e5e5'; }}
                                    >
                                        <span>{action.icon}</span> {action.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div style={{
                            padding: '12px 16px 16px', display: 'flex', gap: '10px',
                            alignItems: 'flex-end', borderTop: '1px solid #f0f0f0',
                            backgroundColor: '#fff', flexShrink: 0,
                        }}>
                            <div style={{
                                flex: 1, display: 'flex', alignItems: 'center',
                                backgroundColor: '#f5f5f5', borderRadius: '16px',
                                padding: '0 16px', minHeight: '44px',
                                border: '2px solid transparent',
                                transition: 'border-color 0.2s',
                            }}
                                onFocus={e => e.currentTarget.style.borderColor = '#000'}
                                onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={user ? 'Ask your personal shopper...' : 'Ask me anything...'}
                                    disabled={loading}
                                    style={{
                                        flex: 1, background: 'none', border: 'none', outline: 'none',
                                        fontSize: '14px', padding: '10px 0', fontFamily: "'Satoshi', sans-serif",
                                        color: '#000',
                                    }}
                                />
                            </div>
                            <button onClick={() => handleSend()} disabled={!input.trim() || loading}
                                style={{
                                    width: '44px', height: '44px', borderRadius: '14px',
                                    background: input.trim() ? 'linear-gradient(135deg, #000, #333)' : '#e5e5e5',
                                    color: input.trim() ? '#fff' : '#a3a3a3',
                                    border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s', flexShrink: 0,
                                    boxShadow: input.trim() ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                                }}
                            >
                                <FiSend size={18} />
                            </button>
                        </div>
                    </>
                )}

                {/* ═══════════ FOR YOU TAB ═══════════ */}
                {activeTab === 'forYou' && (
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f9f9f9' }} className="scrollbar-hide">
                        {!user ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128274;</div>
                                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Login Required</h4>
                                <p style={{ color: '#737373', fontSize: '13px', lineHeight: 1.6 }}>
                                    Login to get personalized product recommendations based on your browsing history.
                                </p>
                                <Link to="/login" onClick={() => setIsOpen(false)} style={{
                                    display: 'inline-block', marginTop: '16px',
                                    padding: '10px 24px', borderRadius: '9999px',
                                    background: 'linear-gradient(135deg, #000, #333)',
                                    color: '#fff', fontSize: '13px', fontWeight: 600,
                                    textDecoration: 'none',
                                }}>Login</Link>
                            </div>
                        ) : recsLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{
                                    width: '40px', height: '40px', border: '3px solid #e5e5e5',
                                    borderTopColor: '#000', borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                    margin: '0 auto 16px',
                                }} />
                                <p style={{ color: '#737373', fontSize: '13px' }}>Analyzing your style...</p>
                            </div>
                        ) : recommendations.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128717;</div>
                                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>No Recommendations Yet</h4>
                                <p style={{ color: '#737373', fontSize: '13px', lineHeight: 1.6 }}>
                                    Browse some products first! The more you explore, the better my recommendations will be.
                                </p>
                                <Link to="/shop" onClick={() => setIsOpen(false)} style={{
                                    display: 'inline-block', marginTop: '16px',
                                    padding: '10px 24px', borderRadius: '9999px',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: '#fff', fontSize: '13px', fontWeight: 600,
                                    textDecoration: 'none',
                                }}>Start Browsing</Link>
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    marginBottom: '16px',
                                }}>
                                    <FiTrendingUp size={16} style={{ color: '#000' }} />
                                    <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Curated For You</h4>
                                    <button onClick={loadRecommendations} style={{
                                        marginLeft: 'auto', fontSize: '11px', color: '#000',
                                        background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                                    }}>Refresh</button>
                                </div>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '10px',
                                }}>
                                    {recommendations.map(product => (
                                        <Link key={product._id} to={`/product/${product._id}`}
                                            onClick={() => setIsOpen(false)}
                                            style={{
                                                borderRadius: '14px', border: '1px solid #e5e5e5',
                                                backgroundColor: '#fff', overflow: 'hidden',
                                                textDecoration: 'none', color: '#000',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = '';
                                                e.currentTarget.style.boxShadow = '';
                                            }}
                                        >
                                            <div style={{ height: '100px', backgroundColor: '#f0f0f0', overflow: 'hidden' }}>
                                                {product.images?.[0]?.url ? (
                                                    <img src={product.images[0].url} alt={product.title}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        loading="lazy" />
                                                ) : (
                                                    <div style={{
                                                        height: '100%', display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', color: '#a3a3a3', fontSize: '11px',
                                                    }}>No Image</div>
                                                )}
                                            </div>
                                            <div style={{ padding: '10px' }}>
                                                <p style={{
                                                    fontSize: '12px', fontWeight: 600, marginBottom: '4px',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                }}>{product.title}</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#000' }}>
                                                        $.{product.discountedPrice || product.price}
                                                    </span>
                                                </div>
                                                {product.category?.name && (
                                                    <p style={{ fontSize: '10px', color: '#a3a3a3', marginTop: '2px' }}>
                                                        {product.category.name}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ═══════════ PROFILE TAB ═══════════ */}
                {activeTab === 'profile' && (
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f9f9f9' }} className="scrollbar-hide">
                        {!user ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128100;</div>
                                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Login to See Your Style</h4>
                                <p style={{ color: '#737373', fontSize: '13px', lineHeight: 1.6 }}>
                                    Your browsing patterns help us understand your taste and preferences.
                                </p>
                            </div>
                        ) : profileLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{
                                    width: '40px', height: '40px', border: '3px solid #e5e5e5',
                                    borderTopColor: '#000', borderRadius: '50%',
                                    animation: 'spin 1s linear infinite', margin: '0 auto 16px',
                                }} />
                                <p style={{ color: '#737373', fontSize: '13px' }}>Building your style profile...</p>
                            </div>
                        ) : !userProfile?.stats ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128064;</div>
                                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>No Data Yet</h4>
                                <p style={{ color: '#737373', fontSize: '13px', lineHeight: 1.6 }}>
                                    Start browsing products to build your style profile!
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Stats Overview */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #000, #333)',
                                    borderRadius: '16px', padding: '20px', marginBottom: '16px',
                                    color: '#fff',
                                }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', opacity: 0.9 }}>
                                        Your Browsing Overview
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{
                                            backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px',
                                            padding: '12px', textAlign: 'center',
                                        }}>
                                            <div style={{ fontSize: '24px', fontWeight: 700 }}>
                                                {userProfile.stats.totalViews}
                                            </div>
                                            <div style={{ fontSize: '11px', opacity: 0.7 }}>Total Views</div>
                                        </div>
                                        <div style={{
                                            backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px',
                                            padding: '12px', textAlign: 'center',
                                        }}>
                                            <div style={{ fontSize: '24px', fontWeight: 700 }}>
                                                {userProfile.stats.uniqueProducts}
                                            </div>
                                            <div style={{ fontSize: '11px', opacity: 0.7 }}>Products Explored</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Categories */}
                                {userProfile.stats.topCategories?.length > 0 && (
                                    <div style={{
                                        backgroundColor: '#fff', borderRadius: '16px',
                                        padding: '16px', marginBottom: '12px',
                                        border: '1px solid #f0f0f0',
                                    }}>
                                        <h5 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: '#000' }}>
                                            Your Top Categories
                                        </h5>
                                        {userProfile.stats.topCategories.map((cat, i) => (
                                            <div key={i} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '8px 0', borderBottom: i < userProfile.stats.topCategories.length - 1 ? '1px solid #f5f5f5' : 'none',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        width: '8px', height: '8px', borderRadius: '50%',
                                                        background: `hsl(${240 + i * 30}, 70%, 60%)`,
                                                    }} />
                                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{cat.name}</span>
                                                </div>
                                                <span style={{ fontSize: '12px', color: '#000', fontWeight: 600 }}>
                                                    {cat.views} views
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Top Brands */}
                                {userProfile.stats.topBrands?.length > 0 && (
                                    <div style={{
                                        backgroundColor: '#fff', borderRadius: '16px',
                                        padding: '16px', marginBottom: '12px',
                                        border: '1px solid #f0f0f0',
                                    }}>
                                        <h5 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: '#000' }}>
                                            Your Favorite Brands
                                        </h5>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {userProfile.stats.topBrands.map((brand, i) => (
                                                <span key={i} style={{
                                                    padding: '6px 14px', borderRadius: '9999px',
                                                    backgroundColor: '#eef2ff', color: '#4338ca',
                                                    fontSize: '12px', fontWeight: 600,
                                                }}>
                                                    {brand.name} ({brand.views})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Price Preference */}
                                {userProfile.profile?.preferredPriceRange && (
                                    <div style={{
                                        backgroundColor: '#fff', borderRadius: '16px',
                                        padding: '16px', border: '1px solid #f0f0f0',
                                    }}>
                                        <h5 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#000' }}>
                                            Price Sweet Spot
                                        </h5>
                                        <span style={{
                                            display: 'inline-block', padding: '6px 14px',
                                            borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                                            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                                            color: '#92400e',
                                        }}>
                                            {userProfile.profile.preferredPriceRange.charAt(0).toUpperCase() +
                                                userProfile.profile.preferredPriceRange.slice(1)} Range
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ═══════════ ANIMATIONS ═══════════ */}
            <style>{`
                @keyframes typingBounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-6px); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </>
    );
}
