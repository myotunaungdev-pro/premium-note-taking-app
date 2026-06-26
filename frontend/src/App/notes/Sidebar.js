'use client';

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveView, toggleSidebar, setSidebarCollapsed } from '../store/notesSlice';
import { useTranslation } from 'react-i18next';
import Lightbox from '../../components/common/Lightbox';
import './Sidebar.css';

const MOBILE_BREAKPOINT = 904;

const Sidebar = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { activeView, sidebarCollapsed, notes } = useSelector((state) => state.notes);
    const { user } = useSelector((state) => state.auth);
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [isResizing, setIsResizing] = useState(false);
    const [activeLightboxImage, setActiveLightboxImage] = useState(null);

    useEffect(() => {
        const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
        const updateIsMobile = () => setIsMobile(mediaQuery.matches);
        updateIsMobile();
        mediaQuery.addEventListener('change', updateIsMobile);
        return () => mediaQuery.removeEventListener('change', updateIsMobile);
    }, []);

    const allNotesCount = notes.filter((n) => !n.isArchived && !n.isDeleted).length;
    const archivedCount = notes.filter((n) => n.isArchived && !n.isDeleted).length;
    const trashedCount = notes.filter((n) => n.isDeleted).length;

    const menuItems = [
        { id: 'all', icon: 'bi-journal-text', label: t('All Notes'), count: allNotesCount },
        { id: 'archive', icon: 'bi-archive', label: t('Archive'), count: archivedCount },
        { id: 'trash', icon: 'bi-trash3', label: t('Trash'), count: trashedCount },
    ];

    const handleNavItemClick = (id) => {
        if (id === 'settings') {
            navigate('/system-settings');
            if (isMobile) {
                dispatch(setSidebarCollapsed(true));
            }
            return;
        }
        if (id === 'help') {
            navigate('/help');
            if (isMobile) {
                dispatch(setSidebarCollapsed(true));
            }
            return;
        }
        dispatch(setActiveView(id)); // Change first view

        if (isMobile) {
            dispatch(setSidebarCollapsed(true));
        }
    };

    const startResizing = (e) => {
        setIsResizing(true);
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            const newWidth = e.clientX;
            setSidebarWidth(Math.max(200, Math.min(newWidth, 500)));
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.classList.add('is-resizing');
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('is-resizing');
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('is-resizing');
        };
    }, [isResizing]);

    useEffect(() => {
        const appContainer = document.querySelector('.notes-app');
        if (appContainer) {
            appContainer.style.setProperty('--sidebar-width-expanded', `${sidebarWidth}px`);
        }
    }, [sidebarWidth]);

    return (
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${isResizing ? 'is-resizing' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <i className="bi bi-lightning-charge-fill"></i>
                        </div>
                        {!sidebarCollapsed && <span className="logo-text">{t('My Notes')}</span>}
                    </div>
                    <button className="toggle-btn" onClick={() => dispatch(toggleSidebar())} data-tooltip-id="global-tooltip" data-tooltip-content={t('Toggle Sidebar (Ctrl + \\)')}>
                        <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        {menuItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                                    onClick={() => handleNavItemClick(item.id)}
                                    
                                >
                                    <i className={`bi ${item.icon}`}></i>
                                    {!sidebarCollapsed && (
                                        <>
                                            <span className={`nav-label ${sidebarCollapsed ? 'hidden' : 'visible'}`}>
                                                {item.label}
                                            </span>
                                            <span className="nav-count">{item.count !== undefined ? item.count : ''}</span>
                                        </>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                    
                    <div style={{ marginTop: 'auto' }}>
                        <ul className="nav-list">
                            <li>
                                <button
                                    className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
                                    onClick={() => handleNavItemClick('settings')}
                                >
                                    <i className="bi bi-gear"></i>
                                    {!sidebarCollapsed && (
                                        <span className={`nav-label ${sidebarCollapsed ? 'hidden' : 'visible'}`}>
                                            {t('Settings')}
                                        </span>
                                    )}
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`nav-item ${activeView === 'help' ? 'active' : ''}`}
                                    onClick={() => handleNavItemClick('help')}
                                >
                                    <i className="bi bi-question-circle"></i>
                                    {!sidebarCollapsed && (
                                        <span className={`nav-label ${sidebarCollapsed ? 'hidden' : 'visible'}`}>
                                            {t('Help & Guide')}
                                        </span>
                                    )}
                                </button>
                            </li>
                        </ul>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile clickable" onClick={() => navigate('/settings')}>
                        <div 
                            className={`avatar ${user?.avatarUrl ? '' : 'initials-avatar'} ${user?.avatarUrl ? 'avatar-lightbox-trigger' : ''}`}
                            onClick={(e) => {
                                if (user?.avatarUrl) {
                                    e.stopPropagation();
                                    setActiveLightboxImage(user.avatarUrl);
                                }
                            }}
                            style={{ cursor: user?.avatarUrl ? 'pointer' : 'default' }}
                        >
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="avatar-image" />
                            ) : (
                                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                            )}
                        </div>
                        {!sidebarCollapsed && (
                            <div className="user-info">
                                <span className="user-name">{user?.name || 'User'}</span>
                                <span className="user-plan">{t('Free Plan')}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {!isMobile && !sidebarCollapsed && (
                    <div className="sidebar-resize-handle" onMouseDown={startResizing} />
                )}
                
                {activeLightboxImage && (
                    <Lightbox src={activeLightboxImage} onClose={() => setActiveLightboxImage(null)} />
                )}
        </aside>
    );
};

export default Sidebar;