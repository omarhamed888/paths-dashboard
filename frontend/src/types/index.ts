export interface User {
    id: string;
    email: string;
    role: 'admin' | 'intern';
    full_name: string;
    profile_photo_url?: string;
    bio?: string;
    department?: string;
    created_at: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    assigned_by?: string;
    deadline: string;
    created_at?: string;
    assignment_status?: string;
    assignment_id?: string;
}

export interface Notification {
    id: string;
    type: 'task' | 'attendance' | 'rating' | 'system';
    title: string;
    message: string;
    is_read: boolean;
    severity: 'info' | 'warning' | 'critical';
    created_at: string;
}

export interface Attendance {
    date: string;
    status: 'present' | 'absent' | 'late';
    check_in_time?: string;
}
