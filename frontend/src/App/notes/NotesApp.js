'use client';

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';
import NoteCard from './NoteCard';
import NoteModal from './NoteModal';
import { setSidebarCollapsed, toggleCategoryFilter, selectAllNotes } from '../store/notesSlice';
import { fetchNotes, permanentlyDeleteFromServer } from '../store/notesThunks';
import { tagOptions } from './NoteModal';
import { useTranslation } from 'react-i18next';
import './NotesApp.css';

const NotesApp = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [noteToDelete, setNoteToDelete] = useState(null);

    const confirmPermanentDelete = () => {
        if (noteToDelete) {
            dispatch(permanentlyDeleteFromServer(noteToDelete._id));
            setNoteToDelete(null);
        }
    };

    useEffect(() => {
        dispatch(fetchNotes());
    }, [dispatch]);

    const { notes, activeView, searchQuery, sortBy, sidebarCollapsed, categoryFilter } = useSelector(
        (state) => state.notes
    );

    // Strict memoization to prevent infinite render loops caused by the empty array reference
    const safeCategoryFilter = useMemo(() => Array.isArray(categoryFilter) ? categoryFilter : [], [categoryFilter]);

    const filteredAndSortedNotes = useMemo(() => {
        let filtered = notes;

        switch (activeView) {
            case 'archive':
                filtered = filtered.filter((n) => n.isArchived && !n.isDeleted);
                break;
            case 'trash':
                filtered = filtered.filter((n) => n.isDeleted);
                break;
            default:
                filtered = filtered.filter((n) => !n.isArchived && !n.isDeleted);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (note) =>
                    note.title.toLowerCase().includes(query) ||
                    note.content.toLowerCase().includes(query) ||
                    note.tag.toLowerCase().includes(query)
            );
        }

        if (safeCategoryFilter.length > 0) {
            filtered = filtered.filter((note) => safeCategoryFilter.includes(note.tag));
        }

        const sorted = [...filtered];
        switch (sortBy) {
            case 'a-z':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'done':
                sorted.sort((a, b) => (a.isDone === b.isDone ? 0 : a.isDone ? -1 : 1));
                break;
            case 'not-done':
                sorted.sort((a, b) => (a.isDone === b.isDone ? 0 : a.isDone ? 1 : -1));
                break;
            default:
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return sorted;
    }, [notes, activeView, searchQuery, sortBy, safeCategoryFilter]);

    const getEmptyMessage = () => {
        if (searchQuery) {
            return {
                icon: 'bi-search',
                title: t('No results found'),
                text: t('Try adjusting your search terms'),
            };
        }

        switch (activeView) {
            case 'archive':
                return { icon: 'bi-archive', title: t('Archive is empty'), text: t('Archived notes will appear here') };
            case 'trash':
                return { icon: 'bi-trash3', title: t('Trash is empty'), text: t('Deleted notes will appear here') };
            default:
                return {
                    icon: 'bi-journal-plus',
                    title: t('No notes yet'),
                    text: t('Create your first note to get started'),
                };
        }
    };

    const emptyState = getEmptyMessage();
    const isSidebarOpen = !sidebarCollapsed;

    const closeSidebar = useCallback(() => {
        dispatch(setSidebarCollapsed(true));
    }, [dispatch]);

    const visibleNotes = useMemo(() => {
        return notes.filter(note => {
            if (activeView === 'archive') return note.isArchived && !note.isDeleted;
            if (activeView === 'trash') return note.isDeleted;
            return !note.isArchived && !note.isDeleted;
        });
    }, [notes, activeView]);

    // Ctrl + A shortcut (Event Listener)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {

                const targetTag = document.activeElement.tagName;
                if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || document.activeElement.isContentEditable) {
                    return;
                }

                e.preventDefault();

                const allVisibleIds = visibleNotes.map((note) => note._id);

                dispatch(selectAllNotes(allVisibleIds));
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [visibleNotes, dispatch]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && !sidebarCollapsed) {
                closeSidebar();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [sidebarCollapsed, closeSidebar]);

    return (
        <div className={`notes-app ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            {isSidebarOpen && (
                <div 
                    className="sidebar-mobile-overlay" 
                    onClick={closeSidebar}
                ></div>
            )}
            <Sidebar />

            <main 
                className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}
            >
                <Header onSelectAll={() => dispatch(selectAllNotes(filteredAndSortedNotes.map(n => n._id)))} />

                <div className="category-chips-wrapper">
                    <div className="category-chips-scroll">
                        <button
                            className={`category-chip ${safeCategoryFilter.length === 0 ? 'active' : ''}`}
                            onClick={() => dispatch(toggleCategoryFilter('All'))}
                        >
                            {t('All')}
                        </button>
                        {tagOptions.map((tag) => {
                            const isActive = safeCategoryFilter.includes(tag.label);
                            return (
                                <button
                                    key={tag.label}
                                    className={`category-chip ${isActive ? 'active' : ''}`}
                                    style={{
                                        '--chip-color': tag.color,
                                    }}
                                    onClick={() => dispatch(toggleCategoryFilter(tag.label))}
                                >
                                    {t(tag.label)}
                                    {isActive && <i className="bi bi-x chip-close-icon"></i>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="notes-container">
                    {filteredAndSortedNotes.length > 0 ? (
                        <div className="notes-grid">
                            {filteredAndSortedNotes.map((note) => (
                                <NoteCard key={note._id} note={note} onDeleteRequest={(note) => setNoteToDelete(note)} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <i className={`bi ${emptyState.icon}`}></i>
                            </div>
                            <h3 className="empty-title">{emptyState.title}</h3>
                            <p className="empty-text">{emptyState.text}</p>
                        </div>
                    )}
                </div>
            </main>

            <NoteModal />

            {noteToDelete && (
                <div className="custom-modal-overlay" onClick={() => setNoteToDelete(null)}>
                    <div className="custom-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="custom-modal-header">
                            <div className="custom-modal-icon warning">
                                <i className="bi bi-exclamation-triangle"></i>
                            </div>
                            <h2>{t("Permanently Delete Note")}</h2>
                        </div>
                        <div className="custom-modal-body">
                            <p>{t("Are you sure you want to permanently delete this note? This action cannot be undone.")}</p>
                        </div>
                        <div className="custom-modal-footer">
                            <button className="custom-btn cancel-btn" onClick={() => setNoteToDelete(null)}>
                                {t("Cancel")}
                            </button>
                            <button className="custom-btn danger-btn" onClick={confirmPermanentDelete}>
                                {t("Delete Permanently")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesApp;