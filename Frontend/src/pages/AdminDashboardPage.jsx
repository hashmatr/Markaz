import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiDollarSign, FiShoppingBag, FiPackage, FiGrid, FiShoppingCart, FiUserCheck, FiCreditCard } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../api';

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('overview');

    const [sellers, setSellers] = useState([]);
    const [fetchingData, setFetchingData] = useState(false);

    useEffect(() => {
        adminAPI.getDashboard().then(r => setDashboard(r.data.data.dashboard)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (activeSection === 'sellers') {
            setFetchingData(true);
            adminAPI.getAllSellers().then(r => setSellers(r.data.data.sellers)).catch(() => { }).finally(() => setFetchingData(false));
        }
    }, [activeSection]);

    const handleUpdateSellerStatus = async (sellerId, status) => {
        try {
            await adminAPI.updateSellerStatus(sellerId, { status });
            toast.success(`Seller account ${status === 'active' ? 'approved' : 'rejected'} successfully!`);
            // Refresh list
            const res = await adminAPI.getAllSellers();
            setSellers(res.data.data.sellers);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update seller status');
        }
    };

    if (!user || user.role !== 'ADMIN') {
        return (
            <div className="container-main" style={{ paddingTop: '64px', paddingBottom: '64px', textAlign: 'center' }}>
                <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>ACCESS DENIED</h2>
                <p style={{ color: '#737373', marginBottom: '24px' }}>You need admin privileges to access this page.</p>
                <Link to="/" className="btn-primary">Go Home</Link>
            </div>
        );
    }

    const stats = dashboard ? [
        { label: 'Total Users', value: dashboard.totalUsers, icon: FiUsers, bg: '#eff6ff', fg: '#2563eb' },
        { label: 'Total Sellers', value: dashboard.totalSellers, icon: FiUserCheck, bg: '#f0fdf4', fg: '#16a34a' },
        { label: 'Total Orders', value: dashboard.totalOrders, icon: FiShoppingBag, bg: '#faf5ff', fg: '#9333ea' },
        { label: 'Total Revenue', value: `$${dashboard.totalRevenue}`, icon: FiDollarSign, bg: '#fefce8', fg: '#ca8a04' },
        { label: 'Commission', value: `$${dashboard.totalCommission}`, icon: FiCreditCard, bg: '#fdf2f8', fg: '#db2777' },
        { label: 'Products', value: dashboard.totalProducts, icon: FiPackage, bg: '#eef2ff', fg: '#4f46e5' },
    ] : [];

    const sideItems = [
        { key: 'overview', icon: FiGrid, label: 'Overview' },
        { key: 'users', icon: FiUsers, label: 'Users' },
        { key: 'sellers', icon: FiUserCheck, label: 'Sellers' },
        { key: 'orders', icon: FiShoppingCart, label: 'Orders' },
        { key: 'categories', icon: FiPackage, label: 'Categories' },
        { key: 'payouts', icon: FiCreditCard, label: 'Payouts' },
    ];

    return (
        <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
            <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, marginBottom: '24px' }}>ADMIN DASHBOARD</h1>

            <div style={{ display: 'flex', gap: '28px' }}>
                {/* Sidebar */}
                <aside className="hidden lg:block" style={{ width: '220px', flexShrink: 0 }}>
                    <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '12px', position: 'sticky', top: '96px' }}>
                        {sideItems.map(({ key, icon: Icon, label }) => (
                            <button key={key} onClick={() => setActiveSection(key)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', marginBottom: '4px',
                                    backgroundColor: activeSection === key ? '#000' : 'transparent', color: activeSection === key ? '#fff' : '#525252',
                                    transition: 'all 0.15s',
                                }}>
                                <Icon size={18} /> {label}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="lg:hidden scrollbar-hide" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px' }}>
                        {sideItems.map(({ key, label }) => (
                            <button key={key} onClick={() => setActiveSection(key)}
                                style={{
                                    padding: '8px 16px', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
                                    backgroundColor: activeSection === key ? '#000' : '#f0f0f0', color: activeSection === key ? '#fff' : '#000',
                                }}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {activeSection === 'overview' && (
                        <>
                            {loading ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ height: '110px', backgroundColor: '#f0f0f0', borderRadius: '20px', animation: 'pulse 1.5s infinite' }} />)}
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                    {stats.map(({ label, value, icon: Icon, bg, fg }) => (
                                        <div key={label} style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '24px' }}>
                                            <div style={{ width: '40px', height: '40px', backgroundColor: bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: fg }}>
                                                <Icon size={20} />
                                            </div>
                                            <p style={{ fontSize: '24px', fontWeight: 700 }}>{value}</p>
                                            <p style={{ fontSize: '13px', color: '#737373' }}>{label}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeSection === 'sellers' && (
                        <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', overflow: 'hidden' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid #e5e5e5', backgroundColor: '#fafafa' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '18px' }}>Seller Management</h3>
                            </div>
                            <div style={{ padding: '20px' }}>
                                {fetchingData ? (
                                    <p>Loading sellers...</p>
                                ) : sellers.length === 0 ? (
                                    <p>No sellers found.</p>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
                                                    <th style={{ padding: '12px' }}>Store Name</th>
                                                    <th style={{ padding: '12px' }}>Email</th>
                                                    <th style={{ padding: '12px' }}>Status</th>
                                                    <th style={{ padding: '12px' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sellers.map(s => (
                                                    <tr key={s._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                        <td style={{ padding: '12px' }}>
                                                            <div style={{ fontWeight: 600 }}>{s.storeName}</div>
                                                            <div style={{ fontSize: '12px', color: '#737373' }}>{s.user?.fullName}</div>
                                                        </td>
                                                        <td style={{ padding: '12px' }}>{s.businessEmail}</td>
                                                        <td style={{ padding: '12px' }}>
                                                            <span style={{
                                                                padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500,
                                                                backgroundColor: s.accountStatus === 'active' ? '#f0fdf4' : s.accountStatus === 'pending' ? '#fffbeb' : '#fef2f2',
                                                                color: s.accountStatus === 'active' ? '#16a34a' : s.accountStatus === 'pending' ? '#d97706' : '#dc2626',
                                                                textTransform: 'capitalize'
                                                            }}>
                                                                {s.accountStatus}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '12px' }}>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                {s.accountStatus === 'pending' && (
                                                                    <>
                                                                        <button onClick={() => handleUpdateSellerStatus(s._id, 'active')}
                                                                            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                                                                            Approve
                                                                        </button>
                                                                        <button onClick={() => handleUpdateSellerStatus(s._id, 'rejected')}
                                                                            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #dc2626', cursor: 'pointer', fontSize: '12px' }}>
                                                                            Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {s.accountStatus === 'active' && (
                                                                    <button onClick={() => handleUpdateSellerStatus(s._id, 'suspended')}
                                                                        style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #dc2626', cursor: 'pointer', fontSize: '12px' }}>
                                                                        Suspend
                                                                    </button>
                                                                )}
                                                                {s.accountStatus === 'suspended' && (
                                                                    <button onClick={() => handleUpdateSellerStatus(s._id, 'active')}
                                                                        style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                                                                        Reactivate
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection !== 'overview' && activeSection !== 'sellers' && (
                        <div style={{ border: '1px solid #e5e5e5', borderRadius: '20px', padding: '48px', textAlign: 'center' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px', textTransform: 'capitalize' }}>{activeSection} Management</h3>
                            <p style={{ color: '#737373', fontSize: '14px' }}>Manage {activeSection} from this panel. Connected to backend API.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
