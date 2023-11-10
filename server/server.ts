const express = require('express');
import { createServer } from 'http';
import { Server } from 'socket.io';
const cors = require('cors');
import { Request, Response } from 'express';
import { verifyJwt } from './utils/userUtils';

// Configuration
const app = express();
const PORT = 8080;
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'development'
            ? ['http://localhost:3000', 'http://127.0.0.1:3000']
            : ['http://localhost:3000']
    }
})


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
io.on('connection', (socket: any) => {
    console.log(`Client ${socket.id} connected`);

    socket.on('message', (data: any) => {
        try {
            const parsed = JSON.parse(data);
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
                    io.emit('message', JSON.stringify(errorMessage));
                    return;
                }

                const query2 = 'SELECT Id, Body, SenderId, CreatedAt FROM Message WHERE Id = ?';
                pool.query(query2, [results.insertId], (qErr2: any, results2: any) => {
                    if (qErr2) {
                        const errorMessage = {
                            status: 'error',
                            message: 'Failed to fetch the inserted message.'
                        };
                        io.emit('message', JSON.stringify(errorMessage));
                        return;
                    }

                    const responseMessage = {
                        status: 'success',
                        message: results2[0]
                    };
                    io.emit('message', JSON.stringify(responseMessage));
                });
            });
        } catch (error) {
            console.error("Error:", error);
        }
    });

    socket.on('close', () => {
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


httpServer.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});