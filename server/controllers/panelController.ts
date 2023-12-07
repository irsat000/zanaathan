
import { Request, Response } from 'express';
import * as fs from 'fs';
const path = require('path');
const appDir = path.dirname(require.main?.filename);
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

exports.rejectPost = async (req: Request, res: Response) => {
    try {
        // Verify and decode the token, check admin role
        const jwt = req.headers?.authorization?.split(' ')[1];
        const adminId = verifyJwt(jwt);
        if (!adminId) return res.status(401).send('Not authorized');
        if (await checkAdminRole(adminId) === false) return res.status(401).json({ error: 'Not authorized' });
        // Get post id
        const postId = req.params.postId;
        // Get parameters
        const body: {
            banDuration: string
        } = req.body;
        if (!body) {
            return res.status(400).json({ error: 'Bad request' });
        }

        // Check job posting and get the account id
        const query = `SELECT AccountId FROM JobPosting WHERE Id = ?;`;
        pool.query(query, [postId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            if (results.length < 1) {
                return res.status(404).json({ error: 'Post not found' });
            }

            const postOwnerId = results[0].AccountId;

            // Update post to set current status to 4 (deleted)
            const query = `UPDATE JobPosting SET CurrentStatusId = 4 WHERE Id = ?;`;
            pool.query(query, [postId], (qErr: any, results: any) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }

                // Get images of the post if there are any
                const query = `SELECT Body FROM JobPostingImages WHERE JobPostingId = ?;`;
                pool.query(query, [postId], async (qErr: any, imageResults: any) => {
                    if (qErr) {
                        return res.status(500).json({ error: 'Query error' });
                    }

                    // Delete images
                    if (imageResults.length > 0) {
                        const deleteImagesPromise = async (): Promise<void> => {
                            // Delete from database
                            const query = `DELETE FROM JobPostingImages WHERE JobPostingId = ?;`;
                            await new Promise<void>((resolve, reject) => {
                                pool.query(query, [postId], (qErr: any, results: any) => {
                                    if (qErr) {
                                        reject();
                                        // TODO: Logging maybe, not supposed to give error
                                    }

                                    // Delete from storage
                                    imageResults.forEach((obj: { Body: string }) => {
                                        const path = appDir + '/uploaded/post/' + obj.Body;
                                        fs.existsSync(path) && fs.unlinkSync(path)
                                    })

                                    resolve();
                                });
                            });
                        }
                        await deleteImagesPromise();
                    }

                    // Ban the account
                    if (+body.banDuration > 0) {
                        const banUserPromise = async (): Promise<void> => {
                            const reason = `Gönderinizde yasaklanmanızı gerektiren bir problem tesbit ettik.`;

                            const query = `
                                INSERT UserBans(BannedAt, LiftDate, Reason, AccountId, AdminId)
                                VALUES (NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?, ?);
                            `;
                            await new Promise<void>((resolve, reject) => {
                                pool.query(query, [body.banDuration, reason, postOwnerId, adminId], (qErr: any, results: any) => {
                                    if (qErr) {
                                        reject();
                                        // TODO: Logging
                                    }

                                    resolve();
                                });
                            });
                        }
                        await banUserPromise();
                    }

                    return res.status(200).json({ message: 'Success' });
                });
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