const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function updatePasswords() {
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

        const hash = await bcrypt.hash('Admin123!', 10);
        console.log('Generated hash:', hash);

        // Update all users
        const result = await client.query(
            'UPDATE users SET password_hash = $1',
            [hash]
        );
        console.log(`Updated ${result.rowCount} users`);

        await client.end();
        console.log('✅ All passwords updated successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
}

updatePasswords();
