import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiHome, FiPhone, FiDollarSign } from 'react-icons/fi';
import Breadcrumb from '../components/ui/Breadcrumb';
import { useAuth } from '../context/AuthContext';
import { sellerAPI } from '../api';
import toast from 'react-hot-toast';

export default function BecomeSellerPage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        storeName: '', storeDescription: '', businessPhone: '', businessEmail: user?.email || '',
        bankName: '', accountNumber: '', accountTitle: '',
    });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await sellerAPI.register(form);
            updateUser({ ...user, role: 'SELLER' });
            toast.success('Seller account created!');
            navigate('/seller/dashboard');
        } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
        finally { setLoading(false); }
    };

    if (!user) { navigate('/login'); return null; }
    if (user.role === 'SELLER') { navigate('/seller/dashboard'); return null; }

    const inputStyle = { width: '100%', backgroundColor: '#f0f0f0', borderRadius: '9999px', padding: '14px 20px', fontSize: '14px', outline: 'none', border: '2px solid transparent' };

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 20px 48px' }}>
            <Breadcrumb items={[{ label: 'Become a Seller' }]} />
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '32px', fontWeight: 700, marginBottom: '12px' }}>BECOME A SELLER</h1>
                <p style={{ color: '#737373', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>Join our marketplace and start selling your products to thousands of customers.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '28px' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><FiHome /> Store Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <input name="storeName" required value={form.storeName} onChange={handleChange} placeholder="Store Name" style={inputStyle} />
                        <textarea name="storeDescription" required value={form.storeDescription} onChange={handleChange} placeholder="Store Description" rows="3"
                            style={{ ...inputStyle, borderRadius: '16px', resize: 'none' }} />
                    </div>
                </div>

                <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '28px' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><FiPhone /> Contact Details</h3>
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <input name="businessPhone" required value={form.businessPhone} onChange={handleChange} placeholder="Business Phone" style={{ ...inputStyle, flex: '1 1 200px' }} />
                        <input name="businessEmail" required value={form.businessEmail} onChange={handleChange} placeholder="Business Email" style={{ ...inputStyle, flex: '1 1 200px' }} />
                    </div>
                </div>

                <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '28px' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><FiDollarSign /> Bank Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <input name="bankName" required value={form.bankName} onChange={handleChange} placeholder="Bank Name" style={inputStyle} />
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            <input name="accountNumber" required value={form.accountNumber} onChange={handleChange} placeholder="Account Number" style={{ ...inputStyle, flex: '1 1 200px' }} />
                            <input name="accountTitle" required value={form.accountTitle} onChange={handleChange} placeholder="Account Title" style={{ ...inputStyle, flex: '1 1 200px' }} />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '18px', fontSize: '16px' }}>
                    {loading ? 'Registering...' : 'Register as Seller'}
                </button>
            </form>
        </div>
    );
}
