
import { Request, Response } from 'express';

const pool = require('../db/db');

exports.getPosts = (req: Request, res: Response) => {
    try {
        const query = "SELECT * FROM JobPosting;"
        pool.query(query, (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            // If there are no posts
            // Might return empty instead!
            /*if (results.length === 0) {
                return res.status(404).json({ error: 'No post found' });
            }*/

            return res.status(200).json({ posts: results });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}