'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    setEditingNote,
    setModalOpen,
    setReadingNote,
    setReaderOpen,
    toggleSelectNote
} from '../store/notesSlice';
import { updateNoteOnServer } from '../store/notesThunks';
import './NoteCard.css';
import { useTranslation } from 'react-i18next';

const NoteCard = ({ note, onDeleteRequest }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { activeView } = useSelector((state) => state.notes);

    const isSelected = useSelector((state) => state.notes.selectedNoteIds.includes(note._id));

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const stripHtml = (html) => {
        const doc = new DOMParser().parseFromString(html || '', 'text/html');
        return doc.body.textContent || "";
    };

    const handleReadNote = () => {
        dispatch(setReadingNote(note));
        dispatch(setReaderOpen(true));
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        dispatch(setReadingNote(null));
        dispatch(setReaderOpen(false));
        dispatch(setEditingNote(note));
        dispatch(setModalOpen(true));
    };

    // Archive (or) Unarchive (Toggle Logic)
    const handleArchiveToggle = (e) => {
        e.stopPropagation();
        dispatch(updateNoteOnServer({
            ...note,
            isArchived: !note.isArchived
        }));
    };

    // Soft Delete
    const handleDelete = (e) => {
        e.stopPropagation();
        dispatch(updateNoteOnServer({
            ...note,
            isDeleted: true,
            isArchived: false
        }));
    };

    // Restore
    const handleRestore = (e) => {
        e.stopPropagation();
        dispatch(updateNoteOnServer({
            ...note,
            isDeleted: false
        }));
    };

    // Done (or) Pending
    const handleToggleDone = (e) => {
        e.stopPropagation();
        dispatch(updateNoteOnServer({
            ...note,
            isDone: !note.isDone
        }));
    };

    // Permanent Delete
    const handlePermanentDeleteClick = (e) => {
        e.stopPropagation();
        if (onDeleteRequest) {
            onDeleteRequest(note);
        }
    };

    return (
        <div 
            className={`note-card ${note.isDone ? 'done' : '' && note.isSelected ? 'selected' : ''}  `}
            onClick={(e) => e.stopPropagation()}
        >

            <div className={`${isSelected ? 'note-checkbox-wrapper-selected' : 'note-checkbox-wrapper'}`} onClick={(e) => {
                e.stopPropagation();
                dispatch(toggleSelectNote(note._id));
            }}>
                <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <i className="bi bi-check"></i>}
                </div>
            </div>

            <div className="note-card-glow" style={{ backgroundColor: note.tagColor }}></div>

            <div className="note-card-header">
                <span className="note-tag" style={{ backgroundColor: `${note.tagColor}20`, color: note.tagColor }}>
                    {t(note.tag)}
                </span>
                <span className="note-date">
                    <i className="bi bi-calendar3"></i>
                    {formatDate(note.createdAt)}
                </span>
            </div>

            <div
                className="note-card-body"
                onClick={handleReadNote}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleReadNote();
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Read note: ${note.title}`}
            >
                <h3 className="note-title">{note.title}</h3>
                <p className="note-content">{stripHtml(note.content)}</p>
            </div>

            <div className="note-card-footer" onClick={(e) => e.stopPropagation()}>
                <div className="note-status">
                    <button
                        className={`status-btn ${note.isDone ? 'completed' : ''}`}
                        onClick={handleToggleDone}
                        title={note.isDone ? t('Mark as incomplete') : t('Mark as complete')}
                    >
                        <i className={`bi ${note.isDone ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                        <span>{note.isDone ? t('Done') : t('Pending')}</span>
                    </button>
                </div>

                <div className="note-actions">
                    {activeView === 'trash' ? (
                        <>
                            <button className="action-btn restore" onClick={handleRestore} title={t("Restore")}>
                                <i className="bi bi-arrow-counterclockwise"></i>
                            </button>
                            <button className="action-btn delete-permanent" onClick={handlePermanentDeleteClick} title={t("Delete Forever")}>
                                <i className="bi bi-trash-fill" style={{ color: '#ef4444' }}></i>
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="action-btn edit" onClick={handleEdit} title={t("Edit")}>
                                <i className="bi bi-pencil"></i>
                            </button>

                            <button
                                className={`action-btn ${note.isArchived ? 'unarchive' : 'archive'}`}
                                onClick={handleArchiveToggle}
                                title={note.isArchived ? t('Unarchive') : t('Archive')}
                            >
                                <i className={`bi ${note.isArchived ? 'bi-box-arrow-up' : 'bi-archive'}`}></i>
                            </button>

                            <button className="action-btn delete" onClick={handleDelete} title={t("Delete")}>
                                <i className="bi bi-trash3"></i>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoteCard;