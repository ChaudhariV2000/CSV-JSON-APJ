const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const initializeDatabase = async () => {
    try {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL successfully!');


        await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        "name" varchar NOT NULL,
        age int4 NOT NULL,
        address jsonb NULL,
        additional_info jsonb NULL,
        id serial4 NOT NULL PRIMARY KEY
      )
    `);

        console.log('Users table ready');
        client.release();
        return true;
    } catch (error) {
        console.error('Database error:', error.message);
        return false;
    }
};

module.exports = { pool, initializeDatabase };
