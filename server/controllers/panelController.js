"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const appDir = process.cwd();
const userUtils_1 = require("../utils/userUtils");
const helperUtils_1 = require("../utils/helperUtils");
const pool = require('../db/db');
const checkAdminRole = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check authorization
    const query = `
        SELECT COUNT(*) AS Count
        FROM account_role
        WHERE AccountId = ?;
    `;
    return new Promise((resolve, reject) => {
        pool.query(query, [userId], (qErr, results) => {
            if (qErr) {
                // Todo: Log error
                return resolve(false);
            }
            resolve(results[0].Count > 0);
        });
    });
});
const banUserPromise = (banDuration, reason, targetId, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
        INSERT INTO user_bans(BannedAt, LiftDate, Reason, AccountId, AdminId)
        VALUES (NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?, ?);
    `;
    return yield new Promise((resolve, reject) => {
        pool.query(query, [banDuration, reason, targetId, adminId], (qErr, results) => {
            if (qErr) {
                return resolve(null);
            }
            // Calculate the lift date using banDuration
            const liftDate = new Date();
            liftDate.setDate(liftDate.getDate() + banDuration);
            // Resolve with the lift date
            resolve(liftDate.toISOString());
        });
    });
});
// Deletes an individual post, its images and the images from the storage
// If user is banned, it deletes all the unapproved job postings of the person
const deleteUnapprovedPostsPromise = (userBanned, accountId, postId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        // Make sure post id exists in case user is not banned
        if (!userBanned && !postId) {
            return resolve(false);
        }
        // Update post(s) to set current status to 4 (deleted)
        const filterType = userBanned ? 'CurrentStatusId = 5 AND AccountId' : 'Id';
        const filterId = userBanned ? accountId : postId;
        const query = `UPDATE job_posting SET CurrentStatusId = 4 WHERE ${filterType} = ?;`;
        pool.query(query, [filterId], (qErr, results) => {
            if (qErr) {
                return resolve(false);
            }
            // FOR IMAGES
            let queryPostImages = ` FROM job_posting_images JPI`;
            if (userBanned) {
                queryPostImages += ` LEFT JOIN job_posting JP ON JPI.JobPostingId = JP.Id WHERE JP.AccountId = ? AND JP.CurrentStatusId = 4;`;
            }
            else {
                queryPostImages += ` WHERE JobPostingId = ?;`;
            }
            // Get images of the post(s) if there are any
            pool.query('SELECT JPI.Body' + queryPostImages, [filterId], (qErr, imageResults) => __awaiter(void 0, void 0, void 0, function* () {
                if (qErr) {
                    return resolve(false);
                }
                // Delete all these images
                if (imageResults.length > 0) {
                    // Delete from database
                    pool.query('DELETE JPI' + queryPostImages, [filterId], (qErr, results) => {
                        if (qErr) {
                            return resolve(false);
                        }
                        // Delete from storage
                        imageResults.forEach((obj) => {
                            const path = appDir + '/uploaded/post/' + obj.Body;
                            if (fs.existsSync(path)) {
                                fs.unlinkSync(path);
                            }
                        });
                        return resolve(true);
                    });
                }
                resolve(true);
            }));
        });
    }));
});
exports.waitingApproval = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Verify and decode the token, check admin role
        const jwt = (_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1];
        const userId = (0, userUtils_1.verifyJwt)(jwt);
        if (!userId)
            return res.status(401).send('Not authorized');
        if ((yield checkAdminRole(userId)) === false)
            return res.status(401).json({ error: 'Not authorized' });
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
        pool.query(query, (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            return res.status(200).json({ posts: results });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
});
exports.adminUpdatePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        // Verify and decode the token, check admin role
        const jwt = (_d = (_c = req.headers) === null || _c === void 0 ? void 0 : _c.authorization) === null || _d === void 0 ? void 0 : _d.split(' ')[1];
        const adminId = (0, userUtils_1.verifyJwt)(jwt);
        if (!adminId)
            return res.status(401).send('Not authorized');
        if ((yield checkAdminRole(adminId)) === false)
            return res.status(401).json({ error: 'Not authorized' });
        // Get post id and the action
        const postId = req.params.postId;
        const action = req.params.action;
        if (action === 'approve' || action === 'complete') {
            const query = `UPDATE job_posting SET CurrentStatusId = ${action === 'approve' ? '1' : '3'} WHERE Id = ?;`;
            pool.query(query, [postId], (qErr, results) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }
                return res.status(200).json({ message: 'Success' });
            });
        }
        else if (action === 'reject' || action === 'delete') {
            // Get reject parameters
            let banDuration = 0;
            const body = req.body;
            if (body)
                banDuration = +body.banDuration;
            // Check job posting and get the account id
            const query = `SELECT AccountId FROM job_posting WHERE Id = ?;`;
            pool.query(query, [postId], (qErr, results) => __awaiter(void 0, void 0, void 0, function* () {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }
                if (results.length === 0) {
                    return res.status(404).json({ error: 'Post not found' });
                }
                const postOwnerId = results[0].AccountId;
                // Delete the unapproved post(s)
                const success = yield deleteUnapprovedPostsPromise(+banDuration > 0, postOwnerId, postId);
                // Ban the account
                if (+banDuration > 0) {
                    const reason = `Gönderinizde yasaklanmanızı gerektiren bir problem tesbit ettik.`;
                    const liftDate = yield banUserPromise(+banDuration, reason, postOwnerId, adminId);
                    if (!liftDate) {
                        return res.status(500).json({ message: 'Failed to ban' });
                    }
                }
                if (!success) {
                    return res.status(500).json({ message: 'Failed to remove the post or posts' });
                }
                return res.status(200).json({ message: 'Success' });
            }));
        }
        else {
            return res.status(400).json({ error: 'Bad request' });
        }
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
});
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
exports.getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    try {
        // Verify and decode the token, check admin role
        const jwt = (_f = (_e = req.headers) === null || _e === void 0 ? void 0 : _e.authorization) === null || _f === void 0 ? void 0 : _f.split(' ')[1];
        const adminId = (0, userUtils_1.verifyJwt)(jwt);
        if (!adminId)
            return res.status(401).send('Not authorized');
        if ((yield checkAdminRole(adminId)) === false)
            return res.status(401).json({ error: 'Not authorized' });
        // Get the target, (username | fullName | id)
        const target = req.params.target;
        // Get type
        const { targetType } = req.query;
        if ((0, helperUtils_1.isNullOrEmpty)(target) || !targetType || !['0', '1', '2'].includes(targetType)) {
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
        pool.query(query, [targetWithWildcard], (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            return res.status(200).json({ users: results });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
});
exports.banUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h;
    try {
        // Verify and decode the token, check admin role
        const jwt = (_h = (_g = req.headers) === null || _g === void 0 ? void 0 : _g.authorization) === null || _h === void 0 ? void 0 : _h.split(' ')[1];
        const adminId = (0, userUtils_1.verifyJwt)(jwt);
        if (!adminId)
            return res.status(401).send('Not authorized');
        if ((yield checkAdminRole(adminId)) === false)
            return res.status(401).json({ error: 'Not authorized' });
        // Get the target, (id)
        const target = req.params.target;
        // Get parameters
        const body = req.body;
        if (!body || !body.banDuration || !(0, helperUtils_1.isPositiveNumeric)(body.banDuration)) {
            return res.status(400).json({ error: 'Bad request' });
        }
        const liftDate = yield banUserPromise(+body.banDuration, 'Hesabınız yasaklandı.', +target, adminId);
        if (liftDate) {
            yield deleteUnapprovedPostsPromise(true, target);
            return res.status(200).json({ message: 'Success', banLiftDate: liftDate });
        }
        else
            return res.status(500).json({ message: 'Failed to ban' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
});
exports.liftBan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k;
    try {
        // Verify and decode the token, check admin role
        const jwt = (_k = (_j = req.headers) === null || _j === void 0 ? void 0 : _j.authorization) === null || _k === void 0 ? void 0 : _k.split(' ')[1];
        const adminId = (0, userUtils_1.verifyJwt)(jwt);
        if (!adminId)
            return res.status(401).send('Not authorized');
        if ((yield checkAdminRole(adminId)) === false)
            return res.status(401).json({ error: 'Not authorized' });
        // Get the target, (id)
        const target = req.params.target;
        const query = `DELETE FROM user_bans WHERE LiftDate > NOW() AND AccountId = ?;`;
        pool.query(query, [target], (qErr, results) => {
            if (qErr || results.affectedRows < 1) {
                return res.status(500).json({ error: 'Query error' });
            }
            return res.status(200).json({ message: 'Success' });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
});
exports.asdf = (req, res) => {
    try {
        const query = ``;
        pool.query(query, (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            return res.status(200).json({});
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
