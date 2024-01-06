
import { Request, Response } from 'express';
import * as fs from 'fs';
const appDir = process.cwd();
import { verifyJwt } from '../utils/userUtils';
import { isNullOrEmpty, isPositiveNumeric } from '../utils/helperUtils';


const pool = require('../db/db');

const checkAdminRole = async (userId: number): Promise<boolean> => {
    // Check authorization
    const query = `
        SELECT COUNT(*) AS Count
        FROM account_role
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

const banUserPromise = async (banDuration: number, reason: string, targetId: number, adminId: number): Promise<string | null> => {
    const query = `
        INSERT INTO user_bans(BannedAt, LiftDate, Reason, AccountId, AdminId)
        VALUES (NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?, ?);
    `;
    return await new Promise<string | null>((resolve, reject) => {
        pool.query(query, [banDuration, reason, targetId, adminId], (qErr: any, results: any) => {
            if (qErr) {
                resolve(null)
            }

            // Calculate the lift date using banDuration
            const liftDate = new Date();
            liftDate.setDate(liftDate.getDate() + banDuration);

            // Resolve with the lift date
            resolve(liftDate.toISOString());
        });
    });
}

// Deletes an individual post, its images and the images from the storage
// If user is banned, it deletes all the unapproved job postings of the person
const deleteUnapprovedPostsPromise = async (userBanned: boolean, accountId: string, postId?: string): Promise<boolean> => {
    return await new Promise<boolean>(async (resolve, reject) => {
        // Make sure post id exists in case user is not banned
        if (!userBanned && !postId) {
            resolve(false)
        }
        // Update post(s) to set current status to 4 (deleted)
        const filterType = userBanned ? 'CurrentStatusId = 5 AND AccountId' : 'Id'
        const filterId = userBanned ? accountId : postId
        const query = `UPDATE job_posting SET CurrentStatusId = 4 WHERE ${filterType} = ?;`
        pool.query(query, [filterId], (qErr: any, results: any) => {
            if (qErr) {
                resolve(false)
            }

            // FOR IMAGES
            let queryPostImages = ` FROM job_posting_images JPI`
            if (userBanned) {
                queryPostImages += ` LEFT JOIN job_posting JP ON JPI.JobPostingId = JP.Id WHERE JP.AccountId = ? AND JP.CurrentStatusId = 4;`
            } else {
                queryPostImages += ` WHERE JobPostingId = ?;`
            }
            // Get images of the post(s) if there are any
            pool.query('SELECT JPI.Body' + queryPostImages, [filterId], async (qErr: any, imageResults: any) => {
                if (qErr) {
                    resolve(false)
                }

                // Delete all these images
                if (imageResults.length > 0) {
                    // Delete from database
                    pool.query('DELETE JPI' + queryPostImages, [filterId], (qErr: any, results: any) => {
                        if (qErr) {
                            resolve(false)
                        }

                        // Delete from storage
                        imageResults.forEach((obj: { Body: string }) => {
                            const path = appDir + '/uploaded/post/' + obj.Body
                            if (fs.existsSync(path)) {
                                fs.unlinkSync(path)
                            }
                        })

                        resolve(true)
                    });
                }

                resolve(true)
            })
        })
    })
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
                    category.Code AS CategoryCode,
                    JP.AccountId AS OwnerId
                FROM job_posting AS JP
                LEFT JOIN job_posting_images JPI ON JPI.JobPostingId = JP.Id
                LEFT JOIN sub_category ON sub_category.Id = JP.SubCategoryId
                LEFT JOIN category ON category.Id = sub_category.CategoryId
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



exports.adminUpdatePost = async (req: Request, res: Response) => {
    try {
        // Verify and decode the token, check admin role
        const jwt = req.headers?.authorization?.split(' ')[1];
        const adminId = verifyJwt(jwt);
        if (!adminId) return res.status(401).send('Not authorized');
        if (await checkAdminRole(adminId) === false) return res.status(401).json({ error: 'Not authorized' });
        // Get post id and the action
        const postId = req.params.postId;
        const action = req.params.action;

        if (action === 'approve' || action === 'complete') {
            const query = `UPDATE job_posting SET CurrentStatusId = ${action === 'approve' ? '1' : '3'} WHERE Id = ?;`;
            pool.query(query, [postId], (qErr: any, results: any) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }

                return res.status(200).json({ message: 'Success' });
            });
        } else if (action === 'reject') {
            // Get reject parameters
            const body: {
                banDuration: string
            } = req.body;
            if (!body) {
                return res.status(400).json({ error: 'Bad request' });
            }

            // Check job posting and get the account id
            const query = `SELECT AccountId FROM job_posting WHERE Id = ?;`;
            pool.query(query, [postId], async (qErr: any, results: any) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }
                if (results.length === 0) {
                    return res.status(404).json({ error: 'Post not found' });
                }

                const postOwnerId = results[0].AccountId;

                // Delete the unapproved post(s)
                const success = await deleteUnapprovedPostsPromise(+body.banDuration > 0, postOwnerId, postId);

                // Ban the account
                if (+body.banDuration > 0) {
                    const reason = `Gönderinizde yasaklanmanızı gerektiren bir problem tesbit ettik.`;
                    const liftDate = await banUserPromise(+body.banDuration, reason, postOwnerId, adminId);
                    if (!liftDate) {
                        return res.status(500).json({ message: 'Failed to ban' });
                    }
                }

                if (!success) {
                    return res.status(500).json({ message: 'Failed to remove the post or posts' });
                }

                return res.status(200).json({ message: 'Success' });
            });
        } else {
            return res.status(400).json({ error: 'Bad request' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}



/*
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
        pool.query(query, [postId], async (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'Post not found' });
            }

            const postOwnerId = results[0].AccountId;

            // Delete the unapproved post(s)
            const success = await deleteUnapprovedPostsPromise(+body.banDuration > 0, postOwnerId, postId);

            // Ban the account
            if (+body.banDuration > 0) {
                const reason = `Gönderinizde yasaklanmanızı gerektiren bir problem tesbit ettik.`;
                const liftDate = await banUserPromise(+body.banDuration, reason, postOwnerId, adminId);
                if (!liftDate) {
                    return res.status(500).json({ message: 'Failed to ban' });
                }
            }

            if (!success) {
                return res.status(500).json({ message: 'Failed to remove the post or posts' });
            }

            return res.status(200).json({ message: 'Success' });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}
*/

exports.getUser = async (req: Request, res: Response) => {
    try {
        // Verify and decode the token, check admin role
        const jwt = req.headers?.authorization?.split(' ')[1];
        const adminId = verifyJwt(jwt);
        if (!adminId) return res.status(401).send('Not authorized');
        if (await checkAdminRole(adminId) === false) return res.status(401).json({ error: 'Not authorized' });
        // Get the target, (username | fullName | id)
        const target = req.params.target;
        // Get type
        const { targetType } = req.query as {
            targetType?: string,
        };
        if (isNullOrEmpty(target) || !targetType || !['0', '1', '2'].includes(targetType)) {
            return res.status(400).json({ error: 'Bad request' });
        }

        // Get users with the selected criteria
        const filter = targetType === '0'
            ? 'Username LIKE ?'
            : targetType === '1'
                ? 'FullName LIKE ?'
                : 'account.Id = ?';
        // Append % to the target based on targetType
        const targetWithWildcard = targetType !== '2' ? `%${target}%` : target;

        // TODO: Get ban information

        const query = `
            SELECT account.Id, Username, FullName, Avatar, Email,
                MAX(CASE WHEN Ban.LiftDate > NOW() THEN Ban.LiftDate ELSE NULL END) AS BanLiftDate
            FROM account
            LEFT JOIN user_bans Ban ON Ban.AccountId = account.Id
            WHERE ${filter}
            GROUP BY account.Id;
        `;

        pool.query(query, [targetWithWildcard], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }

            return res.status(200).json({ users: results });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}

exports.banUser = async (req: Request, res: Response) => {
    try {
        // Verify and decode the token, check admin role
        const jwt = req.headers?.authorization?.split(' ')[1];
        const adminId = verifyJwt(jwt);
        if (!adminId) return res.status(401).send('Not authorized');
        if (await checkAdminRole(adminId) === false) return res.status(401).json({ error: 'Not authorized' });
        // Get the target, (id)
        const target = req.params.target;
        // Get parameters
        const body: {
            banDuration?: string
        } = req.body;
        if (!body || !body.banDuration || !isPositiveNumeric(body.banDuration)) {
            return res.status(400).json({ error: 'Bad request' });
        }

        const liftDate = await banUserPromise(+body.banDuration, 'Hesabınız yasaklandı.', +target, adminId)

        if (liftDate) {
            await deleteUnapprovedPostsPromise(true, target)
            return res.status(200).json({ message: 'Success', banLiftDate: liftDate });
        }
        else
            return res.status(500).json({ message: 'Failed to ban' });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}

exports.liftBan = async (req: Request, res: Response) => {
    try {
        // Verify and decode the token, check admin role
        const jwt = req.headers?.authorization?.split(' ')[1];
        const adminId = verifyJwt(jwt);
        if (!adminId) return res.status(401).send('Not authorized');
        if (await checkAdminRole(adminId) === false) return res.status(401).json({ error: 'Not authorized' });
        // Get the target, (id)
        const target = req.params.target;

        const query = `DELETE FROM user_bans WHERE LiftDate > NOW() AND AccountId = ?;`;
        pool.query(query, [target], (qErr: any, results: any) => {
            if (qErr || results.affectedRows < 1) {
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