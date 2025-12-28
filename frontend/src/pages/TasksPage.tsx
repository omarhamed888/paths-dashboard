import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/TasksPage.css';

interface Task {
    id: string;
    title: string;
    description: string;
    deadline: string;
    assigned_by?: string;
    assignment_status?: string;
    assignment_id?: string;
    created_at: string;
}

interface Intern {
    id: string;
    email: string;
    full_name: string;
}

const TasksPage: React.FC = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [interns, setInterns] = useState<Intern[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        deadline: ''
    });
    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
    const [submissionFile, setSubmissionFile] = useState<File | null>(null);

    useEffect(() => {
        loadTasks();
        if (user?.role === 'admin') {
            loadInterns();
        }
    }, [user]);

    const loadTasks = async () => {
        try {
            const response = await api.get('/tasks');
            setTasks(response.data.tasks || []);
        } catch (error) {
            console.error('Failed to load tasks:', error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const loadInterns = async () => {
        try {
            const response = await api.get('/users');
            setInterns(response.data.interns || []);
        } catch (error) {
            console.error('Failed to load interns:', error);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/tasks', formData);
            const taskId = response.data.task.id;

            // Assign to selected interns
            if (selectedInterns.length > 0) {
                await api.post(`/tasks/${taskId}/assign`, { intern_ids: selectedInterns });
            }

            alert('Task created and assigned successfully!');
            setShowCreateForm(false);
            setFormData({ title: '', description: '', deadline: '' });
            setSelectedInterns([]);
            loadTasks();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create task');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!window.confirm('Are you sure you want to delete this task? This cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/tasks/${taskId}`);
            alert('Task deleted successfully');
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (error: any) {
            console.error('Failed to delete task:', error);
            alert(error.response?.data?.error || 'Failed to delete task');
        }
    };

    const handleSubmitTask = async (assignmentId: string) => {
        if (!submissionFile) {
            alert('Please select a file to submit');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', submissionFile);

            await api.post(`/tasks/submit/${assignmentId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('Task submitted successfully!');
            setSubmissionFile(null);
            setSelectedTask(null);
            loadTasks();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to submit task');
        }
    };

    const toggleInternSelection = (internId: string) => {
        setSelectedInterns(prev =>
            prev.includes(internId)
                ? prev.filter(id => id !== internId)
                : [...prev, internId]
        );
    };

    if (loading) return <div className="card">Loading tasks...</div>;

    return (
        <div className="container">
            <div className="page-header">
                <h1>Tasks Management</h1>
                {user?.role === 'admin' && (
                    <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-primary">
                        {showCreateForm ? 'Cancel' : '+ Create Task'}
                    </button>
                )}
            </div>

            {showCreateForm && user?.role === 'admin' && (
                <div className="card mb-6">
                    <h3>Create New Task</h3>
                    <form onSubmit={handleCreateTask} className="task-form">
                        <div className="form-group">
                            <label>Task Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="Enter task title"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description *</label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                placeholder="Describe the task requirements"
                            />
                        </div>

                        <div className="form-group">
                            <label>Deadline *</label>
                            <input
                                type="datetime-local"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Assign to Interns</label>
                            <div className="intern-selection-header" style={{ marginBottom: '8px', display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedInterns(interns.map(i => i.id))}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '12px', padding: '2px 8px' }}
                                >
                                    Select All
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedInterns([])}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '12px', padding: '2px 8px' }}
                                >
                                    Deselect All
                                </button>
                            </div>
                            <div className="intern-selection">
                                {interns.map(intern => (
                                    <label key={intern.id} className="intern-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedInterns.includes(intern.id)}
                                            onChange={() => toggleInternSelection(intern.id)}
                                        />
                                        <span>{intern.full_name} ({intern.email})</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary">Create & Assign Task</button>
                    </form>
                </div>
            )}

            <div className="card">
                <h3>
                    {user?.role === 'admin' ? 'All Tasks' : 'My Tasks'} ({tasks.length})
                </h3>
                <div className="tasks-grid">
                    {tasks.length === 0 ? (
                        <div className="empty-state">No tasks available</div>
                    ) : (
                        tasks.map((task) => {
                            const isOverdue = new Date(task.deadline) < new Date() && task.assignment_status === 'assigned';
                            const showSubmit = user?.role === 'intern' && task.assignment_status === 'assigned';

                            return (
                                <div key={task.id} className="task-card">
                                    <div className="task-header">
                                        <h4>{task.title}</h4>
                                        {task.assignment_status && (
                                            <span className={`badge badge-${task.assignment_status === 'submitted' ? 'success' :
                                                task.assignment_status === 'late' ? 'warning' :
                                                    task.assignment_status === 'missed' ? 'error' : 'neutral'
                                                }`}>
                                                {task.assignment_status}
                                            </span>
                                        )}
                                    </div>

                                    <p className="task-description">{task.description}</p>

                                    <div className="task-meta">
                                        <div className="task-deadline">
                                            📅 Deadline: {new Date(task.deadline).toLocaleString()}
                                            {isOverdue && <span className="overdue-label">Overdue!</span>}
                                        </div>
                                        {user?.role === 'admin' && (
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="btn-delete"
                                                title="Delete Task"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                                </svg>
                                                Delete
                                            </button>
                                        )}
                                    </div>

                                    {showSubmit && (
                                        <div className="task-submit-section">
                                            {selectedTask === task.assignment_id ? (
                                                <div>
                                                    <input
                                                        type="file"
                                                        onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                                                        accept=".pdf,.zip,.docx,.doc,.txt"
                                                    />
                                                    <div className="submit-actions">
                                                        <button
                                                            onClick={() => handleSubmitTask(task.assignment_id!)}
                                                            className="btn btn-success btn-sm"
                                                            disabled={!submissionFile}
                                                        >
                                                            Upload & Submit
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTask(null);
                                                                setSubmissionFile(null);
                                                            }}
                                                            className="btn btn-secondary btn-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedTask(task.assignment_id!)}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    Submit Task
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default TasksPage;
