import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Notification } from '../types';
import '../styles/NotificationPanel.css';

interface NotificationPanelProps {
    onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await api.get('/notifications?limit=10');
            setNotifications(response.data.notifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const getSeverityClass = (severity: string) => {
        switch (severity) {
            case 'critical': return 'notification-critical';
            case 'warning': return 'notification-warning';
            default: return 'notification-info';
        }
    };

    return (
        <div className="notification-panel">
            <div className="notification-header">
                <h3>Notifications</h3>
                <button onClick={onClose} className="close-btn">✕</button>
            </div>

            <div className="notification-list">
                {loading ? (
                    <div className="notification-loading">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="notification-empty">No notifications</div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`notification-item ${getSeverityClass(notification.severity)} ${notification.is_read ? 'read' : 'unread'}`}
                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                        >
                            <div className="notification-title">{notification.title}</div>
                            <div className="notification-message">{notification.message}</div>
                            <div className="notification-time">
                                {new Date(notification.created_at).toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;
