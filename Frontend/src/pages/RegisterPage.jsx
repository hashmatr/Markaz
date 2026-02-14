import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'CUSTOMER' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            await register(form);
            toast.success('Account created successfully!');
            navigate(form.role === 'SELLER' ? '/seller/dashboard' : '/');
        } catch (err) {
            const errorData = err.response?.data;
            if (errorData?.errors && Array.isArray(errorData.errors)) {
                // Show the first validation error
                toast.error(errorData.errors[0].message);
            } else {
                toast.error(errorData?.message || 'Registration failed');
            }
        } finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>
            <div style={{ width: '100%', maxWidth: '440px' }}>
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>CREATE ACCOUNT</h1>
                    <p style={{ color: '#737373', fontSize: '14px' }}>Sign up to start shopping with the best deals</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Role Selection */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <button type="button" onClick={() => setForm({ ...form, role: 'CUSTOMER' })}
                            style={{
                                flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #e5e5e5',
                                backgroundColor: form.role === 'CUSTOMER' ? '#000' : 'transparent', color: form.role === 'CUSTOMER' ? '#fff' : '#000',
                            }}>
                            Customer
                        </button>
                        <button type="button" onClick={() => setForm({ ...form, role: 'SELLER' })}
                            style={{
                                flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #e5e5e5',
                                backgroundColor: form.role === 'SELLER' ? '#000' : 'transparent', color: form.role === 'SELLER' ? '#fff' : '#000',
                            }}>
                            Seller
                        </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <FiUser className="auth-input-icon" size={18} />
                        <input type="text" placeholder="Full Name" required value={form.fullName}
                            onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="auth-input" />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <FiMail className="auth-input-icon" size={18} />
                        <input type="email" placeholder="Email address" required value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })} className="auth-input" />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <FiLock className="auth-input-icon" size={18} />
                        <input type={showPass ? 'text' : 'password'} placeholder="Password (min 6 chars)" required value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="auth-input" style={{ paddingRight: '48px' }} />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3' }}>
                            {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    </div>
                    {/* Password Hint */}
                    <div style={{ fontSize: '11px', color: '#737373', padding: '0 4px', marginTop: '-8px' }}>
                        Must include 1 uppercase, 1 lowercase and 1 number.
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div style={{ position: 'relative', margin: '32px 0' }}>
                    <hr style={{ border: 'none', borderTop: '1px solid #e5e5e5' }} />
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#fff', padding: '0 16px', fontSize: '12px', color: '#a3a3a3' }}>OR</span>
                </div>

                <p style={{ textAlign: 'center', fontSize: '14px', color: '#737373' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#000', fontWeight: 600, textDecoration: 'underline' }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
}
