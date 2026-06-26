import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './HelpGuide.css';

const HelpGuide = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('getting_started');

    const tabs = [
        { id: 'getting_started', label: t('Getting Started'), icon: 'bi-rocket' },
        { id: 'pro_features', label: t('Pro Features'), icon: 'bi-star' },
        { id: 'shortcuts', label: t('Essential Shortcuts'), icon: 'bi-keyboard' },
        { id: 'settings_language', label: t('Settings & Language'), icon: 'bi-gear' }
    ];

    return (
        <div className="help-guide-page">
            <div className="help-guide-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left"></i>
                    <span>{t('Back')}</span>
                </button>
                <h2>{t('Help & Guide')}</h2>
            </div>
            <div className="help-guide-content-wrapper">
                <div className="help-guide-sidebar">
                    <ul className="help-tabs">
                        {tabs.map(tab => (
                            <li 
                                key={tab.id} 
                                className={`help-tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <i className={`bi ${tab.icon}`}></i>
                                {tab.label}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="help-guide-main">
                    {activeTab === 'getting_started' && (
                        <div className="help-section fade-in">
                            <h3><i className="bi bi-rocket-takeoff text-primary"></i> {t('Getting Started')}</h3>
                            <ul className="help-list">
                                <li><strong>{t('Creating Notes')}</strong>: {t('Click the "New Note" button in the header or use the shortcut to instantly start capturing your thoughts.')}</li>
                                <li><strong>{t('Using Tags')}</strong>: {t('Organize your workflow efficiently by attaching color-coded tags to your notes. Filter by tags in the main view.')}</li>
                                <li><strong>{t('Rich Text')}</strong>: {t('Select any text while editing to apply bold, italic, or code styling.')}</li>
                            </ul>
                        </div>
                    )}
                    {activeTab === 'pro_features' && (
                        <div className="help-section fade-in">
                            <h3><i className="bi bi-star-fill text-warning"></i> {t('Pro Features')}</h3>
                            <ul className="help-list">
                                <li><strong>{t('Doodle Mode')}</strong>: {t('Express yourself visually! Click the palette icon inside any note to open the drawing canvas. Use pens, highlighters, and erasers.')}</li>
                                <li><strong>{t('High Quality Images')}</strong>: {t('All your uploaded images and doodles are powered by Cloudinary, ensuring lightning-fast delivery and pristine quality.')}</li>
                                <li><strong>{t('Image Text Recognition')}</strong>: {t('Extract text from your uploaded images instantly (Coming Soon!).')}</li>
                            </ul>
                        </div>
                    )}
                    {activeTab === 'shortcuts' && (
                        <div className="help-section fade-in">
                            <h3><i className="bi bi-keyboard text-success"></i> {t('Essential Shortcuts')}</h3>
                            <p className="help-text">
                                {t('Master your workflow with these essential commands. To see the ')} 
                                <strong>{t('complete list')}</strong> 
                                {t(' of all available shortcuts at any time, open the full Cheat Sheet by pressing:')}
                            </p>
                            <div className="shortcut-highlight">
                                <kbd>?</kbd> {t('or')} <kbd>Ctrl</kbd> + <kbd>/</kbd>
                            </div>
                            <ul className="help-list mt-3">
                                <li><strong>{t('New Note')}</strong>: <kbd>Ctrl</kbd> + <kbd>N</kbd></li>
                                <li><strong>{t('Save Note')}</strong>: <kbd>Ctrl</kbd> + <kbd>Enter</kbd></li>
                                <li><strong>{t('Toggle Sidebar')}</strong>: <kbd>Ctrl</kbd> + <kbd>\</kbd></li>
                            </ul>
                        </div>
                    )}
                    {activeTab === 'settings_language' && (
                        <div className="help-section fade-in">
                            <h3><i className="bi bi-globe text-info"></i> {t('Settings & Language')}</h3>
                            <ul className="help-list">
                                <li><strong>{t('Profile Customization')}</strong>: {t('Head over to the Settings page to update your avatar, name, and personal details.')}</li>
                                <li><strong>{t('Multi-Language Support')}</strong>: {t('Our app supports multiple languages perfectly via i18next. Toggle between them effortlessly using the globe icon in the navigation.')}</li>
                                <li><strong>{t('Theme Preferences')}</strong>: {t('Switch between our premium dark mode and light mode directly from the header.')}</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelpGuide;
