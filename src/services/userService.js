const { pool } = require('../config/database');
const CSVParser = require('../utils/csvParser');

class UserService {
    constructor() {
        this.csvParser = new CSVParser();
    }

    async processCSVFile(filePath) {
        try {

            const records = await this.csvParser.parseCSV(filePath);
            console.log(`Parsed ${records.length} records from CSV file`);


            const transformedRecords = records.map(record =>
                this.csvParser.transformRecordForDatabase(record)
            );


            await this.bulkInsertUsers(transformedRecords);


            await this.generateAgeDistributionReport();

            return {
                success: true,
                message: `Successfully processed ${records.length} records`,
                totalRecords: records.length
            };
        } catch (error) {
            console.error('Error processing CSV file:', error);
            throw error;
        }
    }

    async bulkInsertUsers(users) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            for (const user of users) {
                const query = `
          INSERT INTO public.users (name, age, address, additional_info)
          VALUES ($1, $2, $3, $4)
        `;

                await client.query(query, [
                    user.name,
                    user.age,
                    user.address,
                    user.additional_info
                ]);
            }

            await client.query('COMMIT');
            console.log(`Inserted ${users.length} records into database`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async generateAgeDistributionReport() {
        const query = `
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN age < 20 THEN 1 ELSE 0 END) as under_20,
        SUM(CASE WHEN age >= 20 AND age <= 40 THEN 1 ELSE 0 END) as between_20_40,
        SUM(CASE WHEN age > 40 AND age <= 60 THEN 1 ELSE 0 END) as between_40_60,
        SUM(CASE WHEN age > 60 THEN 1 ELSE 0 END) as over_60
      FROM public.users
    `;

        const result = await pool.query(query);
        const total = parseInt(result.rows[0].total_count);

        if (total === 0) {
            console.log('No records found for age distribution report');
            return;
        }

        const distribution = {
            '< 20': (parseInt(result.rows[0].under_20) / total * 100).toFixed(2),
            '20 to 40': (parseInt(result.rows[0].between_20_40) / total * 100).toFixed(2),
            '40 to 60': (parseInt(result.rows[0].between_40_60) / total * 100).toFixed(2),
            '> 60': (parseInt(result.rows[0].over_60) / total * 100).toFixed(2)
        };


        console.log('\n=== AGE DISTRIBUTION REPORT ===');
        console.log('| Age-Group    | % Distribution |');
        console.log('|--------------|----------------|');
        console.log(`| < 20         | ${distribution['< 20']}%        |`);
        console.log(`| 20 to 40     | ${distribution['20 to 40']}%        |`);
        console.log(`| 40 to 60     | ${distribution['40 to 60']}%        |`);
        console.log(`| > 60         | ${distribution['> 60']}%        |`);
        console.log('===============================\n');

        return distribution;
    }

    async getAllUsers(limit = 100) {
        const query = 'SELECT * FROM public.users LIMIT $1';
        const result = await pool.query(query, [limit]);
        return result.rows;
    }
}

module.exports = UserService;