"use strict";
var _a, _b, _c;
const mysql = require('mysql');
const pool = mysql.createPool({
    host: 'localhost',
    user: (_a = process.env.DB_USER) !== null && _a !== void 0 ? _a : 'root',
    password: (_b = process.env.DB_PASSWORD) !== null && _b !== void 0 ? _b : '123',
    database: (_c = process.env.DB_NAME) !== null && _c !== void 0 ? _c : 'ZanaatHan',
    multipleStatements: true
});
module.exports = pool;
