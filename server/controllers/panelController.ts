
import { Request, Response } from 'express';
import { verifyJwt } from '../utils/userUtils';


const pool = require('../db/db');

const checkAdminRole = async (userId: number): Promise<boolean> => {
    // Check authorization
    const query = `
        SELECT COUNT(*) AS Count
        FROM AccountRole
        WHERE AccountId = ?;
    `;

    return new Promise((resolve, reject) => {
        pool.query(query, [userId], (qErr: any, results: any) => {
            if (qErr) {
                // Todo: Log error
                resolve(false);
            }
            resolve(results[0].Count > 0);
        });
    });
}

exports.waitingApproval = async (req: Request, res: Response) => {
    try {
        // Verify and decode the token, check admin role
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');
        if (await checkAdminRole(userId) === false) return res.status(401).json({ error: 'Not authorized' });

        // Get posts that waiting for approval
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
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}


exports.approvePost = async (req: Request, res: Response) => {
    try {
        // Verify and decode the token, check admin role
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');
        if (await checkAdminRole(userId) === false) return res.status(401).json({ error: 'Not authorized' });
        // Get post id
        const postId = req.params.postId;

        const query = `UPDATE JobPosting SET CurrentStatusId = 1 WHERE Id = ?;`;
        pool.query(query, [postId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }

            return res.status(200).json({ message: 'Success' });
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