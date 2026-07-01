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
                    <div>
                        <h2>
                            <i className="bi bi-keyboard"></i>
                            {t("common.keyboardShortcuts")}
                        </h2>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.5rem 0 0 0', fontWeight: 'normal', maxWidth: '90%', lineHeight: '1.4' }}>
                            {t("shortcuts.mobileNote")}
                        </p>
                    </div>
                    <button className="btn-close-shortcut" onClick={closeShortcutModal} data-tooltip-id="global-tooltip" data-tooltip-content={t("common.closeEsc")}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div className="shortcut-modal-body">
                    
                    <div className="shortcut-category">
                        <h3>{t("common.general")}</h3>
                        <div className="shortcut-list">
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t("common.toggleKeyboardShortc")}</span>
                                <div className="shortcut-keys">
                                    <kbd>?</kbd> {t("common.or")} <kbd>Ctrl</kbd> + <kbd>/</kbd>
                                </div>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t("common.toggleSidebar")}</span>
                                <div className="shortcut-keys">
                                    <kbd>Ctrl</kbd> + <kbd>\</kbd>
                                </div>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t("common.closeModalsClearFocu")}</span>
                                <div className="shortcut-keys">
                                    <kbd>Esc</kbd>
                                </div>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t("common.confirmDeleteOrLogou")}</span>
                                <div className="shortcut-keys">
                                    <kbd>Enter</kbd>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="shortcut-category">
                        <h3>{t("common.noteActions")}</h3>
                        <div className="shortcut-list">
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t("notes.sidebar.newNote")}</span>
                                <div className="shortcut-keys">
                                    <kbd>Ctrl</kbd> + <kbd>N</kbd>
                                </div>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t("common.saveNote")}</span>
                                <div className="shortcut-keys">
                                    <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
                                </div>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t("common.openSelectedNote")}</span>
                                <div className="shortcut-keys">
                                    <kbd>Enter</kbd>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="shortcut-category">
                        <h3>{t("common.selection")}</h3>
                        <div className="shortcut-list">
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t("common.multiSelectRange")}</span>
                                <div className="shortcut-keys">
                                    <kbd>Shift</kbd> + <kbd>Click</kbd>
                                </div>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-desc">{t("common.selectAllVisible")}</span>
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
