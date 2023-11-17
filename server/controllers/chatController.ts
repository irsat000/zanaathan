import { Request, Response } from 'express';
import { verifyJwt } from '../utils/userUtils';


const pool = require('../db/db');


exports.getContacts = (req: Request, res: Response) => {
    try {
        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');
        // Get the list of contacts with their last messages and all the necessary information
        const query = `
            SELECT
                A.Id AS ReceiverId,
                A.Username AS ReceiverUsername,
                A.FullName AS ReceiverFullName,
                A.Avatar AS ReceiverAvatar,
                MAX(M.CreatedAt) AS LastMessageDate,
                ( SELECT Body
                    FROM Message AS M2
                    WHERE (M2.SenderId = A.Id OR M2.ReceiverId = A.Id)
                        AND M2.CreatedAt = MAX(M.CreatedAt)
                ) AS LastMessage,
                CASE WHEN COUNT(UB.TargetId) > 0 THEN true ELSE false END AS IsBlocked
            FROM
                Message AS M
            JOIN
                Account A ON (M.SenderId = A.Id AND M.ReceiverId = ?)
                OR (M.ReceiverId = A.Id AND M.SenderId = ?)
            LEFT JOIN
                UserBlock UB ON A.Id = UB.TargetId AND UB.AccountId = ?
            GROUP BY A.Id
            ORDER BY LastMessageDate DESC;
        `;
        pool.query(query, [userId, userId, userId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }

            return res.status(200).json({ contactList: results });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}


exports.getThread = (req: Request, res: Response) => {
    try {
        // Get contact id
        const contactId = req.params.contactId;
        if (!contactId) res.status(400).json({ error: 'Bad request' });
        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');
        // Get messages from both sides
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

exports.blockUserToggle = (req: Request, res: Response) => {
    try {
        // Get contact id
        const targetId = req.params.targetId;
        if (!targetId) res.status(400).json({ error: 'Bad request' });
        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');

        // Check block status between two users
        const query = `
            SELECT COUNT(*) AS Count FROM UserBlock
            WHERE AccountId = ? AND TargetId = ?;
        `;
        pool.query(query, [userId, targetId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }

            if (results[0].Count > 0) {
                // If user is already blocked, toggle and lift the block
                const query2 = `DELETE FROM UserBlock WHERE AccountId = ? AND TargetId = ?;`;
                pool.query(query2, [userId, targetId], (qErr2: any) => {
                    if (qErr2) {
                        return res.status(500).json({ error: 'Query error' });
                    }

                    return res.status(200).json({ message: 'User block is lifted' });
                });
            }
            else {
                // Block if user is not blocked
                const query2 = `INSERT INTO UserBlock(AccountId, TargetId) VALUES(?, ?);`;
                pool.query(query2, [userId, targetId], (qErr2: any) => {
                    if (qErr2) {
                        return res.status(500).json({ error: 'Query error' });
                    }

                    return res.status(200).json({ message: 'User blocked' });
                });
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