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
                DISTINCT Message.ThreadId AS ThreadId,
                Message.CreatedAt AS LastMessageDate,
                Message.Body AS LastMessage,
                Account.Username AS ReceiverUsername,
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


// TODO: Check if person is authorized by checking if they are participated in the thread
exports.getThread = (req: Request, res: Response) => {
    try {
        const threadId = req.params.threadId;
        if (!threadId) res.status(400).json({ error: 'Bad request' });

        const query = `
            SELECT M.Id, M.Body, M.AccountId, M.CreatedAt
            FROM Message AS M
            INNER JOIN MThread T ON M.ThreadId = T.Id
            WHERE M.IsDeleted = 0 AND M.ThreadId = ?
            ORDER BY CreatedAt;
        `;
        pool.query(query, [threadId], (qErr: any, results: any) => {
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