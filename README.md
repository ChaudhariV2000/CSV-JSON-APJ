# CSV to JSON Converter API

A robust Node.js API that converts CSV files to JSON format and stores them in PostgreSQL with age distribution reporting. Built with custom CSV parsing (no external libraries) and following production-ready practices.

## 🚀 Features

- **Custom CSV Parser** - No external libraries used for CSV parsing
- **Complex Property Handling** - Supports infinite nesting with dot notation (a.b.c.d...)
- **PostgreSQL Integration** - Exact table structure as specified
- **Age Distribution Reporting** - Console output with percentage distribution
- **RESTful API** - Clean endpoints for processing and retrieval
- **Production Ready** - Error handling, validation, and scalability

## 📋 Requirements Met

- ✅ Custom CSV parser without external libraries  
- ✅ Handles complex properties with dot notation  
- ✅ Validates mandatory fields: `name.firstName`, `name.lastName`, `age`  
- ✅ PostgreSQL with exact table structure  
- ✅ Age distribution report printed to console  
- ✅ Handles 50,000+ records efficiently  
- ✅ RESTful API endpoints  
- ✅ Production quality code  

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Csv-Json-API
```

2. **Install dependencies**
```bash
npm install
```

3. **Database Setup**
```sql
-- Create database
CREATE DATABASE csv_converter;

-- Connect and create table
\c csv_converter;

CREATE TABLE public.users (
    "name" varchar NOT NULL,
    age int4 NOT NULL,
    address jsonb NULL,
    additional_info jsonb NULL,
    id serial4 NOT NULL PRIMARY KEY
);
```

4. **Environment Configuration**
Create `.env` file:
```env
PORT=3000
CSV_FILE_PATH=./uploads/data.csv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=csv_converter
DB_USER=postgres
DB_PASSWORD=your_password_here
UPLOAD_DIR=./uploads
```

5. **Sample Data**
Create `uploads/data.csv`:
```csv
name.firstName,name.lastName,age,address.line1,address.line2,address.city,address.state,gender,education.degree
John,Doe,25,123 Main St,Apt 4B,New York,NY,male,Bachelor
Jane,Smith,32,456 Oak Ave,Suite 100,Los Angeles,CA,female,Master
Bob,Johnson,45,789 Pine Rd,,Chicago,IL,male,PhD
Alice,Brown,19,321 Elm St,Unit 5,Houston,TX,female,Bachelor
Mike,Wilson,67,654 Maple Dr,Floor 3,Miami,FL,male,Master
```

## 🚀 Usage

### Start the Server
```bash
npm start
```

### API Endpoints

#### 1. Process CSV File
```bash
POST /api/process-csv
```
Processes the CSV file from configured path and generates age distribution report.

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed 5 records",
  "records_processed": 5,
  "age_distribution": {
    "< 20": "20.00%",
    "20 to 40": "40.00%",
    "40 to 60": "20.00%",
    "> 60": "20.00%"
  }
}
```

#### 2. Get Users
```bash
GET /api/users
```
Retrieves all users from the database.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "John Doe",
      "age": 25,
      "address": {
        "line1": "123 Main St",
        "line2": "Apt 4B",
        "city": "New York",
        "state": "NY"
      },
      "additional_info": {
        "gender": "male",
        "education": {
          "degree": "Bachelor"
        }
      },
      "id": 1
    }
  ],
  "count": 1
}
```

#### 3. Health Check
```bash
GET /health
```
API health status.

#### 4. API Information
```bash
GET /
```
API documentation and available endpoints.

## 📊 Age Distribution Report

The application automatically generates and prints an age distribution report to the console:

```
=================================
|    AGE DISTRIBUTION REPORT    |
=================================
| Age-Group    | % Distribution |
|--------------|----------------|
| < 20         | 20.00%         |
| 20 to 40     | 40.00%         |
| 40 to 60     | 20.00%         |
| > 60         | 20.00%         |
=================================
```

## 🏗️ Architecture

```
csv-to-json-api/
├── src/
│   ├── config/
│   │   └── database.js      # PostgreSQL configuration
│   ├── routes/
│   │   └── users.js         # API routes with CSV parser
│   └── app.js               # Main application
├── uploads/
│   └── data.csv            # Sample CSV file
├── .env                    # Environment variables
└── package.json
```

## 🔧 Technical Details

### CSV Parsing Features
- **Custom Implementation** - No external CSV libraries
- **Nested Property Support** - Handles `address.line1`, `education.degree`, etc.
- **Type Conversion** - Automatic number and boolean detection
- **Quote Handling** - Proper CSV quote and comma handling
- **Error Resilience** - Continues processing on row errors

### Database Schema
```sql
CREATE TABLE public.users (
    "name" varchar NOT NULL,           -- Combined firstName + lastName
    age int4 NOT NULL,                 -- Integer age
    address jsonb NULL,                -- Nested address object
    additional_info jsonb NULL,        -- Remaining fields as JSON
    id serial4 NOT NULL PRIMARY KEY    -- Auto-incrementing ID
);
```

### Data Transformation
**CSV Input:**
```csv
name.firstName,name.lastName,age,address.line1,address.city,education.degree
```

**JSON Output:**
```json
{
  "name": "John Doe",
  "age": 25,
  "address": {
    "line1": "123 Main St",
    "city": "New York"
  },
  "additional_info": {
    "education": {
      "degree": "Bachelor"
    }
  }
}
```

## 🧪 Testing

### Using curl
```bash
# Process CSV
curl -X POST http://localhost:3000/api/process-csv

# Get users
curl http://localhost:3000/api/users

# Health check
curl http://localhost:3000/health
```

### Using Postman
1. Import the collection from `/postman` folder
2. Set environment variables
3. Test all endpoints

## 📈 Performance

- **Memory Efficient** - Processes files line by line
- **Batch Operations** - Database transactions for bulk inserts
- **Scalable** - Handles 50,000+ records efficiently
- **Optimized Queries** - Efficient age distribution calculations

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL service is running
   - Verify credentials in `.env` file
   - Ensure database `csv_converter` exists

2. **CSV File Not Found**
   - Create `uploads/data.csv` file
   - Check file path in `.env`

3. **Module Not Found**
   - Run `npm install` to install dependencies

### Logs
Check console output for detailed processing information and error messages.

## 📝 Assumptions

1. **CSV Format**: Comma-delimited with optional quotes for text containing commas
2. **Headers**: First row always contains property names
3. **Encoding**: UTF-8 file encoding
4. **Mandatory Fields**: `name.firstName`, `name.lastName`, `age` must be present
5. **Nested Properties**: Complex properties use dot notation and are ordered sequentially

## 🔮 Future Enhancements

- File upload endpoint
- Support for different CSV delimiters
- Pagination for user retrieval
- Authentication and authorization
- Docker containerization
- Unit and integration tests

## 👨‍💻 Development

### Scripts
```bash
npm start      # Start production server
npm run dev    # Start development server with nodemon
```

### Code Style
- Consistent naming conventions
- Proper error handling
- Separation of concerns
- Comprehensive comments

## 📄 License

MIT License - feel free to use this project for learning and development purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📸 Application Output

### Server Startup
![Server Startup](https://github.com/user-attachments/assets/c71a70ca-8c0b-48dc-9326-e9b732d83c07)

### CSV Processing
![CSV Processing](https://github.com/user-attachments/assets/2a42ced2-6d49-446c-bdc7-cc13b1c07b04)

### Age Distribution Report
![Age Distribution Report](https://github.com/user-attachments/assets/185c069a-6d94-41a7-a18a-f87e3271a144)

### API Response
![API Response](https://github.com/user-attachments/assets/c72abb06-f8ce-4d26-a0d1-51ab3dd2dd66)

### Database Records
![Database Records](https://github.com/user-attachments/assets/9a6b5472-7484-456f-8e7c-73f0a7046123)



### Health Check
![Health Check](https://github.com/user-attachments/assets/16b7b230-f84f-4bcd-9d54-d27fc5ff6aa6)

---

