const { Pool } = require('pg');
require('dotenv').config();

async function testDB() {
    console.log('🔧 Testing database connection...');
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);
    console.log('Host:', process.env.DB_HOST);

    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // Test if table exists
        const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

        if (tableCheck.rows[0].exists) {
            console.log('✅ Users table exists');

            // Count records
            const countResult = await client.query('SELECT COUNT(*) FROM public.users');
            console.log(`📊 Current records: ${countResult.rows[0].count}`);
        } else {
            console.log('❌ Users table does not exist');
            console.log('💡 Creating table...');

            await client.query(`
        CREATE TABLE public.users (
          "name" varchar NOT NULL,
          age int4 NOT NULL,
          address jsonb NULL,
          additional_info jsonb NULL,
          id serial4 NOT NULL PRIMARY KEY
        )
      `);
            console.log('✅ Users table created');
        }

        client.release();
    } catch (error) {
        console.log('❌ Database connection failed');
        console.log('Error:', error.message);
        console.log('\n💡 Check your .env file password');
    } finally {
        await pool.end();
    }
}

testDB();