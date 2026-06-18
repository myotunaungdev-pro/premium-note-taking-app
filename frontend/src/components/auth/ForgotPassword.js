import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { forgotPassword, resetPassword } from '../../App/store/authSlice';
import LanguageSwitcher from '../common/LanguageSwitcher';
import './Auth.css';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isLoading } = useSelector((state) => state.auth);
    
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({ email: '', otp: '', newPassword: '' });

    const handleRequestOTP = async (e) => {
        e.preventDefault();

        if (!email) {
            setFormErrors({ ...formErrors, email: 'empty' });
            return;
        }

        try {
            await dispatch(forgotPassword({ email })).unwrap();
            toast.success(t("Password reset OTP sent to your email."));
            setStep(2);
        } catch (error) {
            toast.error(error || t("Failed to send OTP"));
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        let errors = { otp: '', newPassword: '' };
        let isValid = true;

        if (!otp) {
            errors.otp = 'empty';
            isValid = false;
        } else if (otp.length !== 6) {
            errors.otp = 'length';
            isValid = false;
        }

        if (!newPassword) {
            errors.newPassword = 'empty';
            isValid = false;
        }

        setFormErrors(errors);

        if (!isValid) return;

        try {
            await dispatch(resetPassword({ email, otp, newPassword })).unwrap();
            toast.success(t("Password reset successfully! You can now log in."));
            navigate('/login');
        } catch (error) {
            toast.error(error || t("Failed to reset password"));
        }
    };

    return (
        <div className="auth-page">
            <nav className="auth-nav">
                <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
                    <i className="bi bi-journal-richtext"></i>
                    <span>PremiumNotes</span>
                </Link>
                <LanguageSwitcher />
            </nav>

            <main className="auth-main">
                <div className="auth-card">
                    {step === 1 ? (
                        <>
                            <h2 className="auth-title">{t("Forgot Password")}</h2>
                            <p className="auth-subtitle">{t("Enter your email address to receive a secure reset code.")}</p>

                            <form onSubmit={handleRequestOTP} className="auth-form" noValidate>
                                <div className="form-group">
                                    <label htmlFor="email">{t("Email")}</label>
                                    <div className="input-wrapper">
                                        <i className="bi bi-envelope input-icon-left"></i>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder={t("Enter your email")}
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setFormErrors({ ...formErrors, email: '' });
                                            }}
                                        />
                                    </div>
                                    {formErrors.email === 'empty' && <div className="validation-error">{t("Please enter your email address.")}</div>}
                                </div>

                                <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                                    {isLoading ? t("Sending...") : t("Send Reset Code")}
                                </button>
                            </form>

                            <p className="auth-redirect">
                                {t("Remember your password?")} <Link to="/login">{t("Log in here")}</Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="auth-title">{t("Reset Password")}</h2>
                            <p className="auth-subtitle">{t("Enter the 6-digit code sent to ")} <strong>{email}</strong> {t("along with your new password.")}</p>

                            <form onSubmit={handleResetPassword} className="auth-form" noValidate>
                                <div className="form-group">
                                    <label htmlFor="otp">{t("Verification Code")}</label>
                                    <div className="input-wrapper">
                                        <i className="bi bi-shield-check input-icon-left"></i>
                                        <input
                                            type="text"
                                            id="otp"
                                            name="otp"
                                            placeholder={t("123456")}
                                            maxLength="6"
                                            value={otp}
                                            onChange={(e) => {
                                                setOtp(e.target.value.replace(/\D/g, ''));
                                                setFormErrors({ ...formErrors, otp: '' });
                                            }}
                                            style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '20px' }}
                                        />
                                    </div>
                                    {formErrors.otp === 'empty' && <div className="validation-error">{t("Please enter the verification code.")}</div>}
                                    {formErrors.otp === 'length' && <div className="validation-error">{t("Verification code must be 6 digits.")}</div>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="newPassword">{t("New Password")}</label>
                                    <div className="input-wrapper">
                                        <i className="bi bi-lock input-icon-left"></i>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="newPassword"
                                            name="newPassword"
                                            placeholder={t("Enter new password")}
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                setFormErrors({ ...formErrors, newPassword: '' });
                                            }}
                                        />
                                        <button 
                                            type="button" 
                                            className="btn-toggle-password"
                                            onClick={() => setShowPassword(!showPassword)}
                                            title={showPassword ? t("Hide password") : t("Show password")}
                                        >
                                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                        </button>
                                    </div>
                                    {formErrors.newPassword === 'empty' && <div className="validation-error">{t("Please enter a new password.")}</div>}
                                </div>

                                <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                                    {isLoading ? t("Resetting...") : t("Reset Password")}
                                </button>
                            </form>
                            
                            <p className="auth-redirect" style={{ marginTop: '20px', cursor: 'pointer' }} onClick={() => setStep(1)}>
                                {t("Change Email Address")}
                            </p>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ForgotPassword;
