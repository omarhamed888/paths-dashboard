const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function seedDatabase() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'intern_management',
        user: 'postgres',
        password: 'medo'
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Get the user IDs
        const users = await client.query('SELECT id, email, role FROM users ORDER BY role, email');
        const admin = users.rows.find(u => u.role === 'admin');
        const interns = users.rows.filter(u => u.role === 'intern');

        console.log(`Found admin: ${admin.email}`);
        console.log(`Found ${interns.length} interns`);

        // Insert attendance records
        console.log('\nInserting attendance records...');
        const today = new Date();
        for (let i = 0; i < 10; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            for (const intern of interns) {
                const status = i < 2 && intern.email === 'michael.c@example.com' ? 'absent' :
                    Math.random() > 0.8 ? 'late' : 'present';
                const checkIn = status !== 'absent' ? new Date(date.setHours(9, Math.random() * 60)) : null;

                await client.query(
                    'INSERT INTO attendance (user_id, date, status, check_in_time) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
                    [intern.id, date.toISOString().split('T')[0], status, checkIn]
                );
            }
        }
        console.log('✅ Attendance records inserted');

        // Insert tasks
        console.log('\nInserting tasks...');
        const tasks = [
            { title: 'Complete Onboarding Training', description: 'Review all onboarding materials and complete the training modules', days: 7 },
            { title: 'Database Design Exercise', description: 'Design a normalized database schema for an e-commerce system', days: 5 },
            { title: 'API Development Task', description: 'Build a RESTful API with CRUD operations', days: -2 },
            { title: 'Code Review Practice', description: 'Review pull requests and provide constructive feedback', days: 3 }
        ];

        for (const task of tasks) {
            const deadline = new Date(today);
            deadline.setDate(deadline.getDate() + task.days);

            const result = await client.query(
                'INSERT INTO tasks (title, description, assigned_by, deadline) VALUES ($1, $2, $3, $4) RETURNING id',
                [task.title, task.description, admin.id, deadline]
            );

            const taskId = result.rows[0].id;

            // Assign to interns
            for (const intern of interns) {
                await client.query(
                    'INSERT INTO task_assignments (task_id, intern_id, status) VALUES ($1, $2, $3)',
                    [taskId, intern.id, task.days < 0 ? 'late' : 'assigned']
                );
            }
        }
        console.log('✅ Tasks and assignments inserted');

        // Insert notifications
        console.log('\nInserting notifications...');
        for (const intern of interns) {
            if (intern.email === 'michael.c@example.com') {
                await client.query(
                    'INSERT INTO notifications (user_id, type, title, message, severity, is_read) VALUES ($1, $2, $3, $4, $5, $6)',
                    [intern.id, 'attendance', 'Consecutive Absences Alert', 'You have been absent for 2 consecutive days. Please reach out if you need support.', 'critical', false]
                );

                await client.query(
                    'INSERT INTO notifications (user_id, type, title, message, severity, is_read) VALUES ($1, $2, $3, $4, $5, $6)',
                    [intern.id, 'system', 'Performance Alert', 'You have multiple late or missed task submissions. This requires immediate attention.', 'critical', false]
                );
            }

            // Task assignment notification
            await client.query(
                'INSERT INTO notifications (user_id, type, title, message, severity, is_read) VALUES ($1, $2, $3, $4, $5, $6)',
                [intern.id, 'task', 'New Task Assigned', 'You have been assigned a new task: Complete Onboarding Training', 'info', false]
            );
        }

        // Admin notifications
        await client.query(
            'INSERT INTO notifications (user_id, type, title, message, severity, is_read) VALUES ($1, $2, $3, $4, $5, $6)',
            [admin.id, 'attendance', 'Intern Absence Alert', 'Michael Chen has been absent for 2 consecutive days', 'critical', false]
        );

        console.log('✅ Notifications inserted');

        await client.end();
        console.log('\n✅ Database seeding completed successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
}

seedDatabase();
