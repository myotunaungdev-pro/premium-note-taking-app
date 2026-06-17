'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    setModalOpen,
    setEditingNote,
    setReadingNote,
    setReaderOpen,
} from '../store/notesSlice';
import { addNoteToServer, updateNoteOnServer } from '../store/notesThunks';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './NoteModal.css';
import { useTranslation } from 'react-i18next';

export const tagOptions = [
    { label: 'Work', color: '#00d4aa' },
    { label: 'Personal', color: '#7c3aed' },
    { label: 'Shopping', color: '#f59e0b' },
    { label: 'Health', color: '#ef4444' },
    { label: 'Ideas', color: '#3b82f6' },
    { label: 'Finance', color: '#10b981' },
    { label: 'Lyrics', color: '#ff477e' },
];

const tagClassSlug = (label) => label.toLowerCase().replace(/\s+/g, '-');

const NoteReadView = ({ note, onClose }) => {
    const { t } = useTranslation();
    const [viewSize, setViewSize] = useState('default');
    const noteTag = tagOptions.find((t) => t.label === note.tag) || {
        label: note.tag,
        color: note.tagColor || '#94a3b8',
    };

    return (
        <div className="reader-overlay" onClick={onClose}>
            <div className={`reader-modal reader-modal-${viewSize}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="reader-title">
                <div className="reader-header">
                    <h2 className="reader-title" id="reader-title">
                        <i className="bi bi-book"></i>
                        {note.title} <span className="reader-badge">({t('Read-Only')})</span>
                    </h2>
                    <div className="reader-header-actions">
                        <div className="view-size-controls">
                            <button className={`size-btn ${viewSize === 'default' ? 'active' : ''}`} onClick={() => setViewSize('default')} title={t('Default Size')}>
                                <i className="bi bi-window"></i>
                            </button>
                            <button className={`size-btn ${viewSize === 'wide' ? 'active' : ''}`} onClick={() => setViewSize('wide')} title={t('Wide Size')}>
                                <i className="bi bi-aspect-ratio"></i>
                            </button>
                            <button className={`size-btn ${viewSize === 'fullscreen' ? 'active' : ''}`} onClick={() => setViewSize('fullscreen')} title={t('Fullscreen')}>
                                <i className="bi bi-arrows-fullscreen"></i>
                            </button>
                        </div>
                        <button className="modal-close" onClick={onClose} aria-label={t("Close View")}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>

                <div className="reader-body">
                    <article className="reader-page">
                        <h1 className="reader-page-title">{note.title}</h1>
                        <div 
                            className="reader-page-content ql-editor"
                            dangerouslySetInnerHTML={{ __html: note.content }}
                        ></div>
                    </article>

                    <div className="reader-tags-section">
                        <span className="form-label">{t('Tag')}</span>
                        <div className="tag-selector tag-selector-readonly">
                            {tagOptions.map((tag) => {
                                const isActive = tag.label === noteTag.label;
                                return (
                                    <span
                                        key={tag.label}
                                        className={`tag-option tag-option-readonly tag-option--${tagClassSlug(tag.label)} ${isActive ? 'selected' : ''}`}
                                        style={{
                                            '--tag-color': tag.color,
                                            backgroundColor: isActive ? `${tag.color}20` : 'transparent',
                                            borderColor: isActive ? tag.color : 'rgba(61, 53, 40, 0.15)',
                                            color: isActive ? tag.color : '#8b7d6b',
                                        }}
                                    >
                                        <span className="tag-dot" style={{ backgroundColor: tag.color }}></span>
                                        {t(tag.label)}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="reader-footer">
                    <button type="button" className="btn-close-view" onClick={onClose}>
                        <i className="bi bi-arrows-angle-contract"></i>
                        {t('Close View')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const NoteEditModal = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { editingNote } = useSelector((state) => state.notes);

    const [isComposing, setIsComposing] = useState(false);

    const [title, setTitle] = useState(editingNote?.title || '');
    const [content, setContent] = useState(editingNote?.content || '');
    const [selectedTag, setSelectedTag] = useState(
        editingNote ? (tagOptions.find((t) => t.label === editingNote.tag) || tagOptions[0]) : tagOptions[0]
    );

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    const isUnchanged =
        title.trim() === (editingNote?.title || '').trim() &&
        content.trim() === (editingNote?.content || '').trim() &&
        selectedTag.label === (editingNote?.tag || '');

    const isCreateDisabled = !title.trim() || !content.trim();
    
    const isButtonDisabled = editingNote ? isUnchanged : isCreateDisabled;

    useEffect(() => {
        if (editingNote) {
            setTitle(editingNote.title || '');
            setContent(editingNote.content || '');
            const tag = tagOptions.find((t) => t.label === editingNote.tag) || tagOptions[0];
            setSelectedTag(tag);
        } else {
            setTitle('');
            setContent('');
            setSelectedTag(tagOptions[0]);
        }
    }, [editingNote]);

    const handleClose = () => {
        dispatch(setModalOpen(false));
        dispatch(setEditingNote(null));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) return;

        const updatedNoteData = {
            ...editingNote,
            title: title.trim(),
            content: content.trim(),
            tag: selectedTag.label,
            tagColor: selectedTag.color,
            createdAt: new Date().toISOString()
        };

        const noteData = {
            title: title.trim(),
            content: content.trim(),
            tag: selectedTag.label,
            tagColor: selectedTag.color,
            createdAt: new Date().toISOString(),
            isDone: false,
            isArchived: false,
            isDeleted: false,
        };

        if (editingNote) {
            dispatch(updateNoteOnServer({ ...editingNote, ...updatedNoteData }));
        } else {
            dispatch(addNoteToServer(noteData));
        }

        handleClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="note-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <i className={`bi ${editingNote ? 'bi-pencil-square' : 'bi-plus-circle'}`}></i>
                        {editingNote ? t('Edit Note') : t('Create New Note')}
                    </h2>
                    <button className="modal-close" onClick={handleClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">{t('Title')}</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder={t("Enter note title...")}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div 
                            className={`form-group quill-group ${isComposing ? 'is-composing' : ''}`}
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={() => setIsComposing(false)}
                        >
                            <label className="form-label">{t('Content')}</label>
                            <ReactQuill 
                                theme="snow" 
                                value={content} 
                                onChange={setContent} 
                                modules={quillModules}
                                placeholder={t("Write your note here...")}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('Tag')}</label>
                            <div className="tag-selector">
                                {tagOptions.map((tag) => (
                                    <button
                                        key={tag.label}
                                        type="button"
                                        className={`tag-option tag-option--${tagClassSlug(tag.label)} ${selectedTag.label === tag.label ? 'selected' : ''}`}
                                        style={{
                                            '--tag-color': tag.color,
                                            backgroundColor: selectedTag.label === tag.label ? `${tag.color}20` : 'transparent',
                                            borderColor: selectedTag.label === tag.label ? tag.color : 'rgba(255,255,255,0.1)',
                                            color: selectedTag.label === tag.label ? tag.color : '#94a3b8',
                                        }}
                                        onClick={() => setSelectedTag(tag)}
                                    >
                                        <span className="tag-dot" style={{ backgroundColor: tag.color }}></span>
                                        {t(tag.label)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={handleClose}>
                            {t('Cancel')}
                        </button>
                        <button type="submit" className="btn-save" disabled={isButtonDisabled}>
                            <i className={`bi ${editingNote ? 'bi-check-lg' : 'bi-plus-lg'}`}></i>
                            {editingNote ? t('Update Note') : t('Create Note')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const NoteModal = () => {
    const dispatch = useDispatch();
    const { isReaderOpen, readingNote, isModalOpen } = useSelector((state) => state.notes);

    const handleCloseReader = () => {
        dispatch(setReaderOpen(false));
        dispatch(setReadingNote(null));
    };

    return (
        <>
            {isReaderOpen && readingNote && (
                <NoteReadView note={readingNote} onClose={handleCloseReader} />
            )}
            {isModalOpen && <NoteEditModal />}
        </>
    );
};

export default NoteModal;