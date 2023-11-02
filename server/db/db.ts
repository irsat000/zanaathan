const mysql = require('mysql');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123',
    database: 'ZanaatHan',
    multipleStatements: true
});

module.exports = pool;