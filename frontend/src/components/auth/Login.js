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
    const [formErrors, setFormErrors] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setFormErrors({ ...formErrors, [e.target.name]: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let errors = { email: '', password: '' };
        let isValid = true;

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
            await dispatch(loginUser(formData)).unwrap();
            toast.success(t("auth.login.success"));
            navigate('/notes');
        } catch (error) {
            toast.error(t(error || "Login failed"));
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
                    <Link to="/" className="back-link">
                        <i className="bi bi-arrow-left"></i> {t("common.backToHome")}
                    </Link>
                    <h2 className="auth-title">{t("auth.login.title")}</h2>
                    <p className="auth-subtitle">{t("auth.login.subtitle")}</p>

                    <form onSubmit={handleSubmit} className="auth-form" noValidate>
                        <div className="form-group">
                            <label htmlFor="email">{t("auth.common.email")}</label>
                            <div className="input-wrapper">
                                <i className="bi bi-envelope input-icon-left"></i>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder={t("auth.common.emailPlaceholder")}
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            {formErrors.email === 'empty' && <div className="validation-error">{t("auth.common.emailRequired")}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">{t("auth.common.password")}</label>
                            <div className="input-wrapper">
                                <i className="bi bi-lock input-icon-left"></i>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    placeholder={t("auth.common.passwordPlaceholder")}
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button 
                                    type="button" 
                                    className="btn-toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                </button>
                            </div>
                            {formErrors.password === 'empty' && <div className="validation-error">{t("auth.common.passwordRequired")}</div>}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', marginTop: '-10px' }}>
                            <Link to="/forgot-password" style={{ color: '#00d4aa', fontSize: '13px', textDecoration: 'none' }}>
                                {t("auth.login.forgotPassword")}
                            </Link>
                        </div>

                        <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                            {isLoading ? t("auth.login.loading") : t("auth.login.submit")}
                        </button>
                    </form>

                    <p className="auth-redirect">
                        {t("auth.login.noAccount")} <Link to="/signup">{t("auth.login.signUpLink")}</Link>
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Login;
