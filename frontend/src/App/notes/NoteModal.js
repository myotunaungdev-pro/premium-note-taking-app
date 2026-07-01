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
import { ReactSketchCanvas } from 'react-sketch-canvas';
import { Pencil, PenTool, Highlighter, Eraser, Undo2, Trash2, X } from 'lucide-react';

async function getCroppedImg(image, crop) {
  const canvas = document.createElement("canvas")
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const ctx = canvas.getContext("2d")

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

const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 1920;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height = Math.floor(height * (MAX_WIDTH / width));
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const compressedFile = new File([blob], file.name || "compressed.jpg", {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                } else {
                    reject(new Error('Canvas is empty'));
                }
            }, 'image/jpeg', 0.95);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
};

const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'note_uploads');

    const res = await fetch('https://api.cloudinary.com/v1_1/daiusa7bt/image/upload', {
        method: 'POST',
        body: formData,
    });
    const data = await res.json();
    if (data.secure_url) {
        return data.secure_url;
    } else {
        throw new Error(data.error?.message || "Upload failed");
    }
};

const ImageCropModal = ({ imageSrc, onClose, onUpdateImage }) => {
    const { t } = useTranslation();
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [savingAction, setSavingAction] = useState(null); // 'copy' | 'replace' | null
    const imgRef = useRef(null);

    const handleSave = async (mode) => {
        if (!completedCrop || !completedCrop.width || !completedCrop.height || !imgRef.current) return;
        setSavingAction(mode);
        try {
            const blob = await getCroppedImg(imgRef.current, completedCrop);
            const file = new File([blob], 'crop.jpg', { type: 'image/jpeg' });
            const url = await uploadToCloudinary(file);
            if (onUpdateImage) {
                onUpdateImage(imageSrc, url, mode);
            }
        } catch (e) {
            console.error('Failed to upload cropped image', e);
        } finally {
            setSavingAction(null);
            onClose();
        }
    };

    return createPortal(
        <div className="crop-modal-overlay" onClick={onClose}>
            <div className="crop-modal-content" onClick={e => e.stopPropagation()}>
                <div className="crop-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', paddingBottom: '100px' }}>
                    <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
                        <img ref={imgRef} src={imageSrc} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} alt="Crop target" crossOrigin="anonymous" />
                    </ReactCrop>
                </div>
                <div className="crop-action-bar">
                    <div className="modal-action-buttons">
                        <button className="custom-btn primary-btn" onClick={() => handleSave('replace')} disabled={savingAction !== null}>
                            {savingAction === 'replace' ? t('common.uploading') : t("notes.replaceOriginal")}
                        </button>
                        <button className="custom-btn secondary-btn" onClick={() => handleSave('copy')} disabled={savingAction !== null}>
                            {savingAction === 'copy' ? t('common.uploading') : t("notes.saveAsCopy")}
                        </button>
                        <button className="custom-btn cancel-btn" onClick={onClose} disabled={savingAction !== null}>{t("common.cancel")}</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const DoodleModal = ({ imageSrc, onClose, onUpdateImage }) => {
    const { t } = useTranslation();
    const [strokeColor, setStrokeColor] = useState('#ef4444');
    const [brushType, setBrushType] = useState('pen'); // 'pencil' | 'pen' | 'highlighter' | 'eraser'
    const [eraserWidth, setEraserWidth] = useState(20);
    const [isEraserSliderOpen, setIsEraserSliderOpen] = useState(false);
    const [savingAction, setSavingAction] = useState(null); // 'copy' | 'replace' | null
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

    const handleImageLoad = (e) => {
        setImgDimensions({ width: e.target.width, height: e.target.height });
    };

    const handleSave = async (mode) => {
        if (!canvasRef.current || !imgRef.current) return;
        
        try {
            const sketchBase64 = await canvasRef.current.exportImage("png");
            const originalImg = imgRef.current;
            const naturalWidth = originalImg.naturalWidth;
            const naturalHeight = originalImg.naturalHeight;
            
            const canvas = document.createElement("canvas");
            canvas.width = naturalWidth;
            canvas.height = naturalHeight;
            const ctx = canvas.getContext("2d");
            
            ctx.drawImage(originalImg, 0, 0, naturalWidth, naturalHeight);
            
            const sketchImg = new Image();
            sketchImg.onload = () => {
                ctx.drawImage(sketchImg, 0, 0, naturalWidth, naturalHeight);
                canvas.toBlob(async (blob) => {
                    if (!blob) return;
                    setSavingAction(mode);
                    try {
                        const file = new File([blob], 'doodle.jpg', { type: 'image/jpeg' });
                        const url = await uploadToCloudinary(file);
                        if (onUpdateImage) {
                            onUpdateImage(imageSrc, url, mode);
                        }
                    } catch (e) {
                        console.error("Failed to upload doodle:", e);
                    } finally {
                        setSavingAction(null);
                        onClose();
                    }
                }, 'image/jpeg', 1.0);
            };
            sketchImg.src = sketchBase64;
            
        } catch (error) {
            console.error("Failed to export doodle:", error);
        }
    };

    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    
    const presetColors = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', 
        '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', 
        '#f43f5e', '#ffffff', '#94a3b8', '#475569', '#0f172a'
    ];

    const hexToRgba = (hex, alpha) => {
        let cleanHex = hex.replace('#', '');
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split("").map(char => char + char).join('');
        }
        const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
        return `#${cleanHex}${alphaHex}`;
    };

    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.eraseMode(brushType === 'eraser');
        }
    }, [brushType]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    canvasRef.current?.undo();
                } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
                    e.preventDefault();
                    canvasRef.current?.redo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const getActualStrokeWidth = () => {
        if (brushType === 'pencil') return 2;
        if (brushType === 'pen') return 5;
        if (brushType === 'highlighter') return 20;
        if (brushType === 'eraser') return eraserWidth;
        return 5;
    };

    const getCanvasCursor = () => {
        const isEraser = brushType === 'eraser';
        const w = getActualStrokeWidth();
        
        const svgSize = Math.max(w, 4);
        const halfWidth = svgSize / 2;
        const circleRadius = w / 2;

        let svg = '';
        if (isEraser) {
            svg = `<svg width="${svgSize}" height="${svgSize}" xmlns="http://www.w3.org/2000/svg"><circle cx="${halfWidth}" cy="${halfWidth}" r="${Math.max(0.1, circleRadius - 1)}" fill="none" stroke="black" stroke-width="1" /><circle cx="${halfWidth}" cy="${halfWidth}" r="${Math.max(0.1, circleRadius - 2)}" fill="none" stroke="white" stroke-width="1" /></svg>`;
        } else {
            const fill = brushType === 'highlighter' ? hexToRgba(strokeColor, 0.4) : strokeColor;
            svg = `<svg width="${svgSize}" height="${svgSize}" xmlns="http://www.w3.org/2000/svg"><circle cx="${halfWidth}" cy="${halfWidth}" r="${Math.max(0.1, circleRadius - 0.5)}" fill="${fill}" stroke="white" stroke-width="1" /></svg>`;
        }
        
        const encoded = encodeURIComponent(svg);
        return `url('data:image/svg+xml;utf8,${encoded}') ${halfWidth} ${halfWidth}, crosshair`;
    };

    const getActiveBrushStyle = (toolType) => {
        if (brushType !== toolType) return {};
        return {
            background: hexToRgba(strokeColor, 0.2),
            color: strokeColor,
            boxShadow: `0 2px 8px ${hexToRgba(strokeColor, 0.3)}`
        };
    };

    const getActualStrokeColor = () => {
        if (brushType === 'highlighter') {
            return hexToRgba(strokeColor, 0.4);
        }
        return strokeColor;
    };

    return createPortal(
        <div className="crop-modal-overlay doodle-modal-overlay" onClick={onClose}>
            <div className="crop-modal-content" onClick={e => {
                e.stopPropagation();
                if (isColorPickerOpen) setIsColorPickerOpen(false);
            }}>
                <div className="crop-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', paddingBottom: '150px' }}>
                    <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '75vh' }}>
                        <img 
                            ref={imgRef} 
                            src={imageSrc} 
                            onLoad={handleImageLoad} 
                            style={{ display: 'block', maxWidth: '100%', maxHeight: '75vh', width: 'auto', height: 'auto', userSelect: 'none' }} 
                            alt="Doodle target" 
                            crossOrigin="anonymous" 
                        />
                        {imgDimensions.width > 0 && (
                            <div 
                                className="doodle-canvas-wrapper" 
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', touchAction: 'none', cursor: getCanvasCursor() }}
                            >
                                <ReactSketchCanvas 
                                    ref={canvasRef} 
                                    strokeWidth={getActualStrokeWidth()} 
                                    eraserWidth={eraserWidth}
                                    strokeColor={getActualStrokeColor()} 
                                    width="100%" 
                                    height="100%" 
                                    canvasColor="transparent" 
                                />
                            </div>
                        )}
                    </div>
                </div>
                <div className="crop-action-bar doodle-action-bar">
                    <div className="doodle-tools-container" style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div className="brush-selector-group" style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '50px' }}>
                                <button className={`brush-btn ${brushType === 'pencil' ? 'active' : ''}`} style={getActiveBrushStyle('pencil')} onClick={() => { setBrushType('pencil'); setIsEraserSliderOpen(false); }}><Pencil size={18} /></button>
                                <button className={`brush-btn ${brushType === 'pen' ? 'active' : ''}`} style={getActiveBrushStyle('pen')} onClick={() => { setBrushType('pen'); setIsEraserSliderOpen(false); }}><PenTool size={18} /></button>
                                <button className={`brush-btn ${brushType === 'highlighter' ? 'active' : ''}`} style={getActiveBrushStyle('highlighter')} onClick={() => { setBrushType('highlighter'); setIsEraserSliderOpen(false); }}><Highlighter size={18} /></button>
                            </div>
                            <button 
                                className="current-color-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsColorPickerOpen(!isColorPickerOpen);
                                }}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '50%', backgroundColor: strokeColor,
                                    border: '3px solid #fff', cursor: 'pointer', outline: 'none', padding: 0,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}
                            />
                            
                            {isColorPickerOpen && (
                                <div className="color-picker-popover" onClick={e => e.stopPropagation()}>
                                    <div className="color-palette-grid">
                                        {presetColors.map(c => (
                                            <button 
                                                key={c}
                                                className="color-swatch"
                                                onClick={() => {
                                                    setStrokeColor(c);
                                                    setIsColorPickerOpen(false);
                                                }}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                        <div className="color-swatch rainbow-swatch">
                                            <input 
                                                type="color" 
                                                className="custom-color-input"
                                                value={strokeColor}
                                                onChange={(e) => setStrokeColor(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div className="brush-selector-group" style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '50px' }}>
                                <button 
                                    className={`brush-btn ${brushType === 'eraser' ? 'active' : ''}`} 
                                    onClick={() => {
                                        if (brushType === 'eraser') {
                                            setIsEraserSliderOpen(!isEraserSliderOpen);
                                        } else {
                                            setBrushType('eraser');
                                            setIsEraserSliderOpen(true);
                                        }
                                    }} 
                                    
                                >
                                    <Eraser size={18} />
                                </button>
                                <button className="brush-btn" onClick={() => canvasRef.current?.undo()} disabled={savingAction !== null}><Undo2 size={18} /></button>
                                <button className="brush-btn" onClick={() => canvasRef.current?.clearCanvas()} disabled={savingAction !== null}><Trash2 size={18} /></button>
                            </div>
                            
                            {isEraserSliderOpen && brushType === 'eraser' && (
                                <div className="eraser-slider-popover" onClick={e => e.stopPropagation()}>
                                    <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>Size: {eraserWidth}px</span>
                                    <input 
                                        type="range" 
                                        min="5" 
                                        max="50" 
                                        value={eraserWidth}
                                        onChange={(e) => setEraserWidth(Number(e.target.value))}
                                        className="custom-range-input"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="modal-action-buttons">
                        <button className="custom-btn primary-btn" onClick={() => handleSave('replace')} disabled={savingAction !== null}>
                            {savingAction === 'replace' ? t('common.uploading') : t("notes.replaceOriginal")}
                        </button>
                        <button className="custom-btn secondary-btn" onClick={() => handleSave('copy')} disabled={savingAction !== null}>
                            {savingAction === 'copy' ? t('common.uploading') : t("notes.saveAsCopy")}
                        </button>
                        <button className="custom-btn cancel-btn" onClick={onClose} disabled={savingAction !== null}>{t("common.cancel")}</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const WebcamCaptureModal = ({ onClose, onCapture }) => {
    const { t } = useTranslation();
    const videoRef = useRef(null);

    useEffect(() => {
        let stream = null;
        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Failed to access webcam:", err);
                alert("notes.couldNotAccessCamera");
            }
        };
        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
        onClose();
    };

    return createPortal(
        <div className="image-menu-overlay" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <div className="image-menu-sheet" style={{ maxWidth: '640px', maxHeight: '90dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                <div className="image-menu-header" style={{ flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>{t("notes.webcamCapture")}</h3>
                    <button type="button" className="image-menu-close" onClick={(e) => { e.stopPropagation(); onClose(); }}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', flex: 1, minHeight: 0 }}>
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }}></video>
                </div>
                <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center', flexShrink: 0, paddingBottom: '16px' }}>
                    <button className="custom-btn cancel-btn" onClick={onClose}>{t("common.cancel")}</button>
                    <button className="custom-btn primary-btn" onClick={handleCapture}>{t("notes.capture")}</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const ImageInputMenu = ({ isOpen, onClose, onGallerySelect, onCameraSelect, onDesktopCameraSelect, isUploading }) => {
    const { t } = useTranslation();
    const galleryRef = useRef(null);
    const cameraRef = useRef(null);

    if (!isOpen) return null;

    // Strict Mobile OS detection (prevents narrowed desktop windows from triggering mobile fallback)
    const isMobileDevice = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) || 
                           (navigator.maxTouchPoints > 0 && navigator.userAgent.includes('Mac'));
    
    const handleTakePhoto = () => {
        if (isUploading) return;
        if (isMobileDevice) {
            cameraRef.current.click();
        } else {
            onDesktopCameraSelect();
        }
    };

    return createPortal(
        <div className="image-menu-overlay" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <div className="image-menu-sheet" onClick={e => { if(isUploading) return; e.stopPropagation(); }}>
                <div className="image-menu-header">
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>
                        {isUploading ? t("notes.uploadingToCloud") : t("notes.addImage")}
                    </h3>
                    {!isUploading && (
                        <button type="button" className="image-menu-close" onClick={(e) => { e.stopPropagation(); onClose(); }} data-tooltip-id="global-tooltip" data-tooltip-content={t("notes.closeEsc")}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                    )}
                </div>
                {isUploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '16px' }}>
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            border: '3px solid rgba(255, 255, 255, 0.1)', 
                            borderTopColor: '#00d4aa', 
                            borderRadius: '50%', 
                            animation: 'spin 1s linear infinite' 
                        }}></div>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>{t("notes.uploadingToCloud")}</span>
                    </div>
                ) : (
                    <div className="image-menu-options">
                        <button className="image-menu-option" onClick={handleTakePhoto}>
                            <i className="bi bi-camera"></i>
                            <span>{t("notes.takePhoto")}</span>
                        </button>
                        <button className="image-menu-option" onClick={() => galleryRef.current.click()}>
                            <i className="bi bi-image"></i>
                            <span>{t("notes.selectPhoto")}</span>
                        </button>
                        <button className="image-menu-option" onClick={() => alert("notes.recognizeTextOCRLogi")}>
                            <i className="bi bi-fonts"></i>
                            <span>{t("notes.recognizeText")}</span>
                        </button>
                    </div>
                )}
                
                <input type="file" accept="image/*" multiple ref={galleryRef} style={{ display: 'none' }} onChange={onGallerySelect} disabled={isUploading} />
                <input type="file" accept="image/*" capture="environment" ref={cameraRef} style={{ display: 'none' }} onChange={onCameraSelect} disabled={isUploading} />
            </div>
        </div>,
        document.body
    );
};

const Font = Quill.import("formats/font");
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
            return name.split("-").slice(0, -1).join('-');
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
    const dispatch = useDispatch();
    const [viewSize, setViewSize] = useState('default');
    const [isImageGrid, setIsImageGrid] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const [doodleImageSrc, setDoodleImageSrc] = useState(null);
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
            let filename = src.split("/").pop() || 'image';
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
                const link = document.createElement("notes.a");
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

    const handleUpdateImage = (oldSrc, newSrc, mode) => {
        if (!note || !note.content) return;
        let newContent = note.content;
        if (mode === 'replace') {
            newContent = note.content.split(oldSrc).join(newSrc);
        } else if (mode === 'copy') {
            const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const imgTagRegex = new RegExp(`<img[^>]+src="${escapeRegExp(oldSrc)}"[^>]*>`, 'g');
            newContent = note.content.replace(imgTagRegex, (match) => {
                return `${match}<br><img src="${newSrc}">`;
            });
        }
        const updatedNote = { ...note, content: newContent };
        dispatch(updateNoteOnServer(updatedNote));
        dispatch(setReadingNote(updatedNote));
    };

    return (
        <>
        <div className="reader-overlay" onClick={onClose}>
            <div className={`reader-modal reader-modal-${viewSize}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="reader-title">
                <div className="reader-header">
                    <h2 className="reader-title" id="reader-title">
                        <i className="bi bi-book"></i>
                        {note.title} <span className="reader-badge">({t("notes.modal.readOnly")})</span>
                    </h2>
                    <div className="reader-header-actions">
                        <div className="image-toggle-controls">
                            <button 
                                className="size-btn image-toggle-btn" 
                                onClick={() => setIsImageGrid(!isImageGrid)} 
                            >
                                <i className={`bi ${isImageGrid ? 'bi-distribute-vertical' : 'bi-grid-fill'}`}></i>
                            </button>
                            <div className="toggle-divider"></div>
                        </div>
                        <div className="view-size-controls">
                            <button className={`size-btn ${viewSize === 'default' ? 'active' : ''}`} onClick={() => setViewSize('default')}>
                                <i className="bi bi-window"></i>
                            </button>
                            <button className={`size-btn ${viewSize === 'wide' ? 'active' : ''}`} onClick={() => setViewSize('wide')}>
                                <i className="bi bi-aspect-ratio"></i>
                            </button>
                            <button className={`size-btn ${viewSize === 'fullscreen' ? 'active' : ''}`} onClick={() => setViewSize('fullscreen')}>
                                <i className="bi bi-arrows-fullscreen"></i>
                            </button>
                        </div>
                        <button className="modal-close" onClick={onClose} aria-label={t("notes.modal.closeView")}>
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
                                        {t(`tags.${tag.label.toLowerCase()}`)}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                    <button type="button" className="btn-close-view" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                        {t("notes.modal.closeView")}
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
                        
                        aria-label={t("notes.cropImage")}
                    >
                        <svg className="yarl__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z" />
                        </svg>
                    </button>,
                    <button 
                        key="doodle" 
                        type="button" 
                        className="yarl__button" 
                        onClick={() => setDoodleImageSrc(lightboxSlides[lightboxIndex]?.src)} 
                        
                        aria-label={t("notes.drawOnImage")}
                    >
                        <svg className="yarl__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.995.995 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                    </button>,
                    <button 
                        key="download" 
                        type="button" 
                        className="yarl__button" 
                        onClick={handleDownloadImage} 
                        
                        aria-label={t("notes.downloadImage")}
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
        {cropImageSrc && <ImageCropModal imageSrc={cropImageSrc} onClose={() => setCropImageSrc(null)} onUpdateImage={handleUpdateImage} />}
        {doodleImageSrc && <DoodleModal imageSrc={doodleImageSrc} onClose={() => setDoodleImageSrc(null)} onUpdateImage={handleUpdateImage} />}
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
    const [showWebcamModal, setShowWebcamModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    // Image Delete Overlay State
    const [hoveredImgNode, setHoveredImgNode] = useState(null);
    const [overlayPos, setOverlayPos] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const overlayRef = useRef(null);
    
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

    const insertBase64ToEditor = (base64) => {
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            const range = editor.getSelection(true);
            const index = range ? range.index : 0;
            editor.insertEmbed(index, 'image', base64);
            editor.insertText(index + 1, '\n');
            if (range) editor.setSelection(index + 2);
        }
    };

    const handleWebcamCapture = async (dataUrl) => {
        setIsUploading(true);
        try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });
            const compressed = await compressImage(file);
            const url = await uploadToCloudinary(compressed);
            insertBase64ToEditor(url);
        } catch (e) {
            console.error("Webcam upload failed", e);
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditorInteract = (e) => {
        if (e.target.tagName === 'IMG') {
            const rect = e.target.getBoundingClientRect();
            
            const editorNode = quillWrapperRef.current?.querySelector('.ql-editor');
            if (editorNode) {
                const editorRect = editorNode.getBoundingClientRect();
                // Strict Boundary Check: If image top is hidden under toolbar, ignore hover
                if (rect.top < editorRect.top) {
                    setHoveredImgNode(null);
                    return;
                }
            }
            
            setHoveredImgNode(e.target);
            setOverlayPos({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
        } else if (!e.target.closest('.image-delete-overlay') && !e.target.closest('.image-delete-btn')) {
            setHoveredImgNode(null);
        }
    };

    const handleRemoveHoveredImage = (e) => {
        e.stopPropagation();
        if (quillRef.current && hoveredImgNode) {
            const editor = quillRef.current.getEditor();
            const blot = Quill.find(hoveredImgNode);
            if (blot) {
                const index = editor.getIndex(blot);
                if (index !== null && index !== undefined) {
                    editor.deleteText(index, 1, 'user');
                }
            }
        }
        setHoveredImgNode(null);
    };

    useEffect(() => {
        const handleScroll = (e) => {
            // Only clear if the scroll originated from inside the editor or modal
            if (e.target.closest && (e.target.closest('.ql-editor') || e.target.closest('.modal-body'))) {
                setHoveredImgNode(null);
            }
        };
        document.addEventListener('scroll', handleScroll, true); // true is CRITICAL for capture phase
        return () => document.removeEventListener('scroll', handleScroll, true);
    }, []);

    const handleDesktopCameraSelect = () => {
        setShowImageMenu(false);
        setShowWebcamModal(true);
    };

    const handleGallerySelect = async (e) => {
        const files = Array.from(e.target.files);
        setIsUploading(true);
        try {
            for (const file of files) {
                const compressed = await compressImage(file);
                const url = await uploadToCloudinary(compressed);
                insertBase64ToEditor(url);
            }
        } catch (e) {
            console.error("Gallery upload failed", e);
        } finally {
            setIsUploading(false);
            setShowImageMenu(false);
        }
    };

    const handleCameraSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const compressed = await compressImage(file);
            const url = await uploadToCloudinary(compressed);
            insertBase64ToEditor(url);
        } catch (e) {
            console.error("Camera upload failed", e);
        } finally {
            setIsUploading(false);
            setShowImageMenu(false);
        }
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
            setContent("");
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
                        {editingNote ? t("notes.modal.editNote") : t("notes.modal.createNewNote")}
                    </h2>
                    <button type="button" className="modal-close" onClick={handleClose} data-tooltip-id="global-tooltip" data-tooltip-content={t("notes.closeEsc")}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>{t("notes.modal.titleLabel")}</label>
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
                            placeholder={t("notes.modal.titlePlaceholder")}
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
                        onClick={handleEditorInteract}
                        onMouseOver={handleEditorInteract}
                    >
                        <label className="form-label">{t("notes.modal.contentLabel")}</label>
                        <ReactQuill 
                            ref={quillRef}
                            theme="snow" 
                            value={content} 
                            onChange={setContent} 
                            modules={quillModules}
                            placeholder={t("notes.modal.contentPlaceholder")}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t("notes.modal.tagLabel")}</label>
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
                                    {t(`tags.${tag.label.toLowerCase()}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={handleClose}>
                        {t("common.cancel")}
                    </button>
                    <button id="global-save-note-btn" type="submit" className="btn-save" disabled={isButtonDisabled} data-tooltip-id="global-tooltip" data-tooltip-content={t("notes.saveNoteCtrlEnter")}>
                        <i className={`bi ${editingNote ? 'bi-check-lg' : 'bi-plus-lg'}`}></i>
                        {editingNote ? t("notes.modal.updateNote") : t("notes.modal.createNote")}
                    </button>
                </div>
            </form>
            
            <ImageInputMenu 
                isOpen={showImageMenu} 
                onClose={() => setShowImageMenu(false)} 
                onGallerySelect={handleGallerySelect} 
                onCameraSelect={handleCameraSelect}
                onDesktopCameraSelect={handleDesktopCameraSelect} 
                isUploading={isUploading}
            />
            
            {showWebcamModal && (
                <WebcamCaptureModal 
                    onClose={() => setShowWebcamModal(false)} 
                    onCapture={handleWebcamCapture} 
                />
            )}
            
            {hoveredImgNode && createPortal(
                <div 
                    ref={overlayRef}
                    className="image-delete-overlay"
                    style={{
                        position: 'fixed',
                        top: overlayPos.top,
                        left: overlayPos.left,
                        width: overlayPos.width,
                        height: overlayPos.height,
                        pointerEvents: 'none',
                        zIndex: 10000,
                        transition: 'opacity 0.1s ease',
                    }}
                >
                    <button
                        type="button"
                        className="image-delete-btn"
                        onClick={handleRemoveHoveredImage}
                        title={t("notes.deleteImage")}
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>,
                document.body
            )}
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