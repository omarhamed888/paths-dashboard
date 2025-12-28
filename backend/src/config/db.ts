import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * PostgreSQL connection pool configuration
 * Uses environment variables for database credentials
 */
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intern_management',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection established successfully');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};

/**
 * Execute a query with parameterized values for SQL injection prevention
 */
export const query = async (text: string, params?: any[]) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Query error:', { text, error });
        throw error;
    }
};

/**
 * Get a client from the pool for transactions
 */
export const getClient = () => {
    return pool.connect();
};

export default pool;
