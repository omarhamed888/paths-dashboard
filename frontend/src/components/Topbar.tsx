import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/Topbar.css';

interface Notification {
    id: string;
    type: string;
    message: string;
    severity: string;
    created_at: string;
    is_read: boolean;
}

const Topbar: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        loadNotifications();
        // Refresh notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);

        // Listen for updates from other components
        const handleUpdate = () => loadNotifications();
        window.addEventListener('notificationUpdate', handleUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('notificationUpdate', handleUpdate);
        };
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await api.get('/notifications?limit=5');
            setNotifications(response.data.notifications);

            const countResponse = await api.get('/notifications/unread-count');
            console.log('Unread count:', countResponse.data.count);
            setUnreadCount(countResponse.data.count);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await api.put(`/notifications/${notificationId}/read`);
            loadNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleViewAll = () => {
        setShowDropdown(false);
        navigate('/notifications');
    };

    if (!user) return null;

    return (
        <div className="topbar">
            <div className="topbar-content">
                <h1 className="topbar-title">Intern Management System</h1>

                <div className="topbar-actions">
                    <div className="notification-container">
                        <button
                            className="notification-bell"
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="bell-icon">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </button>

                        {showDropdown && (
                            <>
                                <div className="dropdown-backdrop" onClick={() => setShowDropdown(false)}></div>
                                <div className="notification-dropdown">
                                    <div className="dropdown-header">
                                        <h3>Notifications</h3>
                                        {unreadCount > 0 && (
                                            <span className="unread-count">{unreadCount} unread</span>
                                        )}
                                    </div>

                                    <div className="notifications-list">
                                        {notifications.length === 0 ? (
                                            <div className="no-notifications">No notifications</div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div
                                                    key={notif.id}
                                                    className={`notification-item ${!notif.is_read ? 'unread' : ''} severity-${notif.severity}`}
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                >
                                                    <div className="notification-content">
                                                        <div className="notification-type">{notif.type}</div>
                                                        <div className="notification-message">{notif.message}</div>
                                                        <div className="notification-time">
                                                            {new Date(notif.created_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    {!notif.is_read && <div className="unread-dot"></div>}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {notifications.length > 0 && (
                                        <button className="view-all-btn" onClick={handleViewAll}>
                                            View All Notifications
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Topbar;
