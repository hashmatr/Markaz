import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiPhone, FiEdit, FiLock, FiLogOut } from 'react-icons/fi';
import Breadcrumb from '../components/ui/Breadcrumb';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '' });
    const [loading, setLoading] = useState(false);
    const [changingPass, setChangingPass] = useState(false);
    const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { fullName: form.fullName };
            if (form.phone && form.phone.trim()) payload.phone = form.phone.trim();
            const res = await authAPI.updateProfile(payload);
            updateUser(res.data.data.user);
            toast.success('Profile updated!');
            setEditing(false);
        }
        catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
        finally { setLoading(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passForm.newPassword !== passForm.confirmPassword) { toast.error('Passwords do not match'); return; }
        setLoading(true);
        try { await authAPI.changePassword(passForm); toast.success('Password changed!'); setChangingPass(false); setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    if (!user) { navigate('/login'); return null; }

    const inputStyle = { width: '100%', backgroundColor: '#f0f0f0', borderRadius: '9999px', padding: '14px 16px', fontSize: '14px', outline: 'none', border: '2px solid transparent' };

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 20px 48px' }}>
            <Breadcrumb items={[{ label: 'My Profile' }]} />
            <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '28px', fontWeight: 700, marginBottom: '32px' }}>MY PROFILE</h1>

            {/* Profile Card */}
            <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '32px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ width: '64px', height: '64px', backgroundColor: '#000', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, fontFamily: "'Integral CF', sans-serif" }}>
                        {user.fullName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                        <h2 style={{ fontWeight: 700, fontSize: '18px' }}>{user.fullName}</h2>
                        <p style={{ fontSize: '13px', color: '#737373' }}>{user.email}</p>
                        <span style={{ fontSize: '11px', fontWeight: 500, backgroundColor: '#f0f0f0', padding: '2px 8px', borderRadius: '9999px', textTransform: 'capitalize' }}>{user.role}</span>
                    </div>
                </div>

                {editing ? (
                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full Name" style={inputStyle} />
                        <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" style={inputStyle} />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '12px 24px' }}>{loading ? 'Saving...' : 'Save'}</button>
                            <button type="button" onClick={() => setEditing(false)} className="btn-outline" style={{ padding: '12px 24px' }}>Cancel</button>
                        </div>
                    </form>
                ) : (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div><p style={{ fontSize: '11px', color: '#a3a3a3', marginBottom: '4px' }}>Full Name</p><p style={{ fontWeight: 500, fontSize: '14px' }}>{user.fullName}</p></div>
                            <div><p style={{ fontSize: '11px', color: '#a3a3a3', marginBottom: '4px' }}>Email</p><p style={{ fontWeight: 500, fontSize: '14px' }}>{user.email}</p></div>
                            <div><p style={{ fontSize: '11px', color: '#a3a3a3', marginBottom: '4px' }}>Phone</p><p style={{ fontWeight: 500, fontSize: '14px' }}>{user.phone || 'Not set'}</p></div>
                            <div><p style={{ fontSize: '11px', color: '#a3a3a3', marginBottom: '4px' }}>Role</p><p style={{ fontWeight: 500, fontSize: '14px', textTransform: 'capitalize' }}>{user.role}</p></div>
                        </div>
                        <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
                            <FiEdit size={14} /> Edit Profile
                        </button>
                    </div>
                )}
            </div>

            {/* Change Password */}
            <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '32px', marginBottom: '24px' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><FiLock size={18} /> Change Password</h3>
                {changingPass ? (
                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <input type="password" placeholder="Current Password" value={passForm.currentPassword} onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })} style={inputStyle} required />
                        <input type="password" placeholder="New Password" value={passForm.newPassword} onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })} style={inputStyle} required />
                        <input type="password" placeholder="Confirm Password" value={passForm.confirmPassword} onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })} style={inputStyle} required />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '12px 24px' }}>{loading ? 'Changing...' : 'Change'}</button>
                            <button type="button" onClick={() => setChangingPass(false)} className="btn-outline" style={{ padding: '12px 24px' }}>Cancel</button>
                        </div>
                    </form>
                ) : (
                    <button onClick={() => setChangingPass(true)} style={{ fontSize: '14px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>Update your password →</button>
                )}
            </div>

            <button onClick={async () => { await logout(); navigate('/'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff3333', fontWeight: 500, fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>
                <FiLogOut size={16} /> Sign Out
            </button>
        </div>
    );
}
