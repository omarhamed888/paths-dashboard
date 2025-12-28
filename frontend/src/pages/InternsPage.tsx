import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/InternsPage.css';

interface Intern {
    id: string;
    email: string;
    full_name: string;
    department?: string;
    created_at: string;
}

const InternsPage: React.FC = () => {
    const { user } = useAuth();
    const [interns, setInterns] = useState<Intern[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        password: 'Admin123!',
        department: ''
    });

    useEffect(() => {
        loadInterns();
    }, []);

    const loadInterns = async () => {
        try {
            const response = await api.get('/users');
            setInterns(response.data.interns || []);
        } catch (error) {
            console.error('Failed to load interns:', error);
            setInterns([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddIntern = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/users', {
                ...formData,
                role: 'intern'
            });
            alert('Intern added successfully!');
            setShowAddForm(false);
            setFormData({ email: '', full_name: '', password: 'Admin123!', department: '' });
            loadInterns();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to add intern');
        }
    };

    const handleDeleteIntern = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            try {
                await api.delete(`/users/${id}`);
                alert('Intern deleted successfully!');
                loadInterns();
            } catch (error: any) {
                alert(error.response?.data?.error || 'Failed to delete intern');
            }
        }
    };

    if (loading) return <div className="card">Loading interns...</div>;

    return (
        <div className="container">
            <div className="page-header">
                <h1>Intern Management</h1>
                <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
                    {showAddForm ? 'Cancel' : '+ Add Intern'}
                </button>
            </div>

            {showAddForm && (
                <div className="card mb-6">
                    <h3>Add New Intern</h3>
                    <form onSubmit={handleAddIntern} className="intern-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Department</label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Initial Password *</label>
                                <input
                                    type="text"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary">Add Intern</button>
                    </form>
                </div>
            )}

            <div className="card">
                <h3>All Interns ({interns.length})</h3>
                <div className="interns-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {interns.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="empty-state">No interns found</td>
                                </tr>
                            ) : (
                                interns.map((intern) => (
                                    <tr key={intern.id}>
                                        <td>{intern.full_name}</td>
                                        <td>{intern.email}</td>
                                        <td>{intern.department || '-'}</td>
                                        <td>{new Date(intern.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                onClick={() => handleDeleteIntern(intern.id, intern.full_name)}
                                                className="btn btn-danger btn-sm"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InternsPage;
