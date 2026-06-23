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

    const groupedNotes = useMemo(() => {
        // Only group if we are sorting by date (the default sort)
        const isDateSorted = !['a-z', 'done', 'not-done'].includes(sortBy);
        if (!isDateSorted) return null;

        const groups = {
            'Today': [],
            'Previous 7 Days': [],
            'Previous 30 Days': [],
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        filteredAndSortedNotes.forEach((note) => {
            const noteDate = new Date(note.createdAt);
            const noteDay = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate());

            if (noteDay.getTime() === today.getTime()) {
                groups['Today'].push(note);
            } else if (noteDay >= sevenDaysAgo) {
                groups['Previous 7 Days'].push(note);
            } else if (noteDay >= thirtyDaysAgo) {
                groups['Previous 30 Days'].push(note);
            } else {
                const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(noteDate);
                if (!groups[monthYear]) {
                    groups[monthYear] = [];
                }
                groups[monthYear].push(note);
            }
        });

        // Filter out empty groups
        const result = {};
        Object.keys(groups).forEach(key => {
            if (groups[key].length > 0) {
                result[key] = groups[key];
            }
        });
        return result;
    }, [filteredAndSortedNotes, sortBy]);

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
                        groupedNotes ? (
                            <div className="notes-grouped-container">
                                {Object.keys(groupedNotes).map((groupKey) => (
                                    <div className="note-group" key={groupKey}>
                                        <h3 className="note-group-header">{t(groupKey)}</h3>
                                        <div className="notes-grid">
                                            {groupedNotes[groupKey].map((note) => (
                                                <NoteCard key={note._id} note={note} onDeleteRequest={(note) => setNoteToDelete(note)} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="notes-grid">
                                {filteredAndSortedNotes.map((note) => (
                                    <NoteCard key={note._id} note={note} onDeleteRequest={(note) => setNoteToDelete(note)} />
                                ))}
                            </div>
                        )
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
                <div className="logout-modal-overlay" onClick={() => setNoteToDelete(null)}>
                    <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="logout-modal-icon">
                            <i className="bi bi-exclamation-triangle"></i>
                        </div>
                        <h3>{t("Permanently Delete Note")}</h3>
                        <p>{t("Are you sure you want to permanently delete this note? This action cannot be undone.")}</p>
                        <div className="logout-modal-actions">
                            <button className="btn-modal-cancel" onClick={() => setNoteToDelete(null)}>
                                {t("Cancel")}
                            </button>
                            <button className="btn-modal-confirm" onClick={confirmPermanentDelete}>
                                {t("Delete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesApp;