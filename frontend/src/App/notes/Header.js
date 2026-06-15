'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    setSearchQuery,
    setSortBy,
    setModalOpen,
    setEditingNote,
    toggleSidebar,
    clearSelection,
} from '../store/notesSlice';
import { bulkArchiveOnServer, bulkTrashOnServer, bulkRestoreOnServer } from '../store/notesThunks';
import './Header.css';
import { useTranslation } from 'react-i18next';

const Header = ({ onSelectAll }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const { searchQuery, sortBy, activeView } = useSelector((state) => state.notes);

    const selectedNoteIds = useSelector(state => state.notes.selectedNoteIds);

    const isSelectionMode = selectedNoteIds.length > 0;

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const filterDropdownRef = useRef(null);

    useEffect(() => {
        const handleScroll = (event) => {
            const scrollTop = event.target.scrollTop || window.scrollY;

            if (scrollTop > 20) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll, true);

        return () => window.removeEventListener('scroll', handleScroll, true);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
        };

        if (isFilterOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFilterOpen]);

    const handleSortSelect = (value) => {
        dispatch(setSortBy(value));
        setIsFilterOpen(false);
    };

    const handleNewNote = () => {
        dispatch(setEditingNote(null));
        dispatch(setModalOpen(true));
    };

    const getViewTitle = () => {
        switch (activeView) {
            case 'archive':
                return t('Archived');
            case 'trash':
                return t('Trash');
            default:
                return t('All Notes');
        }
    };

    if (isSelectionMode) {
        return (
            <header 
                className="app-header selection-mode"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <div className="header-left">
                    <button className="clear-selection-btn" onClick={() => dispatch(clearSelection())}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                    <span className="selection-count">{selectedNoteIds.length} {t('selected')}</span>
                </div>

                <div className="header-right selection-actions">
                    {(activeView === 'archive' || activeView === 'trash') && (
                        <button
                            className="action-btn restore-btn"
                            onClick={() => dispatch(bulkRestoreOnServer(selectedNoteIds))}
                            title={t("Restore to All Notes")}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 7v6h6" />
                                <path d="M21 17a9 9 0 0 0-9-15 9 9 0 0 0-6 2.3L3 13" />
                            </svg>
                        </button>
                    )}

                    <button className="action-btn archive-btn" onClick={() => dispatch(bulkArchiveOnServer(selectedNoteIds))}>
                        <i className="bi bi-archive"></i>
                    </button>

                    <button className="action-btn trash-btn" onClick={() => dispatch(bulkTrashOnServer(selectedNoteIds))}>
                        <i className="bi bi-trash"></i>
                    </button>
                </div>
            </header>
        );
    };

    return (
        <header
            className={`app-header ${isScrolled ? 'scrolled' : ''}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <div className="header-left">
                <button className="mobile-menu-btn" onClick={() => dispatch(toggleSidebar())}>
                    <i className="bi bi-list"></i>
                </button>

                <h1 className="page-title">{getViewTitle()}</h1>
            </div>

            <div className="header-center">
                <div className="search-container">
                    <i className="bi bi-search search-icon"></i>
                    <input
                        type="text"
                        className="search-input"
                        placeholder={t("Search notes...")}
                        value={searchQuery}
                        onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={() => dispatch(setSearchQuery(''))}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                    )}
                </div>
            </div>

            <div className="header-right">
                <button 
                    className="action-btn" 
                    onClick={onSelectAll}
                    title={t("Select All")}
                    style={{ marginRight: '8px' }}
                >
                    <i className="bi bi-check2-all"></i>
                </button>
                <div
                    className={`dropdown ${isFilterOpen ? 'show' : ''}`}
                    ref={filterDropdownRef}
                >
                    <button
                        className={`sort-dropdown dropdown-toggle ${isFilterOpen ? 'show' : ''}`}
                        type="button"
                        aria-expanded={isFilterOpen}
                        onClick={() => setIsFilterOpen((open) => !open)}
                    >
                        <i className="bi bi-funnel"></i>
                        <span>
                            {sortBy === 'latest' && t('Latest')}
                            {sortBy === 'a-z' && t('A-Z')}
                            {sortBy === 'done' && t('Done')}
                            {sortBy === 'not-done' && t('Not Done')}
                        </span>
                    </button>
                    <ul className={`dropdown-menu dropdown-menu-dark ${isFilterOpen ? 'show' : ''}`}>
                        <li>
                            <button
                                type="button"
                                className={`dropdown-item ${sortBy === 'latest' ? 'active' : ''}`}
                                onClick={() => handleSortSelect('latest')}
                            >
                                <i className="bi bi-clock"></i> {t('Latest First')}
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                className={`dropdown-item ${sortBy === 'a-z' ? 'active' : ''}`}
                                onClick={() => handleSortSelect('a-z')}
                            >
                                <i className="bi bi-sort-alpha-down"></i> {t('A-Z')}
                            </button>
                        </li>
                        <li>
                            <hr className="dropdown-divider" />
                        </li>
                        <li>
                            <button
                                type="button"
                                className={`dropdown-item ${sortBy === 'done' ? 'active' : ''}`}
                                onClick={() => handleSortSelect('done')}
                            >
                                <i className="bi bi-check-circle"></i> {t('Done')}
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                className={`dropdown-item ${sortBy === 'not-done' ? 'active' : ''}`}
                                onClick={() => handleSortSelect('not-done')}
                            >
                                <i className="bi bi-circle"></i> {t('Not Done')}
                            </button>
                        </li>
                    </ul>
                </div>

                {activeView === 'all' && (
                    <button className="new-note-btn" onClick={handleNewNote}>
                        <i className="bi bi-plus-lg"></i>
                        <span>{t('New Note')}</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;