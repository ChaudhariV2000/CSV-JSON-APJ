const express = require('express');
require('dotenv').config();

const { initializeDatabase } = require('./config/database');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api', userRoutes);


app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'CSV to JSON Converter API is running',
        timestamp: new Date().toISOString()
    });
});


app.get('/', (req, res) => {
    res.json({
        message: 'CSV to JSON Converter API',
        description: 'Process CSV files and store in PostgreSQL',
        endpoints: {
            health: 'GET /health',
            process_csv: 'POST /api/process-csv',
            get_users: 'GET /api/users'
        },
        file_path: process.env.CSV_FILE_PATH
    });
});


const startServer = async () => {
    try {
        console.log(' Starting CSV to JSON API Server...');


        const dbReady = await initializeDatabase();

        if (!dbReady) {
            console.log('  Database connection failed - check your .env file');
        }

        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Local: http://localhost:${PORT}`);
            console.log(`Health: http://localhost:${PORT}/health`);
            console.log(`Process CSV: POST http://localhost:${PORT}/api/process-csv`);
            console.log(`Get Users: GET http://localhost:${PORT}/api/users`);
            console.log('\n Make sure uploads/data.csv exists with sample data');
        });
    } catch (error) {
        console.error(' Failed to start server:', error.message);
    }
};

startServer();