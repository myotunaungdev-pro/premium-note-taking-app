import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './HelpGuide.css';

const HelpGuide = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('getting_started');

    const tabs = [
        { id: 'getting_started', label: t("help.gettingStarted"), icon: 'bi-rocket' },
        { id: 'pro_features', label: t("help.proFeatures"), icon: 'bi-star' },
        { id: 'shortcuts', label: t("help.essentialShortcuts"), icon: 'bi-keyboard' },
        { id: 'settings_language', label: t("help.settingsLanguage"), icon: 'bi-gear' }
    ];

    return (
        <div className="help-guide-page">
            <div className="help-guide-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left"></i>
                    <span>{t("help.back")}</span>
                </button>
                <h2>{t("help.helpGuide")}</h2>
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
                            <h3><i className="bi bi-rocket-takeoff text-primary"></i> {t("help.gettingStarted")}</h3>
                            <ul className="help-list">
                                <li><strong>{t("help.creatingNotes")}</strong>: {t("help.clickTheNewNoteButto")}</li>
                                <li><strong>{t("help.usingTags")}</strong>: {t("help.organizeYourWorkflow")}</li>
                                <li><strong>{t("help.richText")}</strong>: {t("help.selectAnyTextWhileEd")}</li>
                                <li><strong>{t("help.doodleMode")}</strong>: {t("help.expressYourselfVisua")}</li>
                                <li><strong>{t("help.highQualityImages")}</strong>: {t("help.allYourUploadedImage")}</li>
                                <li><strong>{t("help.imageTextRecognition")}</strong>: {t("help.extractTextFromYourU")}</li>
                            </ul>
                        </div>
                    )}
                    {activeTab === 'pro_features' && (
                        <div className="help-section fade-in">
                            <h3><i className="bi bi-star-fill text-warning"></i> {t("help.proFeatures")}</h3>
                            <div className="mt-3">
                                <h5>{t("help.comingSoonTitle")}</h5>
                                <p className="help-text">{t("help.comingSoonDesc")}</p>
                            </div>
                        </div>
                    )}
                    {activeTab === 'shortcuts' && (
                        <div className="help-section fade-in">
                            <h3><i className="bi bi-keyboard text-success"></i> {t("help.essentialShortcuts")}</h3>
                            <p className="help-text">
                                {t("help.masterYourWorkflowWi")} 
                                <strong>{t("help.completeList")}</strong> 
                                {t("help.OfAllAvailableShortc")}
                            </p>
                            <div className="shortcut-highlight">
                                <kbd>?</kbd> {t("help.or")} <kbd>Ctrl</kbd> + <kbd>/</kbd>
                            </div>
                            <ul className="help-list mt-3">
                                <li><strong>{t("notes.sidebar.newNote")}</strong>: <kbd>Ctrl</kbd> + <kbd>N</kbd></li>
                                <li><strong>{t("help.saveNote")}</strong>: <kbd>Ctrl</kbd> + <kbd>Enter</kbd></li>
                                <li><strong>{t("help.toggleSidebar")}</strong>: <kbd>Ctrl</kbd> + <kbd>\</kbd></li>
                            </ul>
                        </div>
                    )}
                    {activeTab === 'settings_language' && (
                        <div className="help-section fade-in">
                            <h3><i className="bi bi-globe text-info"></i> {t("help.settingsLanguage")}</h3>
                            <ul className="help-list">
                                <li><strong>{t("help.profileCustomization")}</strong>: {t("help.headOverToTheSetting")}</li>
                                <li><strong>{t("help.multiLanguageSupport")}</strong>: {t("help.ourAppSupportsMultip")}</li>
                                <li><strong>{t("help.themePreferences")}</strong>: {t("help.switchBetweenOurPrem")}</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelpGuide;
