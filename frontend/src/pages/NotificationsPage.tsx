import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import '../styles/Dashboard.css';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical' | 'success';
    created_at: string;
    is_read: boolean;
}

const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data.notifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.put('/notifications/mark-all-read');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            window.dispatchEvent(new Event('notificationUpdate'));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    if (loading) return <div className="loading-container">Loading notifications...</div>;

    return (
        <div className="container mt-6">
            <div className="flex justify-between items-center mb-6">
                <h1>Notifications</h1>
                {notifications.some(n => !n.is_read) && (
                    <button onClick={handleMarkAllAsRead} className="btn btn-secondary btn-sm">
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="card">
                <div className="notifications-list-full">
                    {notifications.length === 0 ? (
                        <div className="empty-state p-6 text-center text-gray-500">
                            No notifications found
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`notification-item-full ${!notif.is_read ? 'unread' : ''} severity-${notif.severity}`}
                                onClick={() => handleMarkAsRead(notif.id, notif.is_read)}
                            >
                                <div className="notification-icon">
                                    {notif.severity === 'critical' && '🚨'}
                                    {notif.severity === 'warning' && '⚠️'}
                                    {notif.severity === 'success' && '✅'}
                                    {notif.severity === 'info' && 'ℹ️'}
                                </div>
                                <div className="notification-content">
                                    <div className="flex justify-between items-start">
                                        <h3 className="notification-title">{notif.title}</h3>
                                        <span className="notification-time">
                                            {new Date(notif.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="notification-message">{notif.message}</p>
                                </div>
                                {!notif.is_read && <div className="unread-indicator" />}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
