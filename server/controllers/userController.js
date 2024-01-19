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
const bcrypt = require('bcrypt');
const fs = __importStar(require("fs"));
const appDir = process.cwd();
const { OAuth2Client } = require('google-auth-library');
const helperUtils_1 = require("../utils/helperUtils");
const userUtils_1 = require("../utils/userUtils");
const pool = require('../db/db');
const googleOAuthClient = new OAuth2Client();
// Logs first time login date, IP and UserAgent
const logClient = (userId, req) => __awaiter(void 0, void 0, void 0, function* () {
    const ip = req.header('x-forwarded-for') || req.ip;
    const userAgent = req.get('User-Agent');
    if (!ip || !userAgent) {
        return false;
    }
    // Check if same exists
    const checkQuery = `
        SELECT COUNT(*) as Count FROM sign_in_log WHERE IpAddress = ? AND UserAgent = ? AND AccountId = ?;
    `;
    // Log sign-in
    const loggingQuery = `
        INSERT INTO sign_in_log (IpAddress, UserAgent, Date, AccountId)
        VALUES (?, ?, NOW(), ?);
    `;
    return new Promise((resolve, reject) => {
        pool.query(checkQuery, [ip, userAgent, userId], (qErr, results) => {
            if (qErr) {
                return resolve(false);
            }
            if (results[0].Count > 0) {
                return resolve(true);
            }
            pool.query(loggingQuery, [ip, userAgent, userId], (qErr, results) => {
                if (qErr) {
                    return resolve(false);
                }
                resolve(true);
            });
        });
    });
});
exports.signin = (req, res) => {
    try {
        const body = req.body;
        // Validate the request body
        if (!body || (0, helperUtils_1.isNullOrEmpty)(body.username) || (0, helperUtils_1.isNullOrEmpty)(body.password)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const username = body.username;
        const password = body.password;
        // Run the query
        const query = `
            SELECT
                A.Id,
                Username,
                FullName,
                Email,
                Avatar,
                Password,
                GROUP_CONCAT(role.RoleCode) AS Roles,
                MAX(CASE WHEN Ban.LiftDate > NOW() THEN Ban.LiftDate ELSE NULL END) AS BanLiftDate
            FROM account AS A
            LEFT JOIN account_role ON account_role.AccountId = A.Id
            LEFT JOIN role ON role.Id = account_role.RoleId
            LEFT JOIN user_bans Ban ON Ban.AccountId = A.Id
            WHERE Username = ? AND OAuthProviderId IS NULL
            GROUP BY A.Id;
        `;
        pool.query(query, [username], (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            // If username doesn't exist in db
            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Get user from results
            const user = results[0];
            // Authenticate
            bcrypt.compare(password, user.Password, (bErr, isMatch) => __awaiter(void 0, void 0, void 0, function* () {
                if (bErr) {
                    return res.status(500).json({ error: 'Bcrypt compare error' });
                }
                if (isMatch) {
                    // Check bans
                    if (user.BanLiftDate > 0) {
                        return res.status(403).json({ error: 'User is banned', banLiftDate: user.BanLiftDate });
                    }
                    // Log
                    const isLogged = yield logClient(user.Id, req);
                    if (!isLogged) {
                        return res.status(406).json({ error: 'Headers are not right' });
                    }
                    const userInfo = {
                        sub: user.Id,
                        username: user.Username,
                        fullName: user.FullName,
                        email: user.Email,
                        avatar: user.Avatar,
                        roles: user.Roles ? user.Roles.split(',') : undefined
                    };
                    // Get login type
                    const { type } = req.query;
                    // Check authority if the type is admin
                    if (type === 'admin' && userInfo.roles.length === 0) {
                        return res.status(401).json({ error: 'Not authorized' });
                    }
                    // Generate JWT
                    const JWT = (0, userUtils_1.createJwt)(userInfo);
                    return res.status(200).json({ JWT });
                }
                else {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }
            }));
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
exports.signup = (req, res) => {
    try {
        const body = req.body;
        // Validate the request body
        if (!body || (0, helperUtils_1.isNullOrEmpty)(body.username) || (0, helperUtils_1.isNullOrEmpty)(body.email) || (0, helperUtils_1.isNullOrEmpty)(body.password)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const username = body.username.trim();
        const fullName = (0, helperUtils_1.isNullOrEmpty)(body.fullName) ? null : body.fullName.trim();
        const email = body.email.trim();
        const password = body.password;
        // Check value lengths
        if (username.length < 3
            || username.length > 20
            || password.length < 5
            || password.length > 30) {
            return res.status(400).json({ error: 'Form data is not good enough' });
        }
        // Check if username or verified account already exists
        const checkExistingQuery = 'SELECT * FROM account WHERE Username = ? OR (Email = ? AND IsEmailValid = 1)';
        pool.query(checkExistingQuery, [username, email], (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error 1' });
            }
            if (results.length > 0) {
                return res.status(409).json({ error: 'Username in use or email has verified account' });
            }
        });
        // Hash the password
        bcrypt.hash(password, 10, (bErr, hash) => {
            if (bErr) {
                return res.status(500).json({ error: 'Password hashing error' });
            }
            // Run the query
            const signUpQuery = `
                INSERT INTO account (Username, FullName, Email, IsEmailValid, Password, Avatar, ExternalId, OAuthProviderId)
                VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL);
            `;
            pool.query(signUpQuery, [username, fullName, email, 0, hash], (qErr, results) => __awaiter(void 0, void 0, void 0, function* () {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error 2' });
                }
                // Log
                const isLogged = yield logClient(results.insertId, req);
                if (!isLogged) {
                    return res.status(406).json({ error: 'Headers are not right' });
                }
                // Generate JWT
                const JWT = (0, userUtils_1.createJwt)({
                    sub: results.insertId,
                    username: username,
                    fullName: fullName,
                    email: email,
                    avatar: null
                });
                return res.status(200).json({ JWT });
            }));
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
exports.authGoogle = (req, res) => {
    try {
        const body = req.body;
        // Validate the request body
        if (!body || !body.credentials) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // To use in then()
        const user = {
            sub: '',
            email: '',
            name: '',
            picture: null
        };
        // Verify google credentials response
        function verify() {
            return __awaiter(this, void 0, void 0, function* () {
                const ticket = yield googleOAuthClient.verifyIdToken({
                    idToken: body.credentials.credential,
                    audience: "714554272496-8aan1i53sdgkp9o9s78mlnu5af214ipk.apps.googleusercontent.com" // Not from body, env var could be used
                });
                const payload = ticket.getPayload();
                user.sub = payload['sub'];
                user.email = payload['email'];
                user.name = payload['name'];
                user.picture = payload['picture'];
            });
        }
        // Verify then move on to register/login
        verify()
            .then(() => {
            // Check if user exists
            const checkQuery = `
                    SELECT A.Id, Username, FullName, Email, Avatar,
                        GROUP_CONCAT(role.RoleCode) AS Roles,
                        MAX(CASE WHEN Ban.LiftDate > NOW() THEN Ban.LiftDate ELSE NULL END) AS BanLiftDate
                    FROM account A
                    LEFT JOIN account_role ON account_role.AccountId = A.Id
                    LEFT JOIN role ON role.Id = account_role.RoleId
                    LEFT JOIN user_bans Ban ON Ban.AccountId = A.Id
                    WHERE ExternalId = ? && OAuthProviderId = 1
                    GROUP BY A.Id;
                `;
            pool.query(checkQuery, [user.sub], (qErr, results) => __awaiter(void 0, void 0, void 0, function* () {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error 1' });
                }
                if (results.length > 0) {
                    // Login if user exists
                    // Get user
                    const existing = results[0];
                    // Check bans
                    if (existing.BanLiftDate > 0) {
                        return res.status(403).json({ error: 'User is banned', banLiftDate: existing.BanLiftDate });
                    }
                    // Log
                    const isLogged = yield logClient(existing.Id, req);
                    if (!isLogged) {
                        return res.status(406).json({ error: 'Headers are not right' });
                    }
                    // Generate JWT
                    const JWT = (0, userUtils_1.createJwt)({
                        sub: existing.Id,
                        username: existing.Username,
                        fullName: existing.FullName,
                        email: existing.Email,
                        avatar: existing.Avatar,
                        roles: existing.Roles ? existing.Roles.split(',') : undefined
                    });
                    return res.status(200).json({ JWT });
                }
                else {
                    // Register if user doesn't exist
                    // Username column has UNIQUE, even if it somehow conflicts, it will return 500
                    const uniqueUsername = user.name.replace(/\s/g, '') + '-' + Date.now();
                    // User avatar
                    let newAvatar = null;
                    // Skip the avatar upload if it fails
                    if (user.picture) {
                        newAvatar = yield fetchAndWriteImage(user.picture);
                    }
                    // Run the query
                    const signUpQuery = `
                            INSERT INTO account (Username, FullName, Email, IsEmailValid, Password, Avatar, ExternalId, OAuthProviderId)
                            VALUES (?, ?, ?, 1, NULL, ?, ?, 1);
                        `;
                    pool.query(signUpQuery, [uniqueUsername, user.name, user.email, newAvatar, user.sub], (qErr, results) => __awaiter(void 0, void 0, void 0, function* () {
                        if (qErr) {
                            return res.status(500).json({ error: 'Query error 2' });
                        }
                        // Log
                        const isLogged = yield logClient(results.insertId, req);
                        if (!isLogged) {
                            return res.status(406).json({ error: 'Headers are not right' });
                        }
                        // Generate JWT
                        const JWT = (0, userUtils_1.createJwt)({
                            sub: results.insertId,
                            username: uniqueUsername,
                            fullName: user.name,
                            email: user.email,
                            avatar: newAvatar
                        });
                        return res.status(200).json({ JWT });
                    }));
                }
            }));
        })
            .catch(() => {
            return res.status(401).json({ error: 'Unauthorized!' });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
exports.authFacebook = (req, res) => {
    try {
        const body = req.body;
        // Validate the request body
        if (!body || !body.accessToken || !body.userID) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        fetch(`https://graph.facebook.com/v18.0/${body.userID}?fields=id,name,email,picture&access_token=${body.accessToken}`, {
            method: 'GET'
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
            // Check if user exists
            const checkQuery = `
                    SELECT A.Id, Username, FullName, Email, Avatar,
                        GROUP_CONCAT(role.RoleCode) AS Roles,
                        MAX(CASE WHEN Ban.LiftDate > NOW() THEN Ban.LiftDate ELSE NULL END) AS BanLiftDate
                    FROM account A
                    LEFT JOIN account_role ON account_role.AccountId = A.Id
                    LEFT JOIN role ON Role.Id = account_role.RoleId
                    LEFT JOIN user_bans Ban ON Ban.AccountId = A.Id
                    WHERE ExternalId = ? && OAuthProviderId = 2
                    GROUP BY A.Id;
                `;
            pool.query(checkQuery, [data.id], (qErr, results) => __awaiter(void 0, void 0, void 0, function* () {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }
                if (results.length > 0) {
                    // Login if user exists
                    // Get user
                    const existing = results[0];
                    // Check bans
                    if (existing.BanLiftDate > 0) {
                        return res.status(403).json({ error: 'User is banned', banLiftDate: existing.BanLiftDate });
                    }
                    // Log
                    const isLogged = yield logClient(existing.Id, req);
                    if (!isLogged) {
                        return res.status(406).json({ error: 'Headers are not right' });
                    }
                    // Generate JWT
                    const JWT = (0, userUtils_1.createJwt)({
                        sub: existing.Id,
                        username: existing.Username,
                        fullName: existing.FullName,
                        email: existing.Email,
                        avatar: existing.Avatar,
                        roles: existing.Roles ? existing.Roles.split(',') : undefined
                    });
                    return res.status(200).json({ JWT });
                }
                else {
                    // Register if user doesn't exist
                    // Username column has UNIQUE, even if it somehow conflicts, it will return 500
                    const uniqueUsername = data.name.replace(/\s/g, '') + '-' + Date.now();
                    // User avatar
                    let newAvatar = null;
                    // Skip the avatar upload if it fails
                    if (data.picture) {
                        newAvatar = yield fetchAndWriteImage(data.picture);
                    }
                    // Run the query
                    const signUpQuery = `
                            INSERT INTO account (Username, FullName, Email, IsEmailValid, Password, Avatar, ExternalId, OAuthProviderId)
                            VALUES (?, ?, ?, 1, NULL, ?, ?, 2);
                        `;
                    pool.query(signUpQuery, [uniqueUsername, data.name, data.email, newAvatar, data.id], (qErr, results) => __awaiter(void 0, void 0, void 0, function* () {
                        if (qErr) {
                            return res.status(500).json({ error: 'Query error' });
                        }
                        // Log
                        const isLogged = yield logClient(results.insertId, req);
                        if (!isLogged) {
                            return res.status(406).json({ error: 'Headers are not right' });
                        }
                        // Generate JWT
                        const JWT = (0, userUtils_1.createJwt)({
                            sub: results.insertId,
                            username: uniqueUsername,
                            fullName: data.name,
                            email: data.email,
                            avatar: newAvatar
                        });
                        return res.status(200).json({ JWT });
                    }));
                }
            }));
        })
            .catch((error) => {
            return res.status(500).json({ error: 'Unauthorized!' });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
function fetchAndWriteImage(imgLink) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const imgRes = yield fetch(imgLink, {
                method: 'GET',
                headers: {
                    'Content-Type': 'image/*'
                }
            });
            if (imgRes.status === 200) {
                const buffer = yield imgRes.arrayBuffer();
                const fileName = `avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
                const filePath = appDir + '/uploaded/avatar/' + fileName;
                fs.writeFileSync(filePath, Buffer.from(buffer));
                return fileName;
            }
            else {
                throw new Error(`Image couldn't be fetched`);
            }
        }
        catch (error) {
            return null;
        }
    });
}
/* May be used for target user's info rather than "my info"
exports.getUserInfo = (req: Request, res: Response) => {
    try {
        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');

        // Get user information
        const query = 'SELECT Username, FullName, Email, Avatar FROM Account WHERE Id = ?';
        pool.query(query, [userId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            // Info
            const user = results[0];

            return res.status(200).json({ user });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}*/
const comparePasswords = (passwordOld, prevPassword) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        bcrypt.compare(passwordOld, prevPassword, (bErr, isMatch) => {
            if (bErr) {
                reject(bErr);
            }
            else {
                resolve(isMatch);
            }
        });
    });
});
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (bErr, hash) => {
            if (bErr) {
                resolve(null);
            }
            else {
                resolve(hash);
            }
        });
    });
});
exports.editProfile = (req, res) => {
    var _a, _b;
    try {
        // Verify and decode the token
        const jwt = (_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1];
        const userId = (0, userUtils_1.verifyJwt)(jwt);
        if (!userId)
            return res.status(401).send('Not authorized');
        // Get request body
        const body = req.body;
        if (!body)
            return res.status(400).json({ error: 'Missing required fields' });
        const newFullName = body.fullName;
        const newEmail = body.email;
        const passwordOld = body.passwordOld;
        const passwordNew = body.passwordNew;
        // Get user information for comparing
        const query = 'SELECT FullName, Email, Password FROM account WHERE Id = ?;';
        pool.query(query, [userId], (qErr, results) => __awaiter(void 0, void 0, void 0, function* () {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            // Previous info
            const prev = results[0];
            // Edit query to change necessary columns
            let validChanges = false;
            const parameters = [];
            let sets = [];
            // New full name
            if (!(0, helperUtils_1.isNullOrEmpty)(newFullName) && newFullName !== prev.FullName) {
                sets.push('FullName = ?');
                parameters.push(newFullName);
                validChanges = true;
            }
            // New email
            if (!(0, helperUtils_1.isNullOrEmpty)(newEmail) && newEmail !== prev.Email) {
                sets.push('Email = ?');
                parameters.push(newEmail);
                // Reset email verification because email is changed
                sets.push('IsEmailValid = 0');
                validChanges = true;
            }
            // Verify password and set
            if (!(0, helperUtils_1.isNullOrEmpty)(passwordNew) && !(0, helperUtils_1.isNullOrEmpty)(passwordOld)) {
                // Verify
                const isMatch = yield comparePasswords(passwordOld, prev.Password);
                if (isMatch) {
                    const hash = yield hashPassword(passwordNew);
                    if (hash) {
                        sets.push('Password = ?');
                        parameters.push(hash);
                        validChanges = true;
                    }
                }
            }
            // If no changes detected, return
            if (validChanges === false)
                return res.status(400).json({ error: 'Missing required fields' });
            // Combine the query
            const setSection = sets.join(', ');
            const updateQuery = 'UPDATE account SET ' + setSection + ' WHERE Id = ?;';
            parameters.push(userId);
            // Finally, update
            pool.query(updateQuery, parameters, (qErr, results) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }
                // Get updated user
                const selectQuery = 'SELECT Id, Username, FullName, Email, Avatar FROM account WHERE Id = ?;';
                pool.query(selectQuery, [userId], (qErr, results) => {
                    if (qErr) {
                        return res.status(500).json({ error: 'Query error' });
                    }
                    // Get user from results
                    const user = results[0];
                    // Generate JWT
                    const JWT = (0, userUtils_1.createJwt)({
                        sub: user.Id,
                        username: user.Username,
                        fullName: user.FullName,
                        email: user.Email,
                        avatar: user.Avatar
                    });
                    return res.status(200).json({ JWT });
                });
            });
        }));
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
exports.deleteAvatar = (req, res) => {
    var _a, _b;
    try {
        // Verify and decode the token
        const jwt = (_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1];
        const userId = (0, userUtils_1.verifyJwt)(jwt);
        if (!userId)
            return res.status(401).send('Not authorized');
        // Get image name
        const query = `SELECT Avatar FROM account WHERE Id = ?;`;
        pool.query(query, [userId], (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            // Verify image name
            const imageName = results[0].Avatar;
            if (!imageName) {
                return res.status(404).json({ error: 'Image not found' });
            }
            // Delete from storage
            const imgPath = `${appDir}/uploaded/avatar/${imageName}`;
            if (fs.existsSync(imgPath)) {
                fs.unlinkSync(imgPath);
            }
            // Delete from Account table
            const deleteAvatarQuery = `UPDATE account SET Avatar = NULL WHERE Id = ?;`;
            pool.query(deleteAvatarQuery, [userId], (qErr, results) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }
                // Get updated user
                const selectQuery = 'SELECT Id, Username, FullName, Email, Avatar FROM account WHERE Id = ?;';
                pool.query(selectQuery, [userId], (qErr, results) => {
                    if (qErr) {
                        return res.status(500).json({ error: 'Query error' });
                    }
                    // Get user from results
                    const user = results[0];
                    // Generate JWT
                    const JWT = (0, userUtils_1.createJwt)({
                        sub: user.Id,
                        username: user.Username,
                        fullName: user.FullName,
                        email: user.Email,
                        avatar: user.Avatar
                    });
                    return res.status(200).json({ JWT });
                });
            });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
exports.uploadAvatar = (req, res) => {
    var _a, _b;
    try {
        // Get the uploaded file
        if (!req.file)
            throw new Error('Image upload error');
        const newAvatar = {
            name: req.file.filename,
            path: req.file.path // Full directory path
        };
        // Deletes the uploaded images when called
        const deleteUploadedOnError = () => {
            if (fs.existsSync(newAvatar.path)) {
                fs.unlinkSync(newAvatar.path);
            }
        };
        // Verify and decode the token
        const jwt = (_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1];
        const userId = (0, userUtils_1.verifyJwt)(jwt);
        if (!userId) {
            deleteUploadedOnError();
            return res.status(401).send('Not authorized');
        }
        // Get old avatar name
        const query = `SELECT Avatar FROM account WHERE Id = ?;`;
        pool.query(query, [userId], (qErr, results) => {
            if (qErr) {
                deleteUploadedOnError();
                return res.status(500).json({ error: 'Query error' });
            }
            // Delete from storage if there is an old avatar
            if (results.length > 0 && results[0].Avatar) {
                const imgPath = `${appDir}/uploaded/avatar/${results[0].Avatar}`;
                if (fs.existsSync(imgPath)) {
                    fs.unlinkSync(imgPath);
                }
            }
            // Update the avatar
            const query = `UPDATE account SET Avatar = ? WHERE Id = ?`;
            pool.query(query, [newAvatar.name, userId], (qErr, results) => {
                if (qErr) {
                    deleteUploadedOnError();
                    return res.status(500).json({ error: 'Query error' });
                }
                // Get updated user
                const selectQuery = 'SELECT Id, Username, FullName, Email, Avatar FROM account WHERE Id = ?;';
                pool.query(selectQuery, [userId], (qErr, results) => {
                    if (qErr) {
                        // We don't call deleteUploadedOnError(); because it didn't fail during UPDATE
                        return res.status(500).json({ error: 'Query error' });
                    }
                    // Get user from results
                    const user = results[0];
                    // Generate JWT
                    const JWT = (0, userUtils_1.createJwt)({
                        sub: user.Id,
                        username: user.Username,
                        fullName: user.FullName,
                        email: user.Email,
                        avatar: user.Avatar
                    });
                    return res.status(200).json({ JWT });
                });
            });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
exports.getUserProfile = (req, res) => {
    var _a, _b;
    try {
        // Get user id
        // Verify and decode the token
        const jwt = (_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1];
        const userId = (0, userUtils_1.verifyJwt)(jwt);
        if (!userId)
            return res.status(401).send('Not authorized');
        // Fetch user's posts (excluding posts with deleted status which is 4, "Onay bekliyor/5" is okay)
        let query = `
            SELECT JP.Id, JP.Title, TIMESTAMPDIFF(SECOND, CreatedAt, NOW()) AS SecondsAgo,
                (
                    SELECT JPI.Body
                    FROM job_posting_images JPI
                    WHERE JP.Id = JPI.JobPostingId
                    ORDER BY JPI.ImgIndex
                    LIMIT 1
                ) AS MainImage,
                JP.CurrentStatusId,
                C.Code AS CategoryCode
            FROM job_posting JP
            LEFT JOIN sub_category SC ON SC.Id = JP.SubCategoryId
            LEFT JOIN category C ON C.Id = SC.CategoryId
            WHERE JP.CurrentStatusId != 4 AND JP.AccountId = ?
            ORDER BY SecondsAgo DESC;
        `;
        pool.query(query, [userId], (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            const posts = results;
            const query2 = `
                SELECT CI.Body AS Body, CI.ContactTypeId AS Type
                FROM contact_information CI
                WHERE CI.AccountId = ?
            `;
            pool.query(query2, [userId], (qErr2, results2) => {
                if (qErr2) {
                    return res.status(500).json({ error: 'Query error' });
                }
                const contactInfo = results2;
                return res.status(200).json({ posts, contactInfo });
            });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
exports.updateContactInfo = (req, res) => {
    var _a, _b;
    try {
        // Get user id
        // Verify and decode the token
        const jwt = (_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1];
        const userId = (0, userUtils_1.verifyJwt)(jwt);
        if (!userId)
            return res.status(401).send('Not authorized');
        // Get request body
        const body = req.body;
        if (!body || !body.contactInfo || !Array.isArray(body.contactInfo)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const contactInfo = body.contactInfo;
        // New contact queries
        const queries = [];
        const parameters = [];
        for (let i = 0; i < contactInfo.length; i++) {
            const info = contactInfo[i];
            // Only 5 contact info is allowed
            if (i > 4) {
                break;
            }
            // Check, then push
            if ((0, helperUtils_1.isNullOrEmpty)(info.Body) || info.Body.trim().length > 60 || ![1, 2, 3, 4, 5].includes(info.Type))
                continue;
            queries.push('INSERT INTO contact_information(Body, ContactTypeId, AccountId) VALUES(?, ?, ?);');
            parameters.push(info.Body, info.Type, userId);
        }
        // Delete the existing contact information
        const deleteQuery = `DELETE FROM contact_information WHERE AccountId = ?;`;
        pool.query(deleteQuery, [userId], (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            // Return empty list if user deleted all. It's okay
            if (queries.length === 0) {
                return res.status(200).json({ contactInfo: [] });
            }
            // Add all contact info at the same time
            const newContactsQuery = queries.join('');
            pool.query(newContactsQuery, parameters, (qErr, results) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }
                const selectQuery = `
                    SELECT CI.Body AS Body, CI.ContactTypeId AS Type
                    FROM contact_information CI
                    WHERE CI.AccountId = ?
                `;
                pool.query(selectQuery, [userId], (qErr, results) => {
                    if (qErr) {
                        return res.status(500).json({ error: 'Query error' });
                    }
                    return res.status(200).json({ contactInfo: results });
                });
            });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
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
