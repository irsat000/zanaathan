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
                A.Id AS ReceiverId,
                A.Username AS ReceiverUsername,
                A.FullName AS ReceiverFullName,
                A.Avatar AS ReceiverAvatar,
                MAX(M.CreatedAt) AS LastMessageDate,
                ( SELECT Body
                    FROM Message M2
                    WHERE (M2.SenderId = A.Id OR M2.ReceiverId = A.Id)
                        AND M2.CreatedAt = MAX(M.CreatedAt)
                ) AS LastMessage
            FROM Account A
            LEFT JOIN Message M ON A.Id = M.SenderId OR A.Id = M.ReceiverId
            WHERE A.Id != ?
            GROUP BY A.Id;
        `;
        pool.query(query, [userId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }

            if (!results || results.length < 0) {
                return res.status(404).send('File not found');
            }

            return res.status(200).json({ contactList: results });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}


// TODO: Check if person is authorized by checking if they are participated in the thread
exports.getThread = (req: Request, res: Response) => {
    try {
        // Get contact id
        const contactId = req.params.contactId;
        if (!contactId) res.status(400).json({ error: 'Bad request' });
        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');

        console.log({ userId, contactId });

        const query = `
            SELECT M.Id, M.SenderId, M.CreatedAt, M.Body
            FROM Message AS M
            WHERE (SenderId = ? AND ReceiverId = ?)
            OR (SenderId = ? AND ReceiverId = ?)
            ORDER BY CreatedAt;
        `;
        pool.query(query, [userId, contactId, contactId, userId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }

            return res.status(200).json({ messages: results });
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