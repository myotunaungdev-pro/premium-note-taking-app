'use client';

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveView, toggleSidebar, setSidebarCollapsed } from '../store/notesSlice';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';

const MOBILE_BREAKPOINT = 768;

const Sidebar = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { activeView, sidebarCollapsed, notes } = useSelector((state) => state.notes);
    const { user } = useSelector((state) => state.auth);
    const [isMobile, setIsMobile] = useState(false);

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

    // When click menu item run function
    const handleNavItemClick = (id) => {
        dispatch(setActiveView(id)); // Change first view

        if (isMobile) {
            dispatch(setSidebarCollapsed(true));
        }
    };

    return (
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <i className="bi bi-lightning-charge-fill"></i>
                        </div>
                        {!sidebarCollapsed && <span className="logo-text">{t('My Notes')}</span>}
                    </div>
                    <button className="toggle-btn" onClick={() => dispatch(toggleSidebar())}>
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
                                            <span className="nav-count">{item.count}</span>
                                        </>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile clickable" onClick={() => navigate('/settings')}>
                        <div className={`avatar ${user?.avatarUrl ? '' : 'initials-avatar'}`}>
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
        </aside>
    );
};

export default Sidebar;