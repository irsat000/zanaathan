const mysql = require('mysql');

const pool = mysql.createPool({
    host: 'localhost',
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '1234',
    database: process.env.DB_NAME ?? 'zanaathan',
    multipleStatements: true
});

module.exports = pool;