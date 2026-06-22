'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

async function getCroppedImg(image, crop) {
  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  canvas.width = Math.floor(crop.width * scaleX);
  canvas.height = Math.floor(crop.height * scaleY);

  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (!file) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(file);
    }, 'image/jpeg', 1.0)
  })
}

const ImageCropModal = ({ imageSrc, onClose }) => {
    const { t } = useTranslation();
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);

    const handleConfirm = async () => {
        if (!completedCrop || !completedCrop.width || !completedCrop.height || !imgRef.current) return;
        try {
            const blob = await getCroppedImg(imgRef.current, completedCrop);
            
            let filename = imageSrc.split('/').pop() || 'cropped-image';
            if (!filename.includes('.')) filename += '.jpg';
            else filename = filename.replace(/\.[^/.]+$/, "") + "-cropped.jpg";

            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'Image',
                        accept: { 'image/jpeg': ['.jpg'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                onClose();
            } catch (err) {
                if (err.name === 'AbortError') return;
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
                onClose();
            }
        } catch (e) {
            console.error('Failed to crop image', e);
        }
    };

    return createPortal(
        <div className="crop-modal-overlay" onClick={onClose}>
            <div className="crop-modal-content" onClick={e => e.stopPropagation()}>
                <div className="crop-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', paddingBottom: '100px' }}>
                    <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
                        <img ref={imgRef} src={imageSrc} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} alt="Crop target" />
                    </ReactCrop>
                </div>
                <div className="crop-action-bar">
                    <button className="custom-btn cancel-btn" onClick={onClose}>{t('Cancel')}</button>
                    <button className="custom-btn primary-btn" onClick={handleConfirm}>{t('Confirm & Download')}</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const ImageInputMenu = ({ isOpen, onClose, onGallerySelect, onCameraSelect }) => {
    const { t } = useTranslation();
    const galleryRef = useRef(null);
    const cameraRef = useRef(null);

    if (!isOpen) return null;

    return createPortal(
        <div className="image-menu-overlay" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <div className="image-menu-sheet" onClick={e => e.stopPropagation()}>
                <div className="image-menu-header">
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>{t('Add Image')}</h3>
                    <button type="button" className="image-menu-close" onClick={(e) => { e.stopPropagation(); onClose(); }}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="image-menu-options">
                    <button className="image-menu-option" onClick={() => cameraRef.current.click()}>
                        <i className="bi bi-camera"></i>
                        <span>{t('Take Photo')}</span>
                    </button>
                    <button className="image-menu-option" onClick={() => galleryRef.current.click()}>
                        <i className="bi bi-image"></i>
                        <span>{t('Select Photo')}</span>
                    </button>
                    <button className="image-menu-option" onClick={() => alert("Recognize Text OCR logic coming soon!")}>
                        <i className="bi bi-fonts"></i>
                        <span>{t('Recognize Text')}</span>
                    </button>
                </div>
                
                <input type="file" accept="image/*" ref={galleryRef} style={{ display: 'none' }} onChange={onGallerySelect} />
                <input type="file" accept="image/*" capture="environment" ref={cameraRef} style={{ display: 'none' }} onChange={onCameraSelect} />
            </div>
        </div>,
        document.body
    );
};

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
    const [cropImageSrc, setCropImageSrc] = useState(null);
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

    const handleDownloadImage = async () => {
        if (lightboxIndex < 0 || !lightboxSlides[lightboxIndex]) return;
        const src = lightboxSlides[lightboxIndex].src;
        try {
            // Fetch the image as a blob to force download instead of opening in a new tab
            const response = await fetch(src);
            const blob = await response.blob();
            // Extract filename or use default
            let filename = src.split('/').pop() || 'image';
            if (!filename.includes('.')) filename += '.jpg';

            try {
                // Advanced File System Access API (Desktop Chrome/Edge)
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'Image',
                        accept: { [blob.type || 'image/jpeg']: ['.' + filename.split('.').pop()] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
            } catch (err) {
                // If user aborted the dialog, do nothing
                if (err.name === 'AbortError') return;

                // Fallback for Safari, Firefox, and Mobile browsers
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            }
        } catch (error) {
            console.error('Image download failed:', error);
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
            toolbar={{
                buttons: [
                    <button 
                        key="crop" 
                        type="button" 
                        className="yarl__button" 
                        onClick={() => setCropImageSrc(lightboxSlides[lightboxIndex]?.src)} 
                        title={t("Crop Image")}
                        aria-label={t("Crop Image")}
                    >
                        <svg className="yarl__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z" />
                        </svg>
                    </button>,
                    <button 
                        key="download" 
                        type="button" 
                        className="yarl__button" 
                        onClick={handleDownloadImage} 
                        title={t("Download Image")}
                        aria-label={t("Download Image")}
                        style={{ marginRight: 'auto' }}
                    >
                        <svg className="yarl__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                        </svg>
                    </button>,
                    "zoom",
                    "close"
                ]
            }}
            render={{
                buttonPrev: lightboxSlides.length <= 1 ? () => null : undefined,
                buttonNext: lightboxSlides.length <= 1 ? () => null : undefined,
            }}
        />
        {cropImageSrc && <ImageCropModal imageSrc={cropImageSrc} onClose={() => setCropImageSrc(null)} />}
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

    const quillRef = useRef(null);
    const [showImageMenu, setShowImageMenu] = useState(false);
    
    // Use a ref to ensure the memoized Quill config always has access to the latest state setter
    const setShowImageMenuRef = useRef(setShowImageMenu);
    setShowImageMenuRef.current = setShowImageMenu;

    const quillModules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'font': ['', 'lora', 'padauk', 'dancing-script', 'playfair-display'] }],
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
                ['link', 'image'],
                ['clean']
            ],
            handlers: {
                image: () => {
                    setShowImageMenuRef.current(true);
                }
            }
        }
    }), []);

    const insertImageToEditor = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (quillRef.current) {
                const editor = quillRef.current.getEditor();
                const range = editor.getSelection(true);
                editor.insertEmbed(range ? range.index : 0, 'image', e.target.result);
                if (range) editor.setSelection(range.index + 1);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleGallerySelect = (e) => {
        const file = e.target.files[0];
        insertImageToEditor(file);
        setShowImageMenu(false);
    };

    const handleCameraSelect = (e) => {
        const file = e.target.files[0];
        insertImageToEditor(file);
        setShowImageMenu(false);
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
                            ref={quillRef}
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
            
            <ImageInputMenu 
                isOpen={showImageMenu} 
                onClose={() => setShowImageMenu(false)} 
                onGallerySelect={handleGallerySelect} 
                onCameraSelect={handleCameraSelect} 
            />
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