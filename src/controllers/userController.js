const UserService = require('../services/userService');
const fs = require('fs');
const path = require('path');

class UserController {
    constructor() {
        this.userService = new UserService();
    }

    async processCSV(req, res) {
        try {
            const filePath = process.env.CSV_FILE_PATH;

            if (!fs.existsSync(filePath)) {
                return res.status(400).json({
                    success: false,
                    message: `CSV file not found at path: ${filePath}`
                });
            }

            const result = await this.userService.processCSVFile(filePath);

            res.json({
                success: true,
                message: result.message,
                totalRecords: result.totalRecords
            });
        } catch (error) {
            console.error('Error in processCSV:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    async uploadCSV(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No CSV file uploaded'
                });
            }

            const filePath = req.file.path;
            const result = await this.userService.processCSVFile(filePath);

            // Clean up uploaded file
            fs.unlinkSync(filePath);

            res.json({
                success: true,
                message: result.message,
                totalRecords: result.totalRecords
            });
        } catch (error) {
            console.error('Error in uploadCSV:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    async getUsers(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 100;
            const users = await this.userService.getAllUsers(limit);

            res.json({
                success: true,
                data: users,
                count: users.length
            });
        } catch (error) {
            console.error('Error in getUsers:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = UserController;