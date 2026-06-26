import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import { logout, updateUserProfile } from '../../App/store/authSlice';
import Lightbox from '../common/Lightbox';
import './Settings.css';

const Settings = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
    const fileInputRef = React.useRef(null);

    const [formData, setFormData] = React.useState({
        name: user?.name || '',
        email: user?.email || '',
        birthdate: user?.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : ''
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isFormChanged = 
        formData.name !== (user?.name || '') ||
        formData.email !== (user?.email || '') ||
        formData.birthdate !== (user?.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : '');

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            await dispatch(updateUserProfile(formData)).unwrap();
            toast.success(t("Profile updated successfully!"));
            setIsEditMode(false);
        } catch (error) {
            toast.error(t(error || "Failed to update profile"));
        }
    };

    const handleCancelEdit = () => {
        setFormData({
            name: user?.name || '',
            email: user?.email || '',
            birthdate: user?.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : ''
        });
        setIsEditMode(false);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('upload_preset', 'profile_uploads');
            
            try {
                const response = await axios.post('https://api.cloudinary.com/v1_1/daiusa7bt/image/upload', uploadData);
                const secure_url = response.data.secure_url;
                
                await dispatch(updateUserProfile({ avatarUrl: secure_url })).unwrap();
                toast.success(t('Profile updated successfully!'));
            } catch (error) {
                toast.error(t('Failed to upload image'));
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = null;
            }
        }
    };

    const handleRemoveAvatar = async () => {
        setIsAvatarModalOpen(false);
        try {
            await dispatch(updateUserProfile({ avatarUrl: '' })).unwrap();
            toast.success(t('Profile picture removed!'));
        } catch (error) {
            toast.error(t('Failed to remove image'));
        }
    };

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = React.useCallback(() => {
        dispatch(logout());
        navigate('/');
    }, [dispatch, navigate]);

    React.useEffect(() => {
        const handleSettingsKeyDown = (e) => {
            if (e.key === 'Enter' && isLogoutModalOpen) {
                e.preventDefault();
                confirmLogout();
            }
        };

        window.addEventListener('keydown', handleSettingsKeyDown);
        return () => window.removeEventListener('keydown', handleSettingsKeyDown);
    }, [isLogoutModalOpen, confirmLogout]);

    return (
        <div className="settings-page">
            <div className="settings-header">
                <button className="back-btn" onClick={() => navigate('/notes')}>
                    <i className="bi bi-arrow-left"></i>
                    <span>{t('Back to Notes')}</span>
                </button>
                <h1 className="page-title">{t('Account Profile')}</h1>
            </div>

            <div className="settings-content">
                {/* Account Details */}
                <section className="settings-section">
                    <h2 className="section-title">{t('Account Details')}</h2>
                    <div className="settings-card">
                        <div className="account-card-header">
                            <div 
                                className={`account-avatar ${user?.avatarUrl ? '' : 'initials-avatar-large'} avatar-lightbox-trigger`}
                                onClick={() => setIsLightboxOpen(true)}
                            >
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Avatar" className="avatar-image" />
                                ) : (
                                    user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
                            <div className="account-info">
                                <h3>{user?.name || 'User'}</h3>
                                <p>{user?.email || 'email@example.com'}</p>
                                <button className="btn-text-edit-avatar" onClick={() => setIsAvatarModalOpen(true)}>
                                    {t('Change Picture')}
                                </button>
                            </div>
                        </div>

                        {!isEditMode ? (
                            <div className="profile-readonly">
                                <div className="profile-data-row">
                                    <span className="profile-data-label">{t('Full Name')}</span>
                                    <span className="profile-data-value">{user?.name || '—'}</span>
                                </div>
                                <div className="profile-data-row">
                                    <span className="profile-data-label">{t('Email')}</span>
                                    <span className="profile-data-value">{user?.email || '—'}</span>
                                </div>
                                <div className="profile-data-row">
                                    <span className="profile-data-label">{t('Birthdate')}</span>
                                    <span className="profile-data-value">
                                        {user?.birthdate ? new Date(user.birthdate).toLocaleDateString() : '—'}
                                    </span>
                                </div>
                                <button className="btn-edit-profile mt-3" onClick={() => setIsEditMode(true)}>
                                    <i className="bi bi-pencil"></i> {t('Edit Profile')}
                                </button>
                            </div>
                        ) : (
                            <form className="profile-form" onSubmit={handleSaveProfile}>
                                <div className="form-group">
                                    <label className="form-label">{t('Full Name')}</label>
                                    <input type="text" name="name" className="form-input" value={formData.name} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('Email')}</label>
                                    <input type="email" name="email" className="form-input" value={formData.email} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('Birthdate')}</label>
                                    <input type="date" name="birthdate" className="form-input" value={formData.birthdate} onChange={handleInputChange} />
                                </div>
                                <div className="form-actions mt-3">
                                    <button type="submit" className="btn-save" disabled={!isFormChanged}>
                                        <i className="bi bi-check2"></i> {t('Save Changes')}
                                    </button>
                                    <button type="button" className="btn-cancel" onClick={handleCancelEdit}>
                                        {t('Cancel')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </section>

                {/* Subscription */}
                <section className="settings-section">
                    <h2 className="section-title">{t('Subscription')}</h2>
                    <div className="settings-card subscription-card">
                        <div className="subscription-header">
                            <i className="bi bi-star text-muted"></i>
                            <h3>{t('Current Plan')}</h3>
                        </div>
                        <div className="subscription-body">
                            <p>{t('Free Plan')}</p>
                            <button className="btn-upgrade">{t('Upgrade to Pro')}</button>
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="settings-section danger-zone">
                    <h2 className="section-title text-danger">{t('Danger Zone')}</h2>
                    <div className="settings-card danger-card">
                        <p>{t('Logout')}</p>
                        <button className="btn-logout" onClick={handleLogoutClick}>
                            <i className="bi bi-box-arrow-right"></i>
                            {t('Logout')}
                        </button>
                    </div>
                </section>
            </div>

            {isLogoutModalOpen && (
                <div className="logout-modal-overlay">
                    <div className="logout-modal">
                        <div className="logout-modal-icon">
                            <i className="bi bi-box-arrow-right"></i>
                        </div>
                        <h3>{t('Leaving so soon?')}</h3>
                        <p>{t('We will keep your notes safe and sound until you return. Are you sure you want to sign out?')}</p>
                        <div className="logout-modal-actions">
                            <button className="btn-modal-cancel" onClick={() => setIsLogoutModalOpen(false)}>
                                {t('Cancel')}
                            </button>
                            <button className="btn-modal-confirm" onClick={confirmLogout} data-tooltip-id="global-tooltip" data-tooltip-content={t('Confirm (Enter)')}>
                                {t('Confirm Logout')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAvatarModalOpen && (
                <div className="logout-modal-overlay" onClick={() => setIsAvatarModalOpen(false)}>
                    <div className="logout-modal avatar-options-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-icon" onClick={() => setIsAvatarModalOpen(false)} data-tooltip-id="global-tooltip" data-tooltip-content={t('Close (Esc)')}>
                            <i className="bi bi-x-lg"></i>
                        </button>

                        <div className={`modal-avatar-preview ${user?.avatarUrl ? '' : 'initials-avatar-large'}`}>
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar Preview" className="avatar-image" />
                            ) : (
                                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                            )}
                        </div>

                        <h3>{t('Profile Picture')}</h3>
                        <p>{t('A picture helps people recognize you and lets you know when you\'re signed in to your account.')}</p>
                        
                        <div className="avatar-modal-options">
                            <button 
                                className="btn-avatar-option btn-avatar-upload" 
                                onClick={() => {
                                    setIsAvatarModalOpen(false);
                                    fileInputRef.current?.click();
                                }}
                            >
                                <i className="bi bi-upload"></i>
                                {t('Upload from Device')}
                            </button>
                            {user?.avatarUrl && (
                                <button className="btn-avatar-option btn-avatar-remove" onClick={handleRemoveAvatar}>
                                    <i className="bi bi-trash3"></i>
                                    {t('Remove Picture')}
                                </button>
                            )}
                            <button className="btn-avatar-option btn-avatar-cancel" onClick={() => setIsAvatarModalOpen(false)}>
                                {t('Cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLightboxOpen && (
                <Lightbox onClose={() => setIsLightboxOpen(false)}>
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Full Profile" className="lightbox-image" />
                    ) : (
                        <div className="lightbox-initials">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    )}
                </Lightbox>
            )}
        </div>
    );
};

export default Settings;
