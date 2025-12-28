import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const Sidebar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>IMS</h2>
                <p className="sidebar-subtitle">Intern Management</p>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="nav-icon">📊</span>
                    <span>Dashboard</span>
                </NavLink>

                {user.role === 'admin' && (
                    <NavLink to="/interns" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">👥</span>
                        <span>Interns</span>
                    </NavLink>
                )}

                <NavLink to="/tasks" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="nav-icon">📋</span>
                    <span>Tasks</span>
                </NavLink>

                <NavLink to="/attendance" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="nav-icon">📅</span>
                    <span>Attendance</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div className="user-info" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                    <div className="user-avatar">
                        {user.profile_photo_url ? (
                            <img src={user.profile_photo_url} alt={user.full_name} />
                        ) : (
                            <div className="avatar-initial">{user.full_name?.charAt(0)}</div>
                        )}
                    </div>
                    <div className="user-details">
                        <div className="user-name">{user.full_name}</div>
                        <div className="user-role badge badge-info">{user.role}</div>
                    </div>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm logout-btn">
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
