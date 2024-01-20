"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userUtils_1 = require("../utils/userUtils");
const helperUtils_1 = require("../utils/helperUtils");
const pool = require('../db/db');
exports.getNotifications = (req, res) => {
    var _a, _b;
    try {
        // Verify and decode the token
        const jwt = (_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1];
        const userId = (0, userUtils_1.verifyJwt)(jwt);
        if (!userId)
            return res.status(401).send('Not authorized');
        const query = `
            SELECT Id, NotificationTypeId, AccountId, IsSeen, CreatedAt, job_posting.Title as JobPostingTitle
            FROM notification
            LEFT JOIN job_posting ON notification.PostId = job_posting.Id
            WHERE AccountId = ?
            AND CreatedAt > DATE_SUB(NOW(), INTERVAL 1 MONTH)
            ORDER BY CreatedAt
            LIMIT 15;
        `;
        pool.query(query, [userId], (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            return res.status(200).json({ notifications: results });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
exports.notificationSeen = (req, res) => {
    var _a, _b;
    try {
        const notificationId = req.params.notificationId;
        if (!(0, helperUtils_1.isPositiveNumeric)(notificationId))
            return res.status(400).send('Bad request');
        // Verify and decode the token
        const jwt = (_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1];
        const userId = (0, userUtils_1.verifyJwt)(jwt);
        if (!userId)
            return res.status(401).send('Not authorized');
        // Update the notification while also checking ownership and seen status
        const query = `UPDATE notification SET IsSeen = 1 WHERE Id = ? AND IsSeen = 0 AND AccountId = ?;`;
        pool.query(query, [notificationId, userId], (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            if (results.affectedRows > 0) {
                return res.status(200).json({ message: 'Success' });
            }
            else {
                return res.status(404).json({ error: 'Notification not found' });
            }
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
exports.asdf = (req, res) => {
    try {
        const query = "";
        pool.query(query, (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            return res.status(200).json({});
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
