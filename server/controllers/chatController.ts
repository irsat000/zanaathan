import { Request, Response } from 'express';



exports.getContacts = (req: Request, res: Response) => {
    try {
        const id = 11;
        const query = `
            SELECT
                DISTINCT Message.Id AS LastMessageId,
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
                WHERE TP2.ThreadId = TP1.ThreadId AND A.Id != 9
            )
            WHERE (Message.Id IN 
                    (SELECT MAX(Message.Id)
                    FROM MThreadParticipant AS TP3
                    INNER JOIN Message ON TP3.ThreadId = Message.ThreadId
                    WHERE TP3.AccountId = 9
                    GROUP BY TP3.ThreadId)
                    )
            ORDER BY LastMessageDate DESC;
        `;
        pool.query(query, [id, id], (qErr: any, results: any) => {
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