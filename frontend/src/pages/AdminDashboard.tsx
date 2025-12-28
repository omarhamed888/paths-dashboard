import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import '../styles/Dashboard.css';
import '../styles/SidePanel.css';

interface DashboardData {
    kpis: {
        totalInterns: number;
        internsAtRisk: number;
        overdueTasks: number;
        absenceAlerts: number;
    };
    recentSubmissions: any[];
    activeAlerts: any[];
}

const AdminDashboard: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [ratingPanel, setRatingPanel] = useState<{ show: boolean; submissionId: string | null }>({
        show: false,
        submissionId: null
    });
    const [isClosing, setIsClosing] = useState(false);
    const [rating, setRating] = useState(5);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await api.get('/dashboard/admin');
            setData(response.data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (submissionId: string) => {
        try {
            const response = await api.get(`/tasks/download/${submissionId}`, {
                responseType: 'blob'
            });

            const contentDisposition = response.headers['content-disposition'];
            let filename = 'submission.zip';
            if (contentDisposition) {
                const matches = /filename="([^"]+)"/.exec(contentDisposition);
                if (matches && matches[1]) {
                    filename = matches[1];
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to download file');
        }
    };

    const handleOpenRatingPanel = (submissionId: string) => {
        setRatingPanel({ show: true, submissionId });
        setIsClosing(false);
        setRating(5);
        setFeedback('');
    };

    const closePanel = () => {
        setIsClosing(true);
        setTimeout(() => {
            setRatingPanel({ show: false, submissionId: null });
            setIsClosing(false);
        }, 200); // Match animation duration
    };

    const handleSubmitRating = async () => {
        if (!ratingPanel.submissionId) return;

        try {
            await api.post(`/tasks/rate/${ratingPanel.submissionId}`, {
                rating,
                feedback
            });

            alert('Rating submitted successfully!');
            setRatingPanel({ show: false, submissionId: null });
            loadDashboard();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to submit rating');
        }
    };

    if (loading) {
        return <div className="dashboard-loading">Loading dashboard...</div>;
    }

    if (!data) {
        return <div className="dashboard-error">Failed to load dashboard data</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Admin Dashboard - Paths4 AI</h1>
                <p>Monitor interns, track performance, and manage tasks</p>
            </div>

            <div className="kpi-grid grid grid-cols-4">
                <div className="kpi-card card">
                    <div className="kpi-icon">👥</div>
                    <div className="kpi-value">{data.kpis.totalInterns}</div>
                    <div className="kpi-label">Total Interns</div>
                </div>

                <div className="kpi-card card kpi-warning">
                    <div className="kpi-icon">⚠️</div>
                    <div className="kpi-value">{data.kpis.internsAtRisk}</div>
                    <div className="kpi-label">Interns at Risk</div>
                </div>

                <div className="kpi-card card kpi-error">
                    <div className="kpi-icon">📅</div>
                    <div className="kpi-value">{data.kpis.overdueTasks}</div>
                    <div className="kpi-label">Overdue Tasks</div>
                </div>

                <div className="kpi-card card kpi-critical">
                    <div className="kpi-icon">🚨</div>
                    <div className="kpi-value">{data.kpis.absenceAlerts}</div>
                    <div className="kpi-label">Absence Alerts</div>
                </div>
            </div>

            <div className="dashboard-content grid grid-cols-2">
                <div className="card">
                    <div className="card-header">
                        <h3>Recent Submissions</h3>
                    </div>
                    <div className="submissions-list">
                        {data.recentSubmissions.length === 0 ? (
                            <div className="empty-state">No recent submissions</div>
                        ) : (
                            data.recentSubmissions.map((submission) => (
                                <div key={submission.id} className="submission-item">
                                    <div className="submission-info">
                                        <div className="submission-title">{submission.task_title}</div>
                                        <div className="submission-meta">
                                            by {submission.intern_name} • {new Date(submission.submitted_at).toLocaleDateString()}
                                            {submission.is_late && <span className="badge badge-warning ml-2">Late</span>}
                                        </div>
                                    </div>
                                    <div className="submission-actions">
                                        {submission.rating ? (
                                            <div className="submission-rating">
                                                {'★'.repeat(submission.rating)}{'☆'.repeat(5 - submission.rating)}
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleDownload(submission.id)}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    📥 Download
                                                </button>
                                                <button
                                                    onClick={() => handleOpenRatingPanel(submission.id)}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    ⭐ Rate
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>Active Alerts</h3>
                    </div>
                    <div className="alerts-list">
                        {data.activeAlerts.length === 0 ? (
                            <div className="empty-state">No active alerts</div>
                        ) : (
                            data.activeAlerts.map((alert) => (
                                <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
                                    <div className="alert-icon">
                                        {alert.severity === 'critical' && '🚨'}
                                        {alert.severity === 'warning' && '⚠️'}
                                        {alert.severity === 'info' && 'ℹ️'}
                                    </div>
                                    <div className="alert-content">
                                        <div className="alert-title">{alert.title}</div>
                                        <div className="alert-message">{alert.message}</div>
                                        <div className="alert-user">For: {alert.user_name}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Professional Side Panel for Rating */}
            {ratingPanel.show && (
                <>
                    <div className={`panel-overlay ${isClosing ? 'closing' : ''}`} onClick={closePanel} />
                    <div className={`side-panel ${isClosing ? 'closing' : ''}`}>
                        <div className="panel-header">
                            <h3>Rate Submission</h3>
                            <button
                                className="panel-close"
                                onClick={closePanel}
                            >
                                ×
                            </button>
                        </div>

                        <div className="panel-body">
                            <div className="form-group">
                                <label>Rating (1-5 stars)</label>
                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star}
                                            className={`star ${rating >= star ? 'active' : ''}`}
                                            onClick={() => setRating(star)}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Feedback (optional)</label>
                                <textarea
                                    rows={6}
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Provide constructive feedback on the submission quality, completeness, and areas for improvement..."
                                />
                            </div>
                        </div>

                        <div className="panel-footer">
                            <button
                                onClick={closePanel}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button onClick={handleSubmitRating} className="btn btn-primary">
                                Submit Rating
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
