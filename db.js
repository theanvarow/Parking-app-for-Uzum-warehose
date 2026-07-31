import pg from 'pg';

const { Pool } = pg;

// PostgreSQL Connection Pool using DATABASE_URL environment variable or local config
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/wms_db';

export const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Helper function to run SQL queries safely
export const query = (text, params) => pool.query(text, params);
