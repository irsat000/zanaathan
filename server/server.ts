const express = require('express');
//const http = require('http');
const cors = require('cors');
const WebSocket = require('ws');
import { Request, Response } from 'express';
import { verifyJwt } from './utils/userUtils';
const app = express();

// Configuration
const PORT = 8081;
//const server = http.createServer(express);
const wss = new WebSocket.Server({ port: 8082 });

// MIDDLEWARES
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));
// - Route middlewares
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const imageRoutes = require('./routes/imageRoutes');
app.use('/api', chatRoutes);
app.use('/api', userRoutes);
app.use('/api', postRoutes);
app.use('/api', imageRoutes);

// Database pool
const pool = require('./db/db');

// Web socket
wss.on('connection', (connection: any) => {
    console.log('Client connected');

    connection.on('message', (message: any) => {
        try {
            const parsed = JSON.parse(message);
            const userId = verifyJwt(parsed.jwt);
            if (!userId) return; //Not authorized
            // Handle the message from the client

            const query = 'INSERT INTO Message(Body, CreatedAt, IsDeleted, ReceiverId, SenderId) VALUES(?, NOW(), 0, ?, ?);';
            pool.query(query, [parsed.content, parsed.receiver, userId], (qErr: any, results: any) => {
                if (qErr) {
                    const errorMessage = {
                        status: 'error',
                        message: 'Failed to insert the message into the database.'
                    };
                    connection.send(JSON.stringify(errorMessage));
                    return;
                }

                const newMsgId = results.insertId;
                const responseMessage = {
                    status: 'success',
                    messageId: newMsgId
                };
                connection.send(JSON.stringify(responseMessage));
            });
        } catch (error) {
            console.error("Error:", error);
        }
    });

    connection.on('close', () => {
        console.log('Client disconnected');
    });
});


// Tests
app.get("/api/test", (req: Request, res: Response) => {
    res.json({ message: "Success" });
});

app.get("/api/dbtest", (req: Request, res: Response) => {
    pool.query('SELECT 1 + 1 AS solution', (qErr: any, rows: any, fields: any) => {
        if (qErr) {
            res.status(500).json({ error: 'Server error', qErr });
            return;
        }

        res.json({ message: rows[0].solution });
    });
});


app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});