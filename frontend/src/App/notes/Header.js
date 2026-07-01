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
import { bulkArchiveOnServer, bulkTrashOnServer, bulkRestoreOnServer, permanentlyDeleteFromServer } from '../store/notesThunks';
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
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

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

    const handleTrashOrDelete = React.useCallback(() => {
        if (activeView === 'trash') {
            setIsConfirmDeleteOpen(true);
        } else {
            dispatch(bulkTrashOnServer(selectedNoteIds));
        }
    }, [activeView, dispatch, selectedNoteIds]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Delete' && selectedNoteIds.length > 0) {
                const activeTag = document.activeElement.tagName;
                if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement.isContentEditable) {
                    return;
                }
                e.preventDefault();
                handleTrashOrDelete();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNoteIds, handleTrashOrDelete]);

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
                return t("notes.header.archived");
            case 'trash':
                return t("notes.sidebar.trash");
            default:
                return t("notes.sidebar.allNotes");
        }
    };



    const confirmPermanentDelete = () => {
        selectedNoteIds.forEach(id => {
            dispatch(permanentlyDeleteFromServer(id));
        });
        dispatch(clearSelection());
        setIsConfirmDeleteOpen(false);
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
                    <span className="selection-count">{selectedNoteIds.length} {t("notes.header.selected")}</span>
                </div>

                <div className="header-right selection-actions">
                    {(activeView === 'archive' || activeView === 'trash') && (
                        <button
                            className="action-btn restore-btn"
                            onClick={() => dispatch(bulkRestoreOnServer(selectedNoteIds))}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 7v6h6" />
                                <path d="M21 17a9 9 0 0 0-9-15 9 9 0 0 0-6 2.3L3 13" />
                            </svg>
                        </button>
                    )}

                    {activeView !== 'archive' && (
                        <button className="action-btn archive-btn" onClick={() => dispatch(bulkArchiveOnServer(selectedNoteIds))}>
                            <i className="bi bi-archive"></i>
                        </button>
                    )}

                    <button 
                        className={`action-btn trash-btn ${activeView === 'trash' ? 'permanent-delete' : ''}`} 
                        onClick={handleTrashOrDelete}
                    >
                        {activeView === 'trash' ? (
                            <i className="bi bi-trash-fill" style={{ color: '#ef4444' }}></i>
                        ) : (
                            <i className="bi bi-trash"></i>
                        )}
                    </button>
                </div>

                {isConfirmDeleteOpen && (
                    <div className="logout-modal-overlay">
                        <div className="logout-modal">
                            <div className="logout-modal-icon">
                                <i className="bi bi-exclamation-triangle"></i>
                            </div>
                            <h3>{selectedNoteIds.length === 1 ? t("notes.header.deleteConfirmTitleSingle") : t("notes.header.deleteConfirmTitleMulti")}</h3>
                            <p>{selectedNoteIds.length === 1 ? t("notes.header.deleteConfirmDescSingle") : t("notes.header.deleteConfirmDescMulti")}</p>
                            <div className="logout-modal-actions">
                                <button className="btn-modal-cancel" onClick={() => setIsConfirmDeleteOpen(false)}>
                                    {t("common.cancel")}
                                </button>
                                <button className="btn-modal-confirm" onClick={confirmPermanentDelete} data-tooltip-id="global-tooltip" data-tooltip-content={t("common.confirmEnter")}>
                                    {t("common.delete")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
                <button className="mobile-menu-btn" onClick={() => dispatch(toggleSidebar())} data-tooltip-id="global-tooltip" data-tooltip-content={t("notes.toggleSidebarCtrl")}>
                    <i className="bi bi-list"></i>
                </button>

                <h1 className="page-title">{getViewTitle()}</h1>
            </div>

            <div className="header-center">
                <div className="search-container">
                    <i className="bi bi-search search-icon"></i>
                    <input
                        id="global-search-input"
                        type="text"
                        className="search-input"
                        placeholder={t("notes.sidebar.searchPlaceholder")}
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
                    className="select-all-btn" 
                    onClick={onSelectAll}
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("notes.selectAllVisibleCtrl")}
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
                            {sortBy === 'latest' && t("notes.sidebar.sortLatest")}
                            {sortBy === 'a-z' && t("notes.sidebar.sortAZ")}
                            {sortBy === 'done' && t("notes.card.done")}
                            {sortBy === 'not-done' && t("notes.card.notDone")}
                        </span>
                    </button>
                    <ul className={`dropdown-menu dropdown-menu-dark ${isFilterOpen ? 'show' : ''}`}>
                        <li>
                            <button
                                type="button"
                                className={`dropdown-item ${sortBy === 'latest' ? 'active' : ''}`}
                                onClick={() => handleSortSelect("notes.latest")}
                            >
                                <i className="bi bi-clock"></i> {t("notes.sidebar.sortLatestFirst")}
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                className={`dropdown-item ${sortBy === 'a-z' ? 'active' : ''}`}
                                onClick={() => handleSortSelect("notes.aZ")}
                            >
                                <i className="bi bi-sort-alpha-down"></i> {t("notes.sidebar.sortAZ")}
                            </button>
                        </li>
                        <li>
                            <hr className="dropdown-divider" />
                        </li>
                        <li>
                            <button
                                type="button"
                                className={`dropdown-item ${sortBy === 'done' ? 'active' : ''}`}
                                onClick={() => handleSortSelect("notes.done")}
                            >
                                <i className="bi bi-check-circle"></i> {t("notes.card.done")}
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                className={`dropdown-item ${sortBy === 'not-done' ? 'active' : ''}`}
                                onClick={() => handleSortSelect("notes.notDone")}
                            >
                                <i className="bi bi-circle"></i> {t("notes.card.notDone")}
                            </button>
                        </li>
                    </ul>
                </div>

                {activeView === 'all' && (
                    <button className="new-note-btn" onClick={handleNewNote} data-tooltip-id="global-tooltip" data-tooltip-content={t("notes.newNoteCtrlN")}>
                        <i className="bi bi-plus-lg"></i>
                        <span>{t("notes.sidebar.newNote")}</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;