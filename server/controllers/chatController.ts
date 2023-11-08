import { Request, Response } from 'express';
import { verifyJwt } from '../utils/userUtils';


const pool = require('../db/db');


exports.getContacts = (req: Request, res: Response) => {
    // Verify and decode the token
    const jwt = req.headers?.authorization?.split(' ')[1];
    const userId = verifyJwt(jwt);
    if (!userId) return res.status(401).send('Not authorized');

    try {
        const query = `
            SELECT
                DISTINCT
                Account.Username AS ReceiverUsername,
                Message.CreatedAt AS LastMessageDate,
                Message.Body AS LastMessage,
                Account.FullName AS ReceiverFullName,
                Account.Avatar AS ReceiverAvatar
            FROM Message
            INNER JOIN MThreadParticipant AS TP1 ON TP1.ThreadId = Message.ThreadId
            INNER JOIN Account ON Account.Id = (
                SELECT MAX(A.Id)
                FROM Account A
                INNER JOIN MThreadParticipant TP2 ON A.Id = TP2.AccountId
                WHERE TP2.ThreadId = TP1.ThreadId AND A.Id != ?
            )
            WHERE (Message.Id IN 
                    (SELECT MAX(Message.Id)
                    FROM MThreadParticipant AS TP3
                    INNER JOIN Message ON TP3.ThreadId = Message.ThreadId
                    WHERE TP3.AccountId = ?
                    GROUP BY TP3.ThreadId)
                    )
            ORDER BY LastMessageDate DESC;
        `;
        pool.query(query, [userId, userId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }

            if (!results || results.length < 0) {
                return res.status(404).send('File not found');
            }

            return res.status(200).json({ threadList: results });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}