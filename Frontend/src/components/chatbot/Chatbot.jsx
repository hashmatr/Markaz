import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiSend, FiX, FiTrash2, FiChevronDown } from 'react-icons/fi';
import { chatbotAPI } from '../../api';

const QUICK_ACTIONS = [
    { label: 'Trending Products', message: 'Show me trending products' },
    { label: 'Best Deals', message: 'What are the best deals?' },
    { label: 'Track Order', message: 'How do I track my order?' },
    { label: 'Return Policy', message: 'What is the return policy?' },
    { label: 'Become a Seller', message: 'How do I become a seller?' },
];

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'bot',
            text: "Hello! Welcome to Markaz! 👋 I'm your AI shopping assistant. I can help you find products, compare items, track orders, and more.\n\nHow can I help you today?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(() => {
        return localStorage.getItem('markaz_chat_session') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    });
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);

    // Save sessionId
    useEffect(() => {
        localStorage.setItem('markaz_chat_session', sessionId);
    }, [sessionId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

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
                    timestamp: new Date(),
                },
            ]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                {
                    role: 'bot',
                    text: "I'm having trouble connecting right now. Please try again in a moment, or contact us at hashraxa266@gmail.com for help.",
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
        try {
            await chatbotAPI.clear({ sessionId });
        } catch { }
        const newSession = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSession);
        setMessages([
            {
                role: 'bot',
                text: "Chat cleared! 🔄 How can I help you today?",
                timestamp: new Date(),
            },
        ]);
    };

    // Format markdown-lite text
    const formatText = (text) => {
        if (!text) return '';

        // Convert **bold** to <strong>
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Convert [text](url) to links
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
            return `<a href="${url}" style="color:#0047ab;text-decoration:underline;font-weight:600">${label}</a>`;
        });

        // Convert bullet points
        formatted = formatted.replace(/^[•\-]\s/gm, '&bull; ');

        // Convert newlines to <br>
        formatted = formatted.replace(/\n/g, '<br/>');

        return formatted;
    };

    return (
        <>
            {/* ═══════════ FLOATING CHAT BUTTON ═══════════ */}
            <button
                id="chatbot-toggle"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
                    width: '60px', height: '60px', borderRadius: '50%',
                    backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isOpen ? 'scale(0)' : 'scale(1)',
                    opacity: isOpen ? 0 : 1,
                }}
                aria-label="Open chat"
            >
                {/* Chat icon */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>

                {/* Notification dot */}
                <span style={{
                    position: 'absolute', top: '-2px', right: '-2px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    backgroundColor: '#01ab31', border: '2px solid #fff',
                    animation: 'pulse 2s infinite',
                }} />
            </button>

            {/* ═══════════ CHAT WINDOW ═══════════ */}
            <div
                id="chatbot-window"
                style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 10000,
                    width: 'min(400px, calc(100vw - 32px))',
                    height: 'min(600px, calc(100vh - 100px))',
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
                    padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #000 0%, #1a1a2e 100%)', color: '#fff',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px', fontWeight: 700,
                        }}>
                            M
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 700, fontSize: '15px', margin: 0, lineHeight: 1.2 }}>Markaz Assistant</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span style={{
                                    width: '7px', height: '7px', borderRadius: '50%',
                                    backgroundColor: '#01ab31', display: 'inline-block',
                                }} />
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Online now</span>
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
                        <button onClick={() => setIsOpen(false)} title="Close chat"
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

                {/* ─── Messages ─── */}
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
                                    maxWidth: '85%',
                                    padding: '12px 16px',
                                    borderRadius: msg.role === 'user'
                                        ? '18px 18px 4px 18px'
                                        : '18px 18px 18px 4px',
                                    backgroundColor: msg.role === 'user' ? '#000' : '#fff',
                                    color: msg.role === 'user' ? '#fff' : '#000',
                                    fontSize: '13px', lineHeight: 1.65,
                                    boxShadow: msg.role === 'bot' ? '0 1px 6px rgba(0,0,0,0.06)' : 'none',
                                    border: msg.role === 'bot' ? '1px solid #f0f0f0' : 'none',
                                    wordBreak: 'break-word',
                                }}>
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
                                            {product.image ? (
                                                <div style={{
                                                    height: '100px', backgroundColor: '#f0f0f0',
                                                    overflow: 'hidden',
                                                }}>
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
                                                        ${product.discountedPrice || product.price}
                                                    </span>
                                                    {product.discountPercent > 0 && (
                                                        <span style={{
                                                            fontSize: '10px', color: '#fff',
                                                            backgroundColor: '#ff3333', padding: '1px 6px',
                                                            borderRadius: '9999px', fontWeight: 600,
                                                        }}>-{product.discountPercent}%</span>
                                                    )}
                                                </div>
                                                {product.rating > 0 && (
                                                    <p style={{ fontSize: '11px', color: '#737373', marginTop: '2px' }}>
                                                        ⭐ {product.rating.toFixed(1)}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {loading && (
                        <div style={{
                            display: 'flex', justifyContent: 'flex-start',
                        }}>
                            <div style={{
                                padding: '14px 20px', borderRadius: '18px 18px 18px 4px',
                                backgroundColor: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                                border: '1px solid #f0f0f0',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                                <span className="typing-dot" style={{
                                    width: '7px', height: '7px', borderRadius: '50%',
                                    backgroundColor: '#a3a3a3', display: 'inline-block',
                                    animation: 'typingBounce 1.4s infinite ease-in-out',
                                    animationDelay: '0s',
                                }} />
                                <span className="typing-dot" style={{
                                    width: '7px', height: '7px', borderRadius: '50%',
                                    backgroundColor: '#a3a3a3', display: 'inline-block',
                                    animation: 'typingBounce 1.4s infinite ease-in-out',
                                    animationDelay: '0.2s',
                                }} />
                                <span className="typing-dot" style={{
                                    width: '7px', height: '7px', borderRadius: '50%',
                                    backgroundColor: '#a3a3a3', display: 'inline-block',
                                    animation: 'typingBounce 1.4s infinite ease-in-out',
                                    animationDelay: '0.4s',
                                }} />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Scroll to bottom button */}
                {showScrollBtn && (
                    <button onClick={scrollToBottom} style={{
                        position: 'absolute', bottom: '130px', left: '50%',
                        transform: 'translateX(-50%)',
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: '#000', color: '#fff', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        zIndex: 5,
                    }}>
                        <FiChevronDown size={16} />
                    </button>
                )}

                {/* ─── Quick Actions ─── */}
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
                                }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#000'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fafafa'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#e5e5e5'; }}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* ─── Input Area ─── */}
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
                            placeholder="Ask me anything..."
                            disabled={loading}
                            style={{
                                flex: 1, background: 'none', border: 'none', outline: 'none',
                                fontSize: '14px', padding: '10px 0', fontFamily: "'Satoshi', sans-serif",
                                color: '#000',
                            }}
                        />
                    </div>
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        style={{
                            width: '44px', height: '44px', borderRadius: '14px',
                            backgroundColor: input.trim() ? '#000' : '#e5e5e5',
                            color: input.trim() ? '#fff' : '#a3a3a3',
                            border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s', flexShrink: 0,
                        }}
                    >
                        <FiSend size={18} />
                    </button>
                </div>
            </div>

            {/* ═══════════ ANIMATIONS ═══════════ */}
            <style>{`
                @keyframes typingBounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-6px); }
                }
            `}</style>
        </>
    );
}
