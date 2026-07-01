'use client';

import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';
import NoteCard from './NoteCard';
import NoteModal from './NoteModal';
import { setSidebarCollapsed, toggleCategoryFilter, selectAllNotes, clearSelection, setModalOpen, setReaderOpen, setEditingNote, toggleSelectNote } from '../store/notesSlice';
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

    const { notes, activeView, searchQuery, sortBy, sidebarCollapsed, categoryFilter, selectedNoteIds, isModalOpen, isReaderOpen } = useSelector(
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
                sorted.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
        }

        return sorted;
    }, [notes, activeView, searchQuery, sortBy, safeCategoryFilter]);

    const getEmptyMessage = () => {
        if (searchQuery) {
            return {
                icon: 'bi-search',
                title: t("notes.noResultsFound"),
                text: t("notes.tryAdjustingYourSear"),
            };
        }

        switch (activeView) {
            case 'archive':
                return { icon: 'bi-archive', title: t("notes.archiveIsEmpty"), text: t("notes.archivedNotesWillApp") };
            case 'trash':
                return { icon: 'bi-trash3', title: t("notes.trashIsEmpty"), text: t("notes.deletedNotesWillAppe") };
            default:
                return {
                    icon: 'bi-journal-plus',
                    title: t("notes.noNotesYet"),
                    text: t("notes.createYourFirstNoteT"),
                };
        }
    };

    const emptyState = getEmptyMessage();
    const isSidebarOpen = !sidebarCollapsed;

    const closeSidebar = useCallback(() => {
        dispatch(setSidebarCollapsed(true));
    }, [dispatch]);

    // Workspace Navigation Reset Effect
    useEffect(() => {
        dispatch(toggleCategoryFilter('All'));
        dispatch(clearSelection());
    }, [activeView, dispatch]);


    // Ctrl + A shortcut (Event Listener)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {

                const targetTag = document.activeElement.tagName;
                if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || document.activeElement.isContentEditable) {
                    return;
                }

                e.preventDefault();

                const allVisibleIds = filteredAndSortedNotes.map((note) => note._id);

                dispatch(selectAllNotes(allVisibleIds));
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [filteredAndSortedNotes, dispatch]);

    // Global Shortcuts (Search, Save, Escape, New Note)
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Ctrl + Enter to Save Note
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (isModalOpen) {
                    e.preventDefault();
                    document.getElementById('global-save-note-btn')?.click();
                    return;
                }
            }

            // New Note (Ctrl+N or Cmd+N)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
                const activeTag = document.activeElement?.tagName;
                if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable) {
                    return;
                }
                e.preventDefault();
                dispatch(setEditingNote(null));
                dispatch(setModalOpen(true));
            }

            // Search (Ctrl+F or Cmd+F)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('global-search-input');
                if (searchInput) searchInput.focus();
            }

            // Save (Ctrl+S or Cmd+S)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                const saveBtn = document.getElementById('global-save-note-btn');
                if (saveBtn) {
                    saveBtn.click();
                }
            }

            // Escape
            if (e.key === 'Escape') {
                if (selectedNoteIds && selectedNoteIds.length > 0) {
                    dispatch(clearSelection());
                } else if (isModalOpen) {
                    dispatch(setModalOpen(false));
                } else if (isReaderOpen) {
                    dispatch(setReaderOpen(false));
                } else if (!sidebarCollapsed) {
                    closeSidebar();
                }
                document.activeElement?.blur();
            }

            // Enter (Confirm Modal or Open Selected Note)
            if (e.key === 'Enter') {
                const activeTag = document.activeElement?.tagName;
                if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable) {
                    return;
                }
                
                // Priority Check: Confirmation Modal (Delete / Logout)
                const confirmBtn = document.querySelector('.btn-modal-confirm') || document.querySelector('.btn-logout-confirm');
                if (confirmBtn) {
                    e.preventDefault();
                    confirmBtn.click();
                    return;
                }
                
                // Secondary Action: Open Single Selected Note
                if (selectedNoteIds && selectedNoteIds.length === 1 && !isModalOpen && !isReaderOpen) {
                    e.preventDefault();
                    const noteToEdit = notes.find(n => n._id === selectedNoteIds[0]);
                    if (noteToEdit) {
                        dispatch(setEditingNote(noteToEdit));
                        dispatch(setModalOpen(true));
                    }
                }
            }

            // Toggle Sidebar (Ctrl + \ or Cmd + \)
            if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
                e.preventDefault();
                dispatch(setSidebarCollapsed(!sidebarCollapsed));
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [dispatch, selectedNoteIds, isModalOpen, isReaderOpen, sidebarCollapsed, closeSidebar, notes]);

    const lastSelectedNoteIndexRef = useRef(null);

    const handleNoteSelect = useCallback((noteId, e) => {
        const flatNotes = filteredAndSortedNotes;
        const currentIndex = flatNotes.findIndex(n => n._id === noteId);

        if (e.shiftKey && lastSelectedNoteIndexRef.current !== null && currentIndex !== -1) {
            const start = Math.min(lastSelectedNoteIndexRef.current, currentIndex);
            const end = Math.max(lastSelectedNoteIndexRef.current, currentIndex);
            
            const noteIdsInRange = flatNotes.slice(start, end + 1).map(n => n._id);
            const newSelection = new Set(selectedNoteIds);
            noteIdsInRange.forEach(id => newSelection.add(id));
            
            dispatch(selectAllNotes(Array.from(newSelection)));
            window.getSelection()?.removeAllRanges();
        } else {
            dispatch(toggleSelectNote(noteId));
        }
        
        lastSelectedNoteIndexRef.current = currentIndex;
    }, [filteredAndSortedNotes, selectedNoteIds, dispatch]);

    // Selection Syncing (Dynamic Deselect)
    useEffect(() => {
        if (!selectedNoteIds || selectedNoteIds.length === 0) return;

        const visibleIds = new Set(filteredAndSortedNotes.map(note => note._id));
        const syncedSelection = selectedNoteIds.filter(id => visibleIds.has(id));

        if (syncedSelection.length !== selectedNoteIds.length) {
            dispatch(selectAllNotes(syncedSelection));
        }
    }, [filteredAndSortedNotes, selectedNoteIds, dispatch]);

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
            const noteDate = new Date(note.updatedAt || note.createdAt);
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
                            onClick={() => {
                                dispatch(toggleCategoryFilter('All'));
                                dispatch(clearSelection());
                            }}
                        >
                            {t("notes.all")}
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
                                    onClick={() => {
                                        dispatch(toggleCategoryFilter(tag.label));
                                        dispatch(clearSelection());
                                    }}
                                >
                                    {t(`tags.${tag.label.toLowerCase()}`)}
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
                                                <NoteCard key={note._id} note={note} onDeleteRequest={(note) => setNoteToDelete(note)} onSelectToggle={(e) => handleNoteSelect(note._id, e)} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="notes-grid">
                                {filteredAndSortedNotes.map((note) => (
                                    <NoteCard key={note._id} note={note} onDeleteRequest={(note) => setNoteToDelete(note)} onSelectToggle={(e) => handleNoteSelect(note._id, e)} />
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
                        <h3>{t("notes.header.deleteConfirmTitleSingle")}</h3>
                        <p>{t("notes.header.deleteConfirmDescSingle")}</p>
                        <div className="logout-modal-actions">
                            <button className="btn-modal-cancel" onClick={() => setNoteToDelete(null)}>
                                {t("common.cancel")}
                            </button>
                            <button className="btn-modal-confirm" onClick={confirmPermanentDelete} data-tooltip-id="global-tooltip" data-tooltip-content={t("common.confirmEnter")}>
                                {t("common.delete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesApp;