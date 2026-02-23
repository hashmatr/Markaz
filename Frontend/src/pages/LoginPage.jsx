import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '', role: 'CUSTOMER' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            if (user.role === 'ADMIN') navigate('/admin');
            else if (user.role === 'SELLER') navigate('/seller/dashboard');
            else navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const loggedInUser = await login(form.email, form.password);
            toast.success(`Welcome back, ${loggedInUser.fullName}!`);

            // Redirect based on role
            if (loggedInUser.role === 'ADMIN') navigate('/admin');
            else if (loggedInUser.role === 'SELLER') navigate('/seller/dashboard');
            else navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>
            <div style={{ width: '100%', maxWidth: '440px' }}>
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>WELCOME BACK</h1>
                    <p style={{ color: '#737373', fontSize: '14px' }}>Sign in to your account to continue</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Role Selection (Cosmetic/Intent) */}
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
                        <FiMail className="auth-input-icon" size={18} />
                        <input type="email" id="email" name="email" autoComplete="email" placeholder="Email address" required value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })} className="auth-input" />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <FiLock className="auth-input-icon" size={18} />
                        <input type={showPass ? 'text' : 'password'} id="password" name="password" autoComplete="current-password" placeholder="Password" required value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="auth-input" style={{ paddingRight: '48px' }} />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3' }}>
                            {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <Link to="/forgot-password" style={{ fontSize: '12px', color: '#737373' }}>Forgot Password?</Link>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ position: 'relative', margin: '32px 0' }}>
                    <hr style={{ border: 'none', borderTop: '1px solid #e5e5e5' }} />
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#fff', padding: '0 16px', fontSize: '12px', color: '#a3a3a3' }}>OR</span>
                </div>

                <p style={{ textAlign: 'center', fontSize: '14px', color: '#737373' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: '#000', fontWeight: 600, textDecoration: 'underline' }}>Sign Up</Link>
                </p>
            </div>
        </div>
    );
}
