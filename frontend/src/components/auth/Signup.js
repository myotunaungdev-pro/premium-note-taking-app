import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { signupUser, verifyOTP } from '../../App/store/authSlice';
import LanguageSwitcher from '../common/LanguageSwitcher';
import './Auth.css';

const Signup = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isLoading } = useSelector((state) => state.auth);
    
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({ name: '', email: '', password: '', otp: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setFormErrors({ ...formErrors, [e.target.name]: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let errors = { name: '', email: '', password: '', otp: '' };
        let isValid = true;

        if (!formData.name) {
            errors.name = 'empty';
            isValid = false;
        }
        if (!formData.email) {
            errors.email = 'empty';
            isValid = false;
        }
        if (!formData.password) {
            errors.password = 'empty';
            isValid = false;
        }

        setFormErrors(errors);
        if (!isValid) return;

        try {
            await dispatch(signupUser(formData)).unwrap();
            toast.success(t("OTP sent to your email. Please verify."));
            setStep(2);
        } catch (error) {
            toast.error(error || t("Signup failed"));
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();

        let errors = { ...formErrors, otp: '' };
        let isValid = true;

        if (!otp) {
            errors.otp = 'empty';
            isValid = false;
        } else if (otp.length !== 6) {
            errors.otp = 'length';
            isValid = false;
        }

        setFormErrors(errors);
        if (!isValid) return;

        try {
            await dispatch(verifyOTP({ email: formData.email, otp })).unwrap();
            toast.success(t("Email verified successfully!"));
            navigate('/notes');
        } catch (error) {
            toast.error(error || t("Verification failed"));
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
                            <h2 className="auth-title">{t("Sign Up")}</h2>
                            <p className="auth-subtitle">{t("Create your account to start capturing ideas.")}</p>

                            <form onSubmit={handleSubmit} className="auth-form" noValidate>
                                <div className="form-group">
                                    <label htmlFor="name">{t("Full Name")}</label>
                                    <div className="input-wrapper">
                                        <i className="bi bi-person input-icon-left"></i>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            placeholder={t("Enter your full name")}
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    {formErrors.name === 'empty' && <div className="validation-error">{t("Please enter your name.")}</div>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">{t("Email")}</label>
                                    <div className="input-wrapper">
                                        <i className="bi bi-envelope input-icon-left"></i>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder={t("Enter your email")}
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    {formErrors.email === 'empty' && <div className="validation-error">{t("Please enter your email.")}</div>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password">{t("Password")}</label>
                                    <div className="input-wrapper">
                                        <i className="bi bi-lock input-icon-left"></i>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            name="password"
                                            placeholder={t("Create a password")}
                                            value={formData.password}
                                            onChange={handleChange}
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
                                    {formErrors.password === 'empty' && <div className="validation-error">{t("Please enter a password.")}</div>}
                                </div>

                                <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                                    {isLoading ? t("Signing up...") : t("Sign Up")}
                                </button>
                            </form>

                            <p className="auth-redirect">
                                {t("Already have an account?")} <Link to="/login">{t("Login here")}</Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="auth-title">{t("Verify Email")}</h2>
                            <p className="auth-subtitle">{t("Enter the 6-digit code sent to ")} <strong>{formData.email}</strong></p>

                            <form onSubmit={handleVerify} className="auth-form" noValidate>
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

                                <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                                    {isLoading ? t("Verifying...") : t("Verify & Login")}
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

export default Signup;
