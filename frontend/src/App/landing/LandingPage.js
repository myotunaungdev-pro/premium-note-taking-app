import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import './LandingPage.css';

const LandingPage = () => {
    const { t } = useTranslation();
    const [isLightMode, setIsLightMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            setIsLightMode(true);
            document.body.classList.add('light-theme');
        }
    }, []);

    const toggleTheme = () => {
        setIsLightMode(!isLightMode);
        if (!isLightMode) {
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach((el) => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="logo">
                    <i className="bi bi-journal-richtext"></i>
                    <span>PremiumNotes</span>
                </div>
                <div className="nav-actions">
                    <LanguageSwitcher />
                    <button className="btn-theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
                        <i className={`bi ${isLightMode ? 'bi-moon-stars' : 'bi-sun'}`}></i>
                    </button>
                    <Link to="/login" className="btn-login">{t("Log In")}</Link>
                </div>
            </nav>

            <main className="landing-main">
                {/* Hero Section */}
                <section className="hero-section">
                    <div className="hero-content">
                        <h1 className="hero-title">{t("Capture Your Best Ideas")}</h1>
                        <p className="hero-subtitle">
                            {t("A premium, fully localized note-taking experience designed for productivity. Seamlessly organize your thoughts with multi-language support and a gorgeous dark theme.")}
                        </p>
                        <Link to="/login" className="btn-get-started">
                            {t("Get Started")}
                            <i className="bi bi-arrow-right-short"></i>
                        </Link>
                    </div>
                </section>

                {/* Zig-Zag Features Section */}
                <section className="features-section">
                    <div className="zigzag-row reveal fade-up">
                        <div className="zigzag-text">
                            <span className="zigzag-label">{t("Secure Cloud Sync")}</span>
                            <h2 className="zigzag-title">{t("Your notes, everywhere you go")}</h2>
                            <p className="zigzag-desc">
                                {t("Never lose an idea again. PremiumNotes instantly syncs across all your devices with military-grade encryption to keep your personal data completely private and secure.")}
                            </p>
                        </div>
                        <div className="zigzag-image reveal slide-right">
                            <div className="glass-placeholder">
                                <i className="bi bi-cloud-check"></i>
                            </div>
                        </div>
                    </div>

                    <div className="zigzag-row reverse reveal fade-up">
                        <div className="zigzag-text">
                            <span className="zigzag-label">{t("Rich Text Editing")}</span>
                            <h2 className="zigzag-title">{t("Format exactly how you think")}</h2>
                            <p className="zigzag-desc">
                                {t("Use our premium Quill editor to add beautiful formatting, lists, code blocks, and dynamic styling. Everything feels native and incredibly responsive.")}
                            </p>
                        </div>
                        <div className="zigzag-image reveal slide-left">
                            <div className="glass-placeholder">
                                <i className="bi bi-type-bold"></i>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="how-it-works">
                    <h2 className="section-title reveal fade-up">{t("How It Works")}</h2>
                    <div className="steps-grid">
                        <div className="step-card reveal fade-up" style={{ transitionDelay: '0.1s' }}>
                            <div className="step-number">1</div>
                            <h3 className="step-title">{t("Sign Up")}</h3>
                            <p className="step-desc">{t("Create your free Premium Workspace in less than a minute. No credit card required.")}</p>
                        </div>
                        <div className="step-card reveal fade-up" style={{ transitionDelay: '0.2s' }}>
                            <div className="step-number">2</div>
                            <h3 className="step-title">{t("Capture Ideas")}</h3>
                            <p className="step-desc">{t("Start typing your thoughts instantly into our gorgeous glassmorphic editor.")}</p>
                        </div>
                        <div className="step-card reveal fade-up" style={{ transitionDelay: '0.3s' }}>
                            <div className="step-number">3</div>
                            <h3 className="step-title">{t("Access Anywhere")}</h3>
                            <p className="step-desc">{t("Pick up exactly where you left off on your phone, tablet, or desktop browser.")}</p>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="testimonials-section">
                    <h2 className="section-title reveal fade-up">{t("Loved by creators worldwide")}</h2>
                    <div className="testimonials-grid">
                        <div className="testimonial-card reveal fade-up" style={{ transitionDelay: '0.1s' }}>
                            <i className="bi bi-quote testimonial-quote"></i>
                            <p className="testimonial-text">
                                "{t("PremiumNotes changed how I organize my thoughts completely. The multi-language support is unmatched for my international team.")}"
                            </p>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar">A</div>
                                <div className="author-info">
                                    <h4>{t("Alice Chen")}</h4>
                                    <p>{t("Product Designer")}</p>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial-card reveal fade-up" style={{ transitionDelay: '0.2s' }}>
                            <i className="bi bi-quote testimonial-quote"></i>
                            <p className="testimonial-text">
                                "{t("The dark mode aesthetic combined with the buttery smooth React UI makes writing a joy instead of a chore.")}"
                            </p>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar">M</div>
                                <div className="author-info">
                                    <h4>{t("Mark Sterling")}</h4>
                                    <p>{t("Software Engineer")}</p>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial-card reveal fade-up" style={{ transitionDelay: '0.3s' }}>
                            <i className="bi bi-quote testimonial-quote"></i>
                            <p className="testimonial-text">
                                "{t("I love how fast the search works. I can find any note from 2 years ago instantly. Highly recommend upgrading to Pro.")}"
                            </p>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar">S</div>
                                <div className="author-info">
                                    <h4>{t("Sarah Jenkins")}</h4>
                                    <p>{t("Content Strategist")}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="final-cta-section reveal fade-up">
                    <div className="final-cta-container">
                        <h2 className="final-cta-title">{t("Start Your Free Premium Workspace Today")}</h2>
                        <p className="final-cta-subtitle">{t("Join thousands of professionals capturing their best ideas securely in the cloud.")}</p>
                        <Link to="/signup" className="btn-get-started">
                            {t("Sign Up Now")}
                            <i className="bi bi-arrow-right-short"></i>
                        </Link>
                    </div>
                </section>
            </main>

            {/* Rich Footer */}
            <footer className="landing-footer">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <div className="logo">
                            <i className="bi bi-journal-richtext"></i>
                            <span>PremiumNotes</span>
                        </div>
                        <p className="footer-desc">
                            {t("A premium, fully localized note-taking experience designed for productivity.")}
                        </p>
                        <div className="social-links">
                            <a href="#twitter"><i className="bi bi-twitter-x"></i></a>
                            <a href="#github"><i className="bi bi-github"></i></a>
                            <a href="#linkedin"><i className="bi bi-linkedin"></i></a>
                        </div>
                    </div>
                    
                    <div className="footer-col">
                        <h4>{t("Product")}</h4>
                        <ul>
                            <li><a href="#features">{t("Features")}</a></li>
                            <li><a href="#pricing">{t("Pricing")}</a></li>
                            <li><a href="#integrations">{t("Integrations")}</a></li>
                            <li><a href="#changelog">{t("Changelog")}</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>{t("Resources")}</h4>
                        <ul>
                            <li><a href="#help">{t("Help Center")}</a></li>
                            <li><a href="#guides">{t("Guides")}</a></li>
                            <li><a href="#api">{t("API Docs")}</a></li>
                            <li><a href="#community">{t("Community")}</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>{t("Company")}</h4>
                        <ul>
                            <li><a href="#about">{t("About Us")}</a></li>
                            <li><a href="#careers">{t("Careers")}</a></li>
                            <li><a href="#blog">{t("Blog")}</a></li>
                            <li><a href="#contact">{t("Contact")}</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>{t("Legal")}</h4>
                        <ul>
                            <li><a href="#privacy">{t("Privacy Policy")}</a></li>
                            <li><a href="#terms">{t("Terms of Service")}</a></li>
                            <li><a href="#cookies">{t("Cookie Policy")}</a></li>
                        </ul>
                    </div>
                </div>
                
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} PremiumNotes. {t("All rights reserved.")}</p>
                    <div className="footer-locale">
                        {t("Built with precision.")}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
