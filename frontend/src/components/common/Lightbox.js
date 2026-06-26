import React, { useEffect } from 'react';
import './Lightbox.css';

const Lightbox = ({ src, alt, onClose, children }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!src && !children) return null;

    return (
        <div className="lightbox-overlay-reusable" onClick={onClose}>
            <button className="lightbox-close-reusable" onClick={onClose} data-tooltip-id="global-tooltip" data-tooltip-content="Close (Esc)">
                <i className="bi bi-x-lg"></i>
            </button>
            <div className="lightbox-content-reusable" onClick={(e) => e.stopPropagation()}>
                {src ? (
                    <img src={src} alt={alt || "Lightbox image"} className="lightbox-image-reusable" />
                ) : (
                    children
                )}
            </div>
        </div>
    );
};

export default Lightbox;
