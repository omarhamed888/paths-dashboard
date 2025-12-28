import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from './NotificationPanel';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <h2>Intern Management</h2>
                </div>

                <div className="navbar-links">
                    <Link to="/" className="nav-link">Dashboard</Link>
                    <Link to="/tasks" className="nav-link">Tasks</Link>
                    <Link to="/attendance" className="nav-link">Attendance</Link>
                    <Link to="/profile" className="nav-link">Profile</Link>
                </div>

                <div className="navbar-actions">
                    <div className="notification-wrapper">
                        <button
                            className="notification-btn"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            🔔
                        </button>
                        {showNotifications && (
                            <NotificationPanel onClose={() => setShowNotifications(false)} />
                        )}
                    </div>

                    <div className="user-menu">
                        <div className="user-info">
                            <span className="user-name">{user.full_name}</span>
                            <span className="user-role badge badge-info">{user.role}</span>
                        </div>
                        <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
