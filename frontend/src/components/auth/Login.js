import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { loginUser } from '../../App/store/authSlice';
import LanguageSwitcher from '../common/LanguageSwitcher';
import './Auth.css';

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isLoading } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await dispatch(loginUser(formData)).unwrap();
            toast.success(t("Login successful!"));
            navigate('/notes');
        } catch (error) {
            toast.error(error || t("Login failed"));
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
                    <h2 className="auth-title">{t("Login")}</h2>
                    <p className="auth-subtitle">{t("Welcome back to your premium workspace.")}</p>

                    <form onSubmit={handleSubmit} className="auth-form">
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
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">{t("Password")}</label>
                            <div className="input-wrapper">
                                <i className="bi bi-lock input-icon-left"></i>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    placeholder={t("Enter your password")}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
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
                        </div>

                        <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                            {isLoading ? t("Logging in...") : t("Log In")}
                        </button>
                    </form>

                    <p className="auth-redirect">
                        {t("Don't have an account?")} <Link to="/signup">{t("Sign up here")}</Link>
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Login;
