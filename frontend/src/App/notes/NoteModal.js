'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    setModalOpen,
    setEditingNote,
    setReadingNote,
    setReaderOpen,
} from '../store/notesSlice';
import { addNoteToServer, updateNoteOnServer } from '../store/notesThunks';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './NoteModal.css';
import { useTranslation } from 'react-i18next';
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

const Font = Quill.import('formats/font');
Font.whitelist = ['', 'lora', 'padauk', 'dancing-script', 'playfair-display'];

// Phase 1.5 Strict Normalization: Quill's default ClassAttributor splits class names 
// by the last hyphen. For multi-word fonts (e.g., ql-font-dancing-script), this incorrectly 
// yields 'ql-font-dancing' as the key, causing string matching errors during HTML hydration.
// We safely normalize the keys() parsing so it exactly matches the 'ql-font' whitelist.
if (Font.constructor && Font.constructor.keys) {
    Font.constructor.keys = function(node) {
        return Array.from(node.classList).map(name => {
            if (name.startsWith('ql-font-')) {
                return 'ql-font';
            }
            return name.split('-').slice(0, -1).join('-');
        }).filter(name => name !== '');
    };
}

Quill.register(Font, true);

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
    const [isImageGrid, setIsImageGrid] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const contentRef = useRef(null);
    const noteTag = tagOptions.find((t) => t.label === note.tag) || {
        label: note.tag,
        color: note.tagColor || '#94a3b8',
    };

    // Extract all images from the note content for the Lightbox gallery
    const lightboxSlides = useMemo(() => {
        if (!note || !note.content) return [];
        const regex = /<img[^>]+src="([^">]+)"/g;
        let match;
        const images = [];
        while ((match = regex.exec(note.content)) !== null) {
            images.push({ src: match[1] });
        }
        return images;
    }, [note]);

    const handleContentClick = (e) => {
        if (e.target.tagName === 'IMG') {
            const src = e.target.src;
            const index = lightboxSlides.findIndex(slide => slide.src === src);
            setLightboxIndex(index !== -1 ? index : 0);
        }
    };

    return (
        <>
        <div className="reader-overlay" onClick={onClose}>
            <div className={`reader-modal reader-modal-${viewSize}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="reader-title">
                <div className="reader-header">
                    <h2 className="reader-title" id="reader-title">
                        <i className="bi bi-book"></i>
                        {note.title} <span className="reader-badge">({t('Read-Only')})</span>
                    </h2>
                    <div className="reader-header-actions">
                        <div className="image-toggle-controls">
                            <button 
                                className="size-btn image-toggle-btn" 
                                onClick={() => setIsImageGrid(!isImageGrid)} 
                                title={isImageGrid ? t('Switch to Full-Width Stack') : t('Switch to Grid Gallery')}
                            >
                                <i className={`bi ${isImageGrid ? 'bi-distribute-vertical' : 'bi-grid-fill'}`}></i>
                            </button>
                            <div className="toggle-divider"></div>
                        </div>
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
                        <h1 className={`reader-page-title ${note.titleFontFamily ? `ql-font-${note.titleFontFamily}` : ''}`}>{note.title}</h1>
                        <div 
                            ref={contentRef}
                            className={`reader-page-content ${isImageGrid ? 'editor-image-grid' : 'editor-image-stack'}`}
                            onClick={handleContentClick}
                        >
                            <ReactQuill 
                                value={note.content} 
                                readOnly={true} 
                                theme="bubble" 
                            />
                        </div>
                    </article>
                </div>

                <div className="reader-footer">
                    <div className="reader-tags-section">
                        <div className="tag-selector tag-selector-readonly">
                            {tagOptions.map((tag) => {
                                const isActive = tag.label === noteTag.label;
                                if (!isActive) return null; // Only show the active tag to save space
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
                    <button type="button" className="btn-close-view" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                        {t('Close View')}
                    </button>
                </div>
            </div>
        </div>
        <Lightbox
            open={lightboxIndex >= 0}
            close={() => setLightboxIndex(-1)}
            index={lightboxIndex >= 0 ? lightboxIndex : 0}
            slides={lightboxSlides}
            plugins={[Zoom]}
            on={{ view: ({ index: currentIndex }) => setLightboxIndex(currentIndex) }}
            render={{
                buttonPrev: lightboxSlides.length <= 1 ? () => null : undefined,
                buttonNext: lightboxSlides.length <= 1 ? () => null : undefined,
            }}
        />
        </>
    );
};

const NoteEditModal = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { editingNote } = useSelector((state) => state.notes);

    const [isComposing, setIsComposing] = useState(false);
    const quillWrapperRef = useRef(null);

    const [title, setTitle] = useState(editingNote?.title || '');
    const [titleFontFamily, setTitleFontFamily] = useState(editingNote?.titleFontFamily || '');
    const [content, setContent] = useState(editingNote?.content || '');
    const [isTitleFontDropdownOpen, setIsTitleFontDropdownOpen] = useState(false);
    const fontDropdownRef = useRef(null);

    const titleFontOptions = [
        { label: 'Sans Serif', value: '', fontFamily: 'inherit' },
        { label: 'Lora', value: 'lora', fontFamily: "'Lora', serif" },
        { label: 'Padauk', value: 'padauk', fontFamily: "'Padauk', sans-serif" },
        { label: 'Dancing Script', value: 'dancing-script', fontFamily: "'Dancing Script', cursive" },
        { label: 'Playfair Display', value: 'playfair-display', fontFamily: "'Playfair Display', serif" }
    ];
    const [selectedTag, setSelectedTag] = useState(
        editingNote ? (tagOptions.find((t) => t.label === editingNote.tag) || tagOptions[0]) : tagOptions[0]
    );

    const quillModules = {
        toolbar: [
            [{ 'font': ['', 'lora', 'padauk', 'dancing-script', 'playfair-display'] }],
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    const isUnchanged =
        title.trim() === (editingNote?.title || '').trim() &&
        titleFontFamily === (editingNote?.titleFontFamily || '') &&
        content.trim() === (editingNote?.content || '').trim() &&
        selectedTag.label === (editingNote?.tag || '');

    const isCreateDisabled = !title.trim() || !content.trim();
    
    const isButtonDisabled = editingNote ? isUnchanged : isCreateDisabled;

    useEffect(() => {
        if (editingNote) {
            setTitle(editingNote.title || '');
            setTitleFontFamily(editingNote.titleFontFamily || '');
            setContent(editingNote.content || '');
            const tag = tagOptions.find((t) => t.label === editingNote.tag) || tagOptions[0];
            setSelectedTag(tag);
        } else {
            setTitle('');
            setTitleFontFamily('');
            setContent('');
            setSelectedTag(tagOptions[0]);
        }
    }, [editingNote]);

    // Advanced dropdown UX: close on outside clicks, close on editor focus, and ensure mutual exclusivity
    useEffect(() => {
        const handleDocumentClick = (event) => {
            // Quill Pickers
            if (quillWrapperRef.current) {
                const isOutsideQuill = !quillWrapperRef.current.contains(event.target);
                const clickedPicker = event.target.closest('.ql-picker');
                const expandedPickers = quillWrapperRef.current.querySelectorAll('.ql-picker.ql-expanded');
                
                expandedPickers.forEach(picker => {
                    if (isOutsideQuill) {
                        picker.classList.remove('ql-expanded');
                    } else if (picker !== clickedPicker) {
                        picker.classList.remove('ql-expanded');
                    }
                });
            }

            // Title Font Dropdown
            if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target)) {
                setIsTitleFontDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleDocumentClick);
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, []);

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
            titleFontFamily,
            content: content.trim(),
            tag: selectedTag.label,
            tagColor: selectedTag.color,
            createdAt: new Date().toISOString()
        };

        const noteData = {
            title: title.trim(),
            titleFontFamily,
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
            <form className="note-modal" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <i className={`bi ${editingNote ? 'bi-pencil-square' : 'bi-plus-circle'}`}></i>
                        {editingNote ? t('Edit Note') : t('Create New Note')}
                    </h2>
                    <button type="button" className="modal-close" onClick={handleClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>{t('Title')}</label>
                            <div className="title-font-dropdown-container" ref={fontDropdownRef} style={{ position: 'relative' }}>
                                <button 
                                    type="button"
                                    className="title-font-dropdown-toggle"
                                    onClick={() => setIsTitleFontDropdownOpen(!isTitleFontDropdownOpen)}
                                >
                                    <span style={{ fontFamily: titleFontOptions.find(opt => opt.value === titleFontFamily)?.fontFamily || 'inherit' }}>
                                        {titleFontOptions.find(opt => opt.value === titleFontFamily)?.label || 'Sans Serif'}
                                    </span>
                                    <i className="bi bi-chevron-down" style={{ fontSize: '12px', marginLeft: '6px' }}></i>
                                </button>
                                
                                {isTitleFontDropdownOpen && (
                                    <div className="title-font-dropdown-menu">
                                        {titleFontOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                className={`title-font-dropdown-item ${titleFontFamily === opt.value ? 'active' : ''}`}
                                                style={{ fontFamily: opt.fontFamily }}
                                                onClick={() => {
                                                    setTitleFontFamily(opt.value);
                                                    setIsTitleFontDropdownOpen(false);
                                                }}
                                            >
                                                {opt.label}
                                                {titleFontFamily === opt.value && <i className="bi bi-check2"></i>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <input
                            type="text"
                            className={`form-input ${titleFontFamily ? `ql-font-${titleFontFamily}` : ''}`}
                            placeholder={t("Enter note title...")}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div 
                        ref={quillWrapperRef}
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