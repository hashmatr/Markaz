import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { otpAPI } from '../api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const startCooldown = () => {
        setResendCooldown(60);
        const interval = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    // Step 1: Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await otpAPI.generate({ email, type: 'password_reset' });
            toast.success('OTP sent to your email!');
            setStep(2);
            startCooldown();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally { setLoading(false); }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await otpAPI.verify({ email, otp, type: 'password_reset' });
            toast.success('OTP verified!');
            setStep(3);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally { setLoading(false); }
    };

    // Step 3: Reset password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
        if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            await otpAPI.resetPassword({ email, otp, newPassword, confirmPassword });
            toast.success('Password reset successfully!');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password');
        } finally { setLoading(false); }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        try {
            await otpAPI.resend({ email, type: 'password_reset' });
            toast.success('OTP resent!');
            startCooldown();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend OTP');
        }
    };

    const inputStyle = {
        width: '100%', backgroundColor: '#f0f0f0', borderRadius: '9999px',
        padding: '16px 16px 16px 48px', fontSize: '14px', outline: 'none', border: '2px solid transparent',
    };
    const iconStyle = {
        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3',
    };

    return (
        <div style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>
            <div style={{ width: '100%', maxWidth: '440px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
                        {step === 1 && 'FORGOT PASSWORD'}
                        {step === 2 && 'VERIFY OTP'}
                        {step === 3 && 'NEW PASSWORD'}
                    </h1>
                    <p style={{ color: '#737373', fontSize: '14px', maxWidth: '320px', margin: '0 auto' }}>
                        {step === 1 && 'Enter your email address and we\'ll send you an OTP to reset your password.'}
                        {step === 2 && `We've sent a 6-digit OTP to ${email}. Enter it below to verify.`}
                        {step === 3 && 'Create your new password. Make sure it\'s strong and secure.'}
                    </p>
                </div>

                {/* Progress indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
                    {[1, 2, 3].map(s => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600,
                                backgroundColor: step >= s ? '#000' : '#f0f0f0',
                                color: step >= s ? '#fff' : '#a3a3a3',
                                transition: 'all 0.3s',
                            }}>
                                {step > s ? <FiCheck size={14} /> : s}
                            </div>
                            {s < 3 && <div style={{ width: '40px', height: '2px', backgroundColor: step > s ? '#000' : '#e5e5e5', transition: 'all 0.3s' }} />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Email */}
                {step === 1 && (
                    <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ position: 'relative' }}>
                            <FiMail size={18} style={iconStyle} />
                            <input type="email" placeholder="Email address" required value={email}
                                onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            {Array.from({ length: 6 }, (_, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    maxLength="1"
                                    value={otp[i] || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        const newOtp = otp.split('');
                                        newOtp[i] = val;
                                        setOtp(newOtp.join(''));
                                        // Auto-focus next input
                                        if (val && e.target.nextElementSibling) e.target.nextElementSibling.focus();
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Backspace' && !otp[i] && e.target.previousElementSibling) {
                                            e.target.previousElementSibling.focus();
                                        }
                                    }}
                                    style={{
                                        width: '48px', height: '56px', textAlign: 'center', fontSize: '22px', fontWeight: 700,
                                        borderRadius: '12px', border: '2px solid #e5e5e5', outline: 'none',
                                        backgroundColor: otp[i] ? '#f0f0f0' : '#fff', transition: 'all 0.15s',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#000'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                                />
                            ))}
                        </div>
                        <button type="submit" disabled={loading || otp.length < 6} className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <div style={{ textAlign: 'center', fontSize: '13px', color: '#737373' }}>
                            Didn't receive the code?{' '}
                            <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
                                style={{ background: 'none', border: 'none', fontWeight: 600, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', color: resendCooldown > 0 ? '#a3a3a3' : '#000', textDecoration: 'underline' }}>
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ position: 'relative' }}>
                            <FiLock size={18} style={iconStyle} />
                            <input type={showPass ? 'text' : 'password'} placeholder="New Password" required value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)} style={{ ...inputStyle, paddingRight: '48px' }} />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3' }}>
                                {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <FiLock size={18} style={iconStyle} />
                            <input type={showPass ? 'text' : 'password'} placeholder="Confirm Password" required value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} />
                        </div>
                        {/* Password strength hint */}
                        <div style={{ fontSize: '12px', color: '#a3a3a3', paddingLeft: '4px' }}>
                            Password must contain at least one uppercase, one lowercase, and one number.
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                {/* Back link */}
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    {step === 1 ? (
                        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#737373' }}>
                            <FiArrowLeft size={14} /> Back to Sign In
                        </Link>
                    ) : (
                        <button onClick={() => setStep(step - 1)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#737373', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <FiArrowLeft size={14} /> Back
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
