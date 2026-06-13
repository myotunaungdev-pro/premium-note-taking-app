import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import './LandingPage.css';

const LandingPage = () => {
    const { t } = useTranslation();

    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="logo">
                    <i className="bi bi-journal-richtext"></i>
                    <span>PremiumNotes</span>
                </div>
                <div className="nav-actions">
                    <LanguageSwitcher />
                    <Link to="/login" className="btn-login">{t("Login")}</Link>
                </div>
            </nav>

            <main className="landing-main">
                <section className="hero-section">
                    <div className="hero-content">
                        <h1 className="hero-title">{t("Capture Your Best Ideas")}</h1>
                        <p className="hero-subtitle">
                            {t("A premium, fully localized note-taking experience designed for productivity.")} 
                            {t("Seamlessly organize your thoughts with multi-language support and a gorgeous dark theme.")}
                        </p>
                        <Link to="/login" className="btn-get-started">
                            {t("Get Started")}
                            <i className="bi bi-arrow-right-short"></i>
                        </Link>
                    </div>
                </section>

                <section className="features-section">
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <i className="bi bi-globe feature-icon"></i>
                            </div>
                            <h3 className="feature-title">{t("Multi-language Support")}</h3>
                            <p className="feature-text">
                                {t("Experience a fully localized interface. Instantly switch between English, Burmese, and Thai.")}
                            </p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <i className="bi bi-laptop feature-icon"></i>
                            </div>
                            <h3 className="feature-title">{t("Cross-device Responsive")}</h3>
                            <p className="feature-text">
                                {t("Access your notes flawlessly across mobile, tablet, and desktop devices with intelligent adaptive layouts.")}
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <i className="bi bi-moon-stars feature-icon"></i>
                            </div>
                            <h3 className="feature-title">{t("Premium Dark Theme")}</h3>
                            <p className="feature-text">
                                {t("Reduce eye strain and stay focused with our elegant glassmorphism dark mode aesthetic.")}
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <p>&copy; {new Date().getFullYear()} PremiumNotes. {t("All rights reserved.")}</p>
            </footer>
        </div>
    );
};

export default LandingPage;
