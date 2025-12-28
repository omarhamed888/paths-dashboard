import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/AttendancePage.css';

interface AttendanceRecord {
    date: string;
    status: 'present' | 'absent' | 'late';
    check_in_time?: string;
    user_id?: string;
    full_name?: string;
}

interface Intern {
    id: string;
    full_name: string;
    email: string;
}

const AttendancePage: React.FC = () => {
    const { user } = useAuth();
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [interns, setInterns] = useState<Intern[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user?.role === 'admin') {
            loadInterns();
            loadAttendanceForDate();
        } else {
            loadMyAttendance();
        }
    }, [user, selectedDate]);

    const loadInterns = async () => {
        try {
            const response = await api.get('/users');
            setInterns(response.data.interns || []);
        } catch (error) {
            console.error('Failed to load interns:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAttendanceForDate = async () => {
        try {
            const response = await api.get(`/attendance/summary?date=${selectedDate}`);
            const records = response.data.attendance || [];

            // Convert to map for easy lookup
            const map: Record<string, string> = {};
            records.forEach((record: any) => {
                map[record.user_id] = record.status;
            });
            setAttendanceData(map);
        } catch (error) {
            console.error('Failed to load attendance:', error);
        }
    };

    const loadMyAttendance = async () => {
        try {
            const response = await api.get(`/attendance/user/${user!.id}`);
            setAttendance(response.data.attendance || []);
        } catch (error) {
            console.error('Failed to load attendance:', error);
            setAttendance([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async (internId: string, status: string) => {
        try {
            await api.post('/attendance', {
                user_id: internId,
                date: selectedDate,
                status,
                check_in_time: status !== 'absent' ? new Date().toISOString() : null
            });

            setAttendanceData(prev => ({ ...prev, [internId]: status }));
            alert('Attendance marked successfully!');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to mark attendance');
        }
    };

    if (loading) return <div className="card">Loading attendance...</div>;

    if (user?.role === 'intern') {
        return (
            <div className="container">
                <h1>My Attendance History</h1>
                <div className="card">
                    <div className="attendance-history">
                        {attendance.length === 0 ? (
                            <div className="empty-state">No attendance records</div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Check-in Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.map((record, index) => (
                                        <tr key={index}>
                                            <td>{new Date(record.date).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`badge badge-${record.status === 'present' ? 'success' :
                                                        record.status === 'late' ? 'warning' : 'error'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td>
                                                {record.check_in_time
                                                    ? new Date(record.check_in_time).toLocaleTimeString()
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1>Attendance Management</h1>
                <div className="date-selector">
                    <label>Select Date:</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>
            </div>

            <div className="card">
                <h3>Mark Attendance for {new Date(selectedDate).toLocaleDateString()}</h3>
                <div className="attendance-grid">
                    {interns.length === 0 ? (
                        <div className="empty-state">No interns found</div>
                    ) : (
                        interns.map((intern) => {
                            const currentStatus = attendanceData[intern.id] || 'unmarked';

                            return (
                                <div key={intern.id} className="attendance-item">
                                    <div className="intern-info">
                                        <div className="intern-name">{intern.full_name}</div>
                                        <div className="intern-email">{intern.email}</div>
                                    </div>

                                    <div className="attendance-buttons">
                                        <button
                                            className={`btn btn-sm ${currentStatus === 'present' ? 'btn-success active' : 'btn-outline-success'}`}
                                            onClick={() => handleMarkAttendance(intern.id, 'present')}
                                        >
                                            ✓ Present
                                        </button>
                                        <button
                                            className={`btn btn-sm ${currentStatus === 'late' ? 'btn-warning active' : 'btn-outline-warning'}`}
                                            onClick={() => handleMarkAttendance(intern.id, 'late')}
                                        >
                                            ⏰ Late
                                        </button>
                                        <button
                                            className={`btn btn-sm ${currentStatus === 'absent' ? 'btn-danger active' : 'btn-outline-danger'}`}
                                            onClick={() => handleMarkAttendance(intern.id, 'absent')}
                                        >
                                            ✗ Absent
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
