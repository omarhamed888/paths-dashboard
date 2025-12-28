import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import '../styles/ProfilePage.css';

const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        department: ''
    });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await api.get('/users/profile');
            setProfile(response.data);
            setFormData({
                full_name: response.data.user.full_name || '',
                bio: response.data.user.bio || '',
                department: response.data.user.department || ''
            });
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handlePhotoUpload = async () => {
        if (!photoFile) return;

        try {
            const data = new FormData();
            data.append('photo', photoFile);

            await api.post('/users/profile/photo', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('Photo uploaded successfully!');
            setPhotoPreview(null);
            setPhotoFile(null);
            loadProfile();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to upload photo');
        }
    };

    const handleUpdateProfile = async () => {
        try {
            await api.put('/users/profile', formData);
            alert('Profile updated successfully!');
            setEditing(false);
            loadProfile();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to update profile');
        }
    };

    if (loading) return <div className="card">Loading profile...</div>;
    if (!profile) return <div className="card">Profile not found</div>;

    const stats = profile.stats || {};
    const userInfo = profile.user;

    return (
        <div className="profile-container">
            {/* Cover Photo */}
            <div className="profile-cover">
                <div className="cover-gradient"></div>
            </div>

            {/* Profile Header */}
            <div className="profile-header">
                <div className="profile-avatar-section">
                    <div className="profile-avatar">
                        {photoPreview ? (
                            <img src={photoPreview} alt="Preview" />
                        ) : userInfo.profile_photo_url ? (
                            <img src={userInfo.profile_photo_url} alt={userInfo.full_name} />
                        ) : (
                            <div className="avatar-placeholder">{userInfo.full_name?.charAt(0)}</div>
                        )}
                        <label className="avatar-upload-btn">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoSelect}
                                style={{ display: 'none' }}
                            />
                            <svg viewBox="0 0 24 24" fill="white" className="upload-icon">
                                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                            </svg>
                        </label>
                    </div>
                    {photoFile && (
                        <div className="photo-actions">
                            <button onClick={handlePhotoUpload} className="btn btn-primary btn-sm">
                                Upload Photo
                            </button>
                            <button
                                onClick={() => {
                                    setPhotoFile(null);
                                    setPhotoPreview(null);
                                }}
                                className="btn btn-secondary btn-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                <div className="profile-info">
                    {editing ? (
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="profile-name-input"
                        />
                    ) : (
                        <h1 className="profile-name">{userInfo.full_name}</h1>
                    )}
                    <div className="profile-meta">
                        <span className="profile-email">✉️ {userInfo.email}</span>
                        <span className={`profile-role badge badge-${userInfo.role === 'admin' ? 'primary' : 'info'}`}>
                            {userInfo.role}
                        </span>
                        {userInfo.department && <span className="profile-department">🏢 {userInfo.department}</span>}
                    </div>
                </div>

                <div className="profile-actions">
                    {editing ? (
                        <>
                            <button onClick={handleUpdateProfile} className="btn btn-primary">
                                Save Changes
                            </button>
                            <button onClick={() => setEditing(false)} className="btn btn-secondary">
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setEditing(true)} className="btn btn-primary">
                            <svg viewBox="0 0 24 24" fill="white" className="btn-icon">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            </svg>
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {/* Profile Content */}
            <div className="profile-content">
                <div className="profile-main">
                    <div className="card">
                        <h3>About</h3>
                        {editing ? (
                            <textarea
                                rows={4}
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                            />
                        ) : (
                            <p className="profile-bio">
                                {userInfo.bio || 'No bio added yet.'}
                            </p>
                        )}
                    </div>

                    {editing && (
                        <div className="card">
                            <h3>Department</h3>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                placeholder="Enter department"
                            />
                        </div>
                    )}

                    {userInfo.role === 'intern' && stats.attendance && (
                        <div className="card">
                            <h3>Activity Timeline</h3>
                            <div className="timeline">
                                <p className="timeline-item">📅 Joined on {new Date(userInfo.created_at).toLocaleDateString()}</p>
                                <p className="timeline-item">✅ {stats.attendance.present_days || 0} days present</p>
                                <p className="timeline-item">📝 {stats.tasks?.submitted || 0} tasks completed</p>
                            </div>
                        </div>
                    )}
                </div>

                {userInfo.role === 'intern' && (
                    <div className="profile-sidebar">
                        <div className="card stats-card">
                            <h3>📊 Statistics</h3>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <div className="stat-value">{stats.attendance?.total_days || 0}</div>
                                    <div className="stat-label">Total Days</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-value">{stats.attendance?.present_days || 0}</div>
                                    <div className="stat-label">Present</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-value">{stats.tasks?.total_assignments || 0}</div>
                                    <div className="stat-label">Tasks Assigned</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-value">{stats.tasks?.submitted || 0}</div>
                                    <div className="stat-label">Completed</div>
                                </div>
                            </div>
                        </div>

                        {stats.avgRating && (
                            <div className="card">
                                <h3>⭐ Performance</h3>
                                <div className="rating-display">
                                    <span className="rating-value">{stats.avgRating}</span>
                                    <span className="rating-max">/ 5.0</span>
                                </div>
                                <div className="rating-stars">
                                    {'★'.repeat(Math.round(stats.avgRating))}{'☆'.repeat(5 - Math.round(stats.avgRating))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
