import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setShortcutModalOpen } from '../../App/store/notesSlice';
import { useTranslation } from 'react-i18next';
import './ShortcutModal.css';

const ShortcutModal = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { isShortcutModalOpen } = useSelector((state) => state.notes);

    // Global listener for toggling the modal
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Check for Shift + / (?) or Ctrl + /
            if (
                (e.key === '?' && e.shiftKey) || 
                (e.key === '/' && (e.ctrlKey || e.metaKey))
            ) {
                const activeTag = document.activeElement?.tagName;
                const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable;
                
                if (!isTyping) {
                    e.preventDefault();
                    dispatch(setShortcutModalOpen(!isShortcutModalOpen));
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isShortcutModalOpen, dispatch]);

    if (!isShortcutModalOpen) return null;

    const closeShortcutModal = () => {
        dispatch(setShortcutModalOpen(false));
    };

    return (
        <div className="shortcut-modal-overlay" onClick={closeShortcutModal}>
            <div className="shortcut-modal" onClick={(e) => e.stopPropagation()}>
                <div className="shortcut-modal-header">
                    <h2>
                        <i className="bi bi-keyboard"></i>
                        {t('Keyboard Shortcuts')}
                    </h2>
                    <button className="btn-close-shortcut" onClick={closeShortcutModal} data-tooltip-id="global-tooltip" data-tooltip-content={t('Close (Esc)')}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div className="shortcut-modal-body">
                    
                    <div className="shortcut-category">
                        <h3>{t('General')}</h3>
                        <div className="shortcut-list">
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t('Toggle Keyboard Shortcuts')}</span>
                                <div className="shortcut-keys">
                                    <kbd>?</kbd> {t('or')} <kbd>Ctrl</kbd> + <kbd>/</kbd>
                                </div>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t('Toggle Sidebar')}</span>
                                <div className="shortcut-keys">
                                    <kbd>Ctrl</kbd> + <kbd>\</kbd>
                                </div>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t('Close Modals / Clear Focus')}</span>
                                <div className="shortcut-keys">
                                    <kbd>Esc</kbd>
                                </div>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t('Confirm Delete or Logout')}</span>
                                <div className="shortcut-keys">
                                    <kbd>Enter</kbd>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="shortcut-category">
                        <h3>{t('Note Actions')}</h3>
                        <div className="shortcut-list">
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t('New Note')}</span>
                                <div className="shortcut-keys">
                                    <kbd>Ctrl</kbd> + <kbd>N</kbd>
                                </div>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t('Save Note')}</span>
                                <div className="shortcut-keys">
                                    <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
                                </div>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t('Open Selected Note')}</span>
                                <div className="shortcut-keys">
                                    <kbd>Enter</kbd>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="shortcut-category">
                        <h3>{t('Selection')}</h3>
                        <div className="shortcut-list">
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t('Multi-select (Range)')}</span>
                                <div className="shortcut-keys">
                                    <kbd>Shift</kbd> + <kbd>Click</kbd>
                                </div>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t('Select All Visible')}</span>
                                <div className="shortcut-keys">
                                    <kbd>Ctrl</kbd> + <kbd>A</kbd>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ShortcutModal;
