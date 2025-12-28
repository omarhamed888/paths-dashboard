import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import InternDashboard from './pages/InternDashboard';
import TasksPage from './pages/TasksPage';
import AttendancePage from './pages/AttendancePage';
import ProfilePage from './pages/ProfilePage';
import InternsPage from './pages/InternsPage';
import NotificationsPage from './pages/NotificationsPage';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import './index.css';
import './styles/Layout.css';
import './styles/Animations.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'admin' | 'intern' }> = ({
    children,
    allowedRole
}) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to="/" replace />;
    }

    return (
        <>
            <Sidebar />
            <Topbar />
            <main className="main-content">{children}</main>
        </>
    );
};

const AppRoutes: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        {user?.role === 'admin' ? <AdminDashboard /> : <InternDashboard />}
                    </ProtectedRoute>
                }
            />

            <Route
                path="/tasks"
                element={
                    <ProtectedRoute>
                        <TasksPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/interns"
                element={
                    <ProtectedRoute allowedRole="admin">
                        <InternsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/attendance"
                element={
                    <ProtectedRoute>
                        <AttendancePage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/notifications"
                element={
                    <ProtectedRoute>
                        <NotificationsPage />
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
