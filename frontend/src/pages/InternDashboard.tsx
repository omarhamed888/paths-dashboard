import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import '../styles/Dashboard.css';

interface InternDashboardData {
    tasks: any[];
    attendance: any;
    recentRatings: any[];
    notifications: any[];
}

const InternDashboard: React.FC = () => {
    const [data, setData] = useState<InternDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await api.get('/dashboard/intern');
            setData(response.data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="dashboard-loading">Loading dashboard...</div>;
    }

    if (!data) {
        return <div className="dashboard-error">Failed to load dashboard data</div>;
    }

    const attendanceRate = data.attendance.total_days > 0
        ? ((data.attendance.present_days / data.attendance.total_days) * 100).toFixed(1)
        : 0;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>My Dashboard</h1>
                <p>Track your tasks, attendance, and performance</p>
            </div>

            <div className="kpi-grid grid grid-cols-3">
                <div className="kpi-card card">
                    <div className="kpi-icon">📋</div>
                    <div className="kpi-value">{data.tasks.length}</div>
                    <div className="kpi-label">Assigned Tasks</div>
                </div>

                <div className="kpi-card card kpi-success">
                    <div className="kpi-icon">✅</div>
                    <div className="kpi-value">{attendanceRate}%</div>
                    <div className="kpi-label">Attendance Rate</div>
                </div>

                <div className="kpi-card card">
                    <div className="kpi-icon">⭐</div>
                    <div className="kpi-value">
                        {data.recentRatings.length > 0
                            ? (data.recentRatings.reduce((sum, r) => sum + r.rating, 0) / data.recentRatings.length).toFixed(1)
                            : 'N/A'}
                    </div>
                    <div className="kpi-label">Average Rating</div>
                </div>
            </div>

            <div className="dashboard-content grid grid-cols-2">
                <div className="card">
                    <div className="card-header">
                        <h3>My Tasks</h3>
                    </div>
                    <div className="tasks-list">
                        {data.tasks.length === 0 ? (
                            <div className="empty-state">No tasks assigned</div>
                        ) : (
                            data.tasks.map((task) => {
                                const isOverdue = new Date(task.deadline) < new Date() && task.status === 'assigned';
                                return (
                                    <div key={task.id} className="task-item">
                                        <div className="task-info">
                                            <div className="task-title">{task.title}</div>
                                            <div className="task-deadline">
                                                Due: {new Date(task.deadline).toLocaleDateString()}
                                                {isOverdue && <span className="badge badge-error ml-2">Overdue</span>}
                                            </div>
                                        </div>
                                        <div className="task-status">
                                            {task.status === 'assigned' && <span className="badge badge-neutral">Pending</span>}
                                            {task.status === 'submitted' && <span className="badge badge-success">Submitted</span>}
                                            {task.status === 'late' && <span className="badge badge-warning">Late</span>}
                                            {task.status === 'missed' && <span className="badge badge-error">Missed</span>}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>Recent Ratings</h3>
                    </div>
                    <div className="ratings-list">
                        {data.recentRatings.length === 0 ? (
                            <div className="empty-state">No ratings yet</div>
                        ) : (
                            data.recentRatings.map((rating, index) => (
                                <div key={index} className="rating-item">
                                    <div className="rating-task">{rating.task_title}</div>
                                    <div className="rating-stars">
                                        {'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}
                                    </div>
                                    {rating.feedback && (
                                        <div className="rating-feedback">{rating.feedback}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {data.notifications.length > 0 && (
                <div className="card mt-6">
                    <div className="card-header">
                        <h3>Unread Notifications</h3>
                    </div>
                    <div className="notifications-list">
                        {data.notifications.slice(0, 5).map((notif) => (
                            <div key={notif.id} className={`notification-brief notification-${notif.severity}`}>
                                <strong>{notif.title}</strong> - {notif.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InternDashboard;
