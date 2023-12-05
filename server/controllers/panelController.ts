
import { Request, Response } from 'express';
import { verifyJwt } from '../utils/userUtils';


const pool = require('../db/db');

exports.waitingApproval = (req: Request, res: Response) => {
    try {
        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');
        // Check authorization
        const query = `
            SELECT COUNT(*) AS Count
            FROM AccountRole
            WHERE AccountId = ?;
        `;
        pool.query(query, [userId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            // Doesn't have a role
            if (results[0].Count === 0) {
                return res.status(401).json({ error: 'Not authorized' });
            }

            // If authorized, get posts that waiting for approval
            const query = `
                SELECT
                    JP.Id,
                    JP.Title,
                    GROUP_CONCAT(JPI.Body ORDER BY JPI.ImgIndex) AS Images,
                    Category.Code AS CategoryCode
                FROM JobPosting AS JP
                LEFT JOIN JobPostingImages JPI ON JPI.JobPostingId = JP.Id
                LEFT JOIN SubCategory ON SubCategory.Id = JP.SubCategoryId
                LEFT JOIN Category ON Category.Id = SubCategory.CategoryId
                WHERE CurrentStatusId = 5
                GROUP BY JP.Id;
            `;
            pool.query(query, (qErr: any, results: any) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }

                return res.status(200).json({ posts: results });
            });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}







exports.asdf = (req: Request, res: Response) => {
    try {
        const query = ``;
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