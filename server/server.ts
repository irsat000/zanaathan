const express = require('express');
const cors = require('cors');
import { Request, Response } from 'express';
const app = express();
const PORT = 8081;

// MIDDLEWARES
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));
// - Route middlewares
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const imageRoutes = require('./routes/imageRoutes');
app.use('/api', userRoutes);
app.use('/api', postRoutes);
app.use('/api', imageRoutes);







const pool = require('./db/db').pool;

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