import { Request, Response } from 'express';
import { verifyJwt } from '../utils/userUtils';
import { isPositiveNumeric } from '../utils/helperUtils';


const pool = require('../db/db');


exports.getNotifications = (req: Request, res: Response) => {
    try {
        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');

        // Get notifications within the last 1 month and maximum of 15 of them
        // IsSeen + 0 to convert the BIT into INT to prevent it being Buffer in Javascript
        const query = `
            SELECT N.Id, NotificationTypeId, IsSeen + 0 as IsSeen, N.CreatedAt,
                JP.Id as PostId,
                JP.Title as PostTitle,
                JP.CreatedAt as PostCreatedAt
            FROM notification N
            LEFT JOIN job_posting JP ON N.PostId = JP.Id
            WHERE N.AccountId = ?
            AND N.CreatedAt > DATE_SUB(NOW(), INTERVAL 1 MONTH)
            ORDER BY N.CreatedAt
            LIMIT 15;
        `;
        pool.query(query, [userId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error: ' + qErr });
            }
            return res.status(200).json({ notifications: results });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}


exports.notificationSeen = (req: Request, res: Response) => {
    try {
        const notificationId = req.params.notificationId;
        if (!isPositiveNumeric(notificationId)) return res.status(400).send('Bad request');
        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');
        // Update the notification while also checking ownership and seen status
        const query = `UPDATE notification SET IsSeen = 1 WHERE Id = ? AND IsSeen = 0 AND AccountId = ?;`;
        pool.query(query, [notificationId, userId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }

            if (results.affectedRows > 0) {
                return res.status(200).json({ message: 'Success' });
            } else {
                return res.status(404).json({ error: 'Notification not found' });
            }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}


exports.asdf = (req: Request, res: Response) => {
    try {
        const query = "";
        pool.query(query, (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }

            return res.status(200).json({});
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}