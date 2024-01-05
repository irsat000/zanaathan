const mysql = require('mysql');

const pool = mysql.createPool({
    host: 'localhost',
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '123',
    database: process.env.DB_NAME ?? 'ZanaatHan',
    multipleStatements: true
});

module.exports = pool;