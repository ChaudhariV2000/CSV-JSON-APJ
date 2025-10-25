const express = require('express');
const { pool } = require('../config/database');
const fs = require('fs');

const router = express.Router();
class CSVParser {
    constructor() {
        this.mandatoryFields = ['name.firstName', 'name.lastName', 'age'];
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    createObjectFromCSV(headers, values) {
        const obj = {};

        for (let i = 0; i < headers.length; i++) {
            const header = headers[i].trim();
            const value = values[i] ? values[i].trim() : '';
            this.setNestedProperty(obj, header, value);
        }

        return obj;
    }

    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i].trim();
            if (!current[key]) current[key] = {};
            current = current[key];
        }

        const lastKey = keys[keys.length - 1].trim();


        if (!isNaN(value) && value !== '') {
            current[lastKey] = Number(value);
        } else {
            current[lastKey] = value;
        }
    }

    validateMandatoryFields(record) {
        for (const field of this.mandatoryFields) {
            const keys = field.split('.');
            let current = record;

            for (const key of keys) {
                if (!current || !current[key]) {
                    throw new Error(`Missing mandatory field: ${field}`);
                }
                current = current[key];
            }
        }
        return true;
    }

    transformRecordForDatabase(record) {

        this.validateMandatoryFields(record);

        const { name, age, ...rest } = record;


        const fullName = `${name.firstName} ${name.lastName}`.trim();


        let address = null;
        let additionalInfo = { ...rest };

        if (rest.address) {
            address = rest.address;
            delete additionalInfo.address;
        }

        return {
            name: fullName,
            age: parseInt(age, 10),
            address: address,
            additional_info: Object.keys(additionalInfo).length > 0 ? additionalInfo : null
        };
    }

    async parseCSV(filePath) {
        return new Promise((resolve, reject) => {
            try {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const lines = fileContent.split('\n').filter(line => line.trim() !== '');

                if (lines.length < 2) {
                    throw new Error('CSV file must contain at least header and one data row');
                }

                const headers = this.parseCSVLine(lines[0]);
                const records = [];

                for (let i = 1; i < lines.length; i++) {
                    try {
                        const values = this.parseCSVLine(lines[i]);

                        if (values.length !== headers.length) {
                            console.warn(`Skipping row ${i + 1}: Column count mismatch`);
                            continue;
                        }

                        const record = this.createObjectFromCSV(headers, values);
                        records.push(record);
                    } catch (rowError) {
                        console.warn(`Skipping row ${i + 1}: ${rowError.message}`);
                    }
                }

                console.log(` Successfully parsed ${records.length} records`);
                resolve(records);
            } catch (error) {
                reject(new Error(`CSV parsing failed: ${error.message}`));
            }
        });
    }
}


router.post('/process-csv', async (req, res) => {
    const client = await pool.connect();

    try {
        console.log('📁 Processing CSV file...');
        const filePath = process.env.CSV_FILE_PATH;

        if (!fs.existsSync(filePath)) {
            return res.status(400).json({
                success: false,
                message: `CSV file not found at: ${filePath}`,
                solution: 'Please create uploads/data.csv file'
            });
        }


        const parser = new CSVParser();
        const records = await parser.parseCSV(filePath);

        if (records.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid records found in CSV file'
            });
        }


        console.log('💾 Inserting records into database...');
        await client.query('BEGIN');

        let insertedCount = 0;
        for (const record of records) {
            try {
                const transformed = parser.transformRecordForDatabase(record);
                const query = `
          INSERT INTO public.users (name, age, address, additional_info)
          VALUES ($1, $2, $3, $4)
        `;

                await client.query(query, [
                    transformed.name,
                    transformed.age,
                    transformed.address,
                    transformed.additional_info
                ]);
                insertedCount++;
            } catch (error) {
                console.warn(`Skipping record: ${error.message}`);
            }
        }

        await client.query('COMMIT');
        console.log(` Inserted ${insertedCount} records into database`);

        console.log('📊 Generating age distribution report...');
        const distributionQuery = `
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN age < 20 THEN 1 ELSE 0 END) as under_20,
        SUM(CASE WHEN age >= 20 AND age <= 40 THEN 1 ELSE 0 END) as between_20_40,
        SUM(CASE WHEN age > 40 AND age <= 60 THEN 1 ELSE 0 END) as between_40_60,
        SUM(CASE WHEN age > 60 THEN 1 ELSE 0 END) as over_60
      FROM public.users
    `;

        const distributionResult = await client.query(distributionQuery);
        const total = parseInt(distributionResult.rows[0].total_count);

        if (total === 0) {
            console.log('No records found for age distribution report');
        } else {
            const distribution = {
                '< 20': ((parseInt(distributionResult.rows[0].under_20) / total) * 100).toFixed(2),
                '20 to 40': ((parseInt(distributionResult.rows[0].between_20_40) / total) * 100).toFixed(2),
                '40 to 60': ((parseInt(distributionResult.rows[0].between_40_60) / total) * 100).toFixed(2),
                '> 60': ((parseInt(distributionResult.rows[0].over_60) / total) * 100).toFixed(2)
            };


            console.log('\n=================================');
            console.log('|    AGE DISTRIBUTION REPORT    |');
            console.log('=================================');
            console.log('| Age-Group    | % Distribution |');
            console.log('|--------------|----------------|');
            console.log(`| < 20         | ${distribution['< 20']}%         |`);
            console.log(`| 20 to 40     | ${distribution['20 to 40']}%         |`);
            console.log(`| 40 to 60     | ${distribution['40 to 60']}%         |`);
            console.log(`| > 60         | ${distribution['> 60']}%         |`);
            console.log('=================================\n');
        }

        res.json({
            success: true,
            message: `Successfully processed ${insertedCount} records`,
            records_processed: insertedCount,
            age_distribution: total > 0 ? {
                '< 20': distribution['< 20'] + '%',
                '20 to 40': distribution['20 to 40'] + '%',
                '40 to 60': distribution['40 to 60'] + '%',
                '> 60': distribution['> 60'] + '%'
            } : 'No data'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing CSV:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        client.release();
    }
});


router.get('/users', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const result = await pool.query('SELECT * FROM public.users ORDER BY id LIMIT $1', [limit]);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;