import { useState } from 'react';
import { FiMail, FiPhone, FiMapPin, FiSend, FiClock, FiMessageSquare } from 'react-icons/fi';
import Breadcrumb from '../components/ui/Breadcrumb';
import toast from 'react-hot-toast';
import API from '../api';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }
        setLoading(true);
        try {
            const res = await API.post('/contact', form);
            toast.success(res.data.message || 'Message sent successfully!');
            setForm({ name: '', email: '', subject: '', message: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send message. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <div style={{ paddingBottom: 80 }}>
            {/* Hero */}
            <section style={{
                background: 'linear-gradient(135deg, #000 0%, #1a1a2e 50%, #16213e 100%)',
                color: '#fff', padding: '64px 0', textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.04) 0%, transparent 50%)',
                }} />
                <div className="container-main" style={{ position: 'relative', zIndex: 1 }}>
                    <Breadcrumb items={[{ label: 'Contact Us' }]} />
                    <h1 style={{
                        fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(32px, 5vw, 56px)',
                        fontWeight: 700, marginBottom: 16, lineHeight: 1.1,
                    }}>
                        GET IN TOUCH
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
                        Have a question, feedback, or need help? We'd love to hear from you.
                    </p>
                </div>
            </section>

            {/* Contact Info Cards */}
            <section className="container-main" style={{ marginTop: 40 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    {[
                        { icon: FiMail, title: 'Email Us', desc: 'hashraxa266@gmail.com', sub: 'We reply within 24 hours', href: 'mailto:hashraxa266@gmail.com' },
                        { icon: FiPhone, title: 'Call Us', desc: '+92 311 5732241', sub: 'Mon-Sat, 9 AM - 6 PM PKT', href: 'tel:+923115732241' },
                        { icon: FiMapPin, title: 'Visit Us', desc: 'Lahore, Pakistan', sub: 'Mon-Fri, 10 AM - 5 PM', href: '#' },
                        { icon: FiClock, title: 'Working Hours', desc: '9:00 AM - 9:00 PM', sub: 'Pakistan Standard Time', href: '#' },
                    ].map(({ icon: Icon, title, desc, sub, href }) => (
                        <a key={title} href={href}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                padding: '32px 20px', borderRadius: 20, backgroundColor: '#fff',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textDecoration: 'none', color: '#000',
                                border: '1px solid #f0f0f0', transition: 'all 0.25s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}
                        >
                            <div style={{
                                width: 52, height: 52, borderRadius: '50%', backgroundColor: '#000',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                            }}>
                                <Icon size={22} color="#fff" />
                            </div>
                            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{title}</h3>
                            <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{desc}</p>
                            <p style={{ color: '#a3a3a3', fontSize: 12 }}>{sub}</p>
                        </a>
                    ))}
                </div>
            </section>

            {/* Main Content: Form + Social */}
            <section className="container-main" style={{ marginTop: 64 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>
                    {/* Contact Form */}
                    <div style={{ flex: '1 1 420px', minWidth: 300 }}>
                        <div style={{
                            border: '1px solid #e5e5e5', borderRadius: 24, padding: 'clamp(24px, 3vw, 40px)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, backgroundColor: '#000',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <FiMessageSquare size={20} color="#fff" />
                                </div>
                                <div>
                                    <h2 style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>Send us a Message</h2>
                                    <p style={{ fontSize: 13, color: '#a3a3a3', margin: 0 }}>Fill the form and we'll get back to you</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#525252', display: 'block', marginBottom: 6 }}>Full Name *</label>
                                        <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                            placeholder="John Doe"
                                            style={{
                                                width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #e5e5e5',
                                                fontSize: 14, outline: 'none', transition: 'border-color 0.2s', backgroundColor: '#fafafa',
                                            }}
                                            onFocus={e => e.target.style.borderColor = '#000'}
                                            onBlur={e => e.target.style.borderColor = '#e5e5e5'}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#525252', display: 'block', marginBottom: 6 }}>Email *</label>
                                        <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                            placeholder="john@example.com"
                                            style={{
                                                width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #e5e5e5',
                                                fontSize: 14, outline: 'none', transition: 'border-color 0.2s', backgroundColor: '#fafafa',
                                            }}
                                            onFocus={e => e.target.style.borderColor = '#000'}
                                            onBlur={e => e.target.style.borderColor = '#e5e5e5'}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#525252', display: 'block', marginBottom: 6 }}>Subject</label>
                                    <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                                        style={{
                                            width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #e5e5e5',
                                            fontSize: 14, outline: 'none', backgroundColor: '#fafafa', cursor: 'pointer',
                                        }}>
                                        <option value="">Select a subject</option>
                                        <option value="General Inquiry">General Inquiry</option>
                                        <option value="Order Issue">Order Issue</option>
                                        <option value="Product Question">Product Question</option>
                                        <option value="Return / Refund">Return / Refund</option>
                                        <option value="Seller Support">Seller Support</option>
                                        <option value="Partnership">Partnership</option>
                                        <option value="Feedback">Feedback</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#525252', display: 'block', marginBottom: 6 }}>Message *</label>
                                    <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                                        placeholder="Tell us how we can help you..."
                                        rows={5}
                                        style={{
                                            width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #e5e5e5',
                                            fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: "'Satoshi', sans-serif",
                                            transition: 'border-color 0.2s', backgroundColor: '#fafafa',
                                        }}
                                        onFocus={e => e.target.style.borderColor = '#000'}
                                        onBlur={e => e.target.style.borderColor = '#e5e5e5'}
                                    />
                                </div>

                                <button type="submit" disabled={loading}
                                    className="btn-primary"
                                    style={{
                                        width: '100%', padding: 16, fontSize: 15, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', gap: 8,
                                        opacity: loading ? 0.7 : 1,
                                    }}>
                                    {loading ? 'Sending...' : <><FiSend size={16} /> Send Message</>}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Side: Direct Contact + Social */}
                    <div style={{ flex: '1 1 320px', minWidth: 280 }}>
                        {/* Direct Contact */}
                        <div style={{
                            border: '1px solid #e5e5e5', borderRadius: 24, padding: 28, marginBottom: 24,
                        }}>
                            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>Quick Contact</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <a href="https://wa.me/923115732241?text=Hi%2C%20I%20need%20help%20with%20my%20order"
                                    target="_blank" rel="noopener noreferrer"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                                        borderRadius: 14, backgroundColor: '#25D366', color: '#fff', textDecoration: 'none',
                                        fontSize: 14, fontWeight: 600, transition: 'transform 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                    Chat on WhatsApp
                                </a>

                                <a href="mailto:hashraxa266@gmail.com?subject=Help%20Needed%20-%20Markaz"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                                        borderRadius: 14, backgroundColor: '#EA4335', color: '#fff', textDecoration: 'none',
                                        fontSize: 14, fontWeight: 600, transition: 'transform 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    Email Us Directly
                                </a>

                                <a href="tel:+923115732241"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                                        borderRadius: 14, backgroundColor: '#000', color: '#fff', textDecoration: 'none',
                                        fontSize: 14, fontWeight: 600, transition: 'transform 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <FiPhone size={22} />
                                    Call Us Now
                                </a>
                            </div>
                        </div>



                        {/* FAQ Quick Help */}
                        <div style={{
                            borderRadius: 24, padding: 28,
                            background: 'linear-gradient(135deg, #000 0%, #1a1a2e 100%)', color: '#fff',
                        }}>
                            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 12 }}>Need Quick Help?</h3>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
                                Check our frequently asked questions for instant answers to common queries.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    'How do I track my order?',
                                    'What is the return policy?',
                                    'How do I become a seller?',
                                    'Is COD available?',
                                ].map(q => (
                                    <div key={q} style={{
                                        padding: '10px 14px', borderRadius: 10,
                                        backgroundColor: 'rgba(255,255,255,0.08)', fontSize: 13,
                                        cursor: 'pointer', transition: 'background 0.2s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                                    >
                                        {q}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="container-main" style={{ marginTop: 64 }}>
                <div style={{
                    borderRadius: 24, overflow: 'hidden', border: '1px solid #e5e5e5',
                    height: 320, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                }}>
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d435519.2274198684!2d74.00472024999999!3d31.4831515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39190483e58107d9%3A0xc23abe6ccc7e2462!2sLahore%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1"
                        width="100%" height="100%" style={{ border: 0 }}
                        allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                        title="Markaz Location"
                    />
                </div>
            </section>
        </div>
    );
}
