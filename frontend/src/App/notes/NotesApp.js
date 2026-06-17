'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';
import NoteCard from './NoteCard';
import NoteModal from './NoteModal';
import { setSidebarCollapsed, toggleCategoryFilter, selectAllNotes } from '../store/notesSlice';
import { fetchNotes } from '../store/notesThunks';
import { tagOptions } from './NoteModal';
import { useTranslation } from 'react-i18next';
import './NotesApp.css';

const NotesApp = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();

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
                title: 'No results found',
                text: 'Try adjusting your search terms',
            };
        }

        switch (activeView) {
            case 'archive':
                return { icon: 'bi-archive', title: 'Archive is empty', text: 'Archived notes will appear here' };
            case 'trash':
                return { icon: 'bi-trash3', title: 'Trash is empty', text: 'Deleted notes will appear here' };
            default:
                return {
                    icon: 'bi-journal-plus',
                    title: 'No notes yet',
                    text: 'Create your first note to get started',
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
                                <NoteCard key={note._id} note={note} />
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
        </div>
    );
};

export default NotesApp;