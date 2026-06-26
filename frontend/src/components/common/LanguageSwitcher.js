import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const changeLang = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('appLanguage', lang);
        setIsOpen(false);
    };

    return (
        <div className={`lang-dropdown-wrapper ${isOpen ? 'show' : ''}`} ref={dropdownRef}>
            <button
                className={`lang-dropdown-toggle ${isOpen ? 'show' : ''}`}
                type="button"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
            >
                <i className="bi bi-globe"></i>
                <span>{i18n.language?.toUpperCase() || 'EN'}</span>
            </button>
            <ul className={`lang-dropdown-menu ${isOpen ? 'show' : ''}`}>
                <li>
                    <button
                        type="button"
                        className={`lang-dropdown-item ${i18n.language === 'en' ? 'active' : ''}`}
                        onClick={() => changeLang('en')}
                    >
                        English
                    </button>
                </li>
                <li>
                    <button
                        type="button"
                        className={`lang-dropdown-item ${i18n.language === 'my' ? 'active' : ''}`}
                        onClick={() => changeLang('my')}
                    >
                        မြန်မာ
                    </button>
                </li>
                <li>
                    <button
                        type="button"
                        className={`lang-dropdown-item ${i18n.language === 'th' ? 'active' : ''}`}
                        onClick={() => changeLang('th')}
                    >
                        ไทย
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default LanguageSwitcher;
