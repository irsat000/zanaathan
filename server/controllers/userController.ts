

const bcrypt = require('bcrypt');
import { Request, Response } from 'express';
import * as fs from 'fs';
const path = require('path');
const appDir = path.dirname(require.main?.filename);
const { OAuth2Client } = require('google-auth-library');
import { isNullOrEmpty } from '../utils/helperUtils';
import { createJwt, verifyJwt, JWT } from '../utils/userUtils';

const pool = require('../db/db');
const googleOAuthClient = new OAuth2Client();

interface SigninBody {
    username: string;
    password: string;
}
interface SignupBody {
    username: string;
    fullName: string;
    email: string;
    password: string;
}


const logClient = async (userId: number, req: Request): Promise<boolean> => {
    const ip = req.header('x-forwarded-for') || req.ip;
    const userAgent = req.get('User-Agent');

    if (!ip || !userAgent) {
        return false;
    }

    // Log sign-in
    const query = `
        INSERT INTO sign_in_log (IpAddress, UserAgent, Date, AccountId)
        VALUES (?, ?, NOW(), ?)
    `;

    return new Promise((resolve, reject) => {
        pool.query(query, [ip, userAgent, userId], (qErr: any, results: any) => {
            if (qErr) {
                resolve(false);
            }
            resolve(true);
        });
    });
}

exports.signin = (req: Request, res: Response) => {
    try {
        const body: SigninBody = req.body;
        // Validate the request body
        if (!body || isNullOrEmpty(body.username) || isNullOrEmpty(body.password)) {
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
        pool.query(query, [username], (qErr: any, results: any) => {
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
            bcrypt.compare(password, user.Password, async (bErr: any, isMatch: boolean) => {
                if (bErr) {
                    return res.status(500).json({ error: 'Bcrypt compare error' });
                }

                if (isMatch) {
                    // Check bans
                    if (user.BanLiftDate > 0) {
                        return res.status(403).json({ error: 'User is banned', banLiftDate: user.BanLiftDate });
                    }

                    // Log
                    const isLogged = await logClient(user.Id, req);
                    if (!isLogged) {
                        return res.status(406).json({ error: 'Headers are not right' });
                    }

                    const userInfo: JWT = {
                        sub: user.Id,
                        username: user.Username,
                        fullName: user.FullName,
                        email: user.Email,
                        avatar: user.Avatar,
                        roles: user.Roles ? user.Roles.split(',') : undefined
                    }
                    // Get login type
                    const { type } = req.query as {
                        type?: string
                    }
                    // Check authority if the type is admin
                    if (type === 'admin' && userInfo.roles!.length === 0) {
                        return res.status(401).json({ error: 'Not authorized' });
                    }
                    // Generate JWT
                    const JWT = createJwt(userInfo);
                    return res.status(200).json({ JWT });
                } else {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }
            });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}


exports.signup = (req: Request, res: Response) => {
    try {
        const body: SignupBody = req.body;
        // Validate the request body
        if (!body || isNullOrEmpty(body.username) || isNullOrEmpty(body.email) || isNullOrEmpty(body.password)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const username = body.username.trim();
        const fullName = isNullOrEmpty(body.fullName) ? null : body.fullName.trim();
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
        pool.query(checkExistingQuery, [username, email], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            if (results.length > 0) {
                return res.status(409).json({ error: 'Username in use or email has verified account' });
            }
        });

        // Hash the password
        bcrypt.hash(password, 10, (bErr: any, hash: string) => {
            if (bErr) {
                return res.status(500).json({ error: 'Password hashing error' });
            }

            // Run the query
            const signUpQuery = `
                INSERT INTO account (Username, FullName, Email, IsEmailValid, Password, Avatar, ExternalId, OAuthProviderId)
                VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL);
            `;
            pool.query(signUpQuery, [username, fullName, email, 0, hash], async (qErr: any, results: any) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }

                // Log
                const isLogged = await logClient(results.insertId, req);
                if (!isLogged) {
                    return res.status(406).json({ error: 'Headers are not right' });
                }

                // Generate JWT
                const JWT = createJwt({
                    sub: results.insertId,
                    username: username,
                    fullName: fullName,
                    email: email,
                    avatar: null
                });
                return res.status(200).json({ JWT });
            });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}


// Picture is not nullable, but may be in old account
interface GoogleUser {
    sub: string;
    email: string;
    name: string;
    picture: string | null;
}

exports.authGoogle = (req: Request, res: Response) => {
    try {
        const body = req.body;
        // Validate the request body
        if (!body || !body.credentials) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // To use in then()
        const user: GoogleUser = {
            sub: '',
            email: '',
            name: '',
            picture: null
        };
        // Verify google credentials response
        async function verify() {
            const ticket = await googleOAuthClient.verifyIdToken({
                idToken: body.credentials.credential,
                audience: "714554272496-8aan1i53sdgkp9o9s78mlnu5af214ipk.apps.googleusercontent.com" // Not from body
            });
            const payload = ticket.getPayload();
            user.sub = payload['sub'];
            user.email = payload['email'];
            user.name = payload['name'];
            user.picture = payload['picture'];
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
                    LEFT JOIN role ON Role.Id = account_role.RoleId
                    LEFT JOIN user_bans Ban ON Ban.AccountId = A.Id
                    WHERE ExternalId = ? && OAuthProviderId = 1
                    GROUP BY A.Id;
                `;
                pool.query(checkQuery, [user.sub], async (qErr: any, results: any) => {
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
                        const isLogged = await logClient(existing.Id, req);
                        if (!isLogged) {
                            return res.status(406).json({ error: 'Headers are not right' });
                        }

                        // Generate JWT
                        const JWT = createJwt({
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
                        let newAvatar: string | null = null;
                        // Skip the avatar upload if it fails
                        if (user.picture) {
                            newAvatar = await fetchAndWriteImage(user.picture);
                        }

                        // Run the query
                        const signUpQuery = `
                            INSERT INTO account (Username, FullName, Email, IsEmailValid, Password, Avatar, ExternalId, OAuthProviderId)
                            VALUES (?, ?, ?, 1, NULL, ?, ?, 1);
                        `;
                        pool.query(signUpQuery, [uniqueUsername, user.name, user.email, newAvatar, user.sub], async (qErr: any, results: any) => {
                            if (qErr) {
                                return res.status(500).json({ error: 'Query error' });
                            }

                            // Log
                            const isLogged = await logClient(results.insertId, req);
                            if (!isLogged) {
                                return res.status(406).json({ error: 'Headers are not right' });
                            }

                            // Generate JWT
                            const JWT = createJwt({
                                sub: results.insertId,
                                username: uniqueUsername,
                                fullName: user.name,
                                email: user.email,
                                avatar: newAvatar
                            });

                            return res.status(200).json({ JWT });
                        });
                    }
                });
            })
            .catch(() => {
                return res.status(401).json({ error: 'Unauthorized!' });
            });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}


exports.authFacebook = (req: Request, res: Response) => {
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
                pool.query(checkQuery, [data.id], async (qErr: any, results: any) => {
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
                        const isLogged = await logClient(existing.Id, req);
                        if (!isLogged) {
                            return res.status(406).json({ error: 'Headers are not right' });
                        }

                        // Generate JWT
                        const JWT = createJwt({
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
                        let newAvatar: string | null = null;
                        // Skip the avatar upload if it fails
                        if (data.picture) {
                            newAvatar = await fetchAndWriteImage(data.picture);
                        }

                        // Run the query
                        const signUpQuery = `
                            INSERT INTO account (Username, FullName, Email, IsEmailValid, Password, Avatar, ExternalId, OAuthProviderId)
                            VALUES (?, ?, ?, 1, NULL, ?, ?, 2);
                        `;
                        pool.query(signUpQuery, [uniqueUsername, data.name, data.email, newAvatar, data.id], async (qErr: any, results: any) => {
                            if (qErr) {
                                return res.status(500).json({ error: 'Query error' });
                            }

                            // Log
                            const isLogged = await logClient(results.insertId, req);
                            if (!isLogged) {
                                return res.status(406).json({ error: 'Headers are not right' });
                            }

                            // Generate JWT
                            const JWT = createJwt({
                                sub: results.insertId,
                                username: uniqueUsername,
                                fullName: data.name,
                                email: data.email,
                                avatar: newAvatar
                            });

                            return res.status(200).json({ JWT });
                        });
                    }
                });
            })
            .catch((error) => {
                return res.status(500).json({ error: 'Unauthorized!' });
            });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}

async function fetchAndWriteImage(imgLink: string) {
    try {
        const imgRes = await fetch(imgLink, {
            method: 'GET',
            headers: {
                'Content-Type': 'image/*'
            }
        })
        if (imgRes.status === 200) {
            const buffer = await imgRes.arrayBuffer();
            const fileName = `avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
            const filePath = appDir + '/uploaded/avatar/' + fileName;
            fs.writeFileSync(filePath, Buffer.from(buffer));
            return fileName;
        }
        else {
            throw new Error(`Image couldn't be fetched`);
        }
    } catch (error) {
        return null;
    }
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

const comparePasswords = async (passwordOld: string, prevPassword: string) => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(passwordOld, prevPassword, (bErr: any, isMatch: boolean) => {
            if (bErr) {
                reject(bErr);
            } else {
                resolve(isMatch);
            }
        });
    });
};

const hashPassword = async (password: string) => {
    return new Promise<string | null>((resolve, reject) => {
        bcrypt.hash(password, 10, (bErr: any, hash: string) => {
            if (bErr) {
                resolve(null);
            } else {
                resolve(hash);
            }
        });
    });
};

exports.editProfile = (req: Request, res: Response) => {
    try {
        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');
        // Get request body
        const body = req.body;
        if (!body) return res.status(400).json({ error: 'Missing required fields' });
        const newFullName = body.fullName;
        const newEmail = body.email;
        const passwordOld = body.passwordOld;
        const passwordNew = body.passwordNew;

        // Get user information for comparing
        const query = 'SELECT FullName, Email, Password FROM account WHERE Id = ?;';
        pool.query(query, [userId], async (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            // Previous info
            const prev = results[0];

            // Edit query to change necessary columns
            let validChanges = false;
            const parameters: (string | number)[] = [];

            let sets = [];
            // New full name
            if (!isNullOrEmpty(newFullName) && newFullName !== prev.FullName) {
                sets.push('FullName = ?')
                parameters.push(newFullName);
                validChanges = true;
            }
            // New email
            if (!isNullOrEmpty(newEmail) && newEmail !== prev.Email) {
                sets.push('Email = ?')
                parameters.push(newEmail);
                // Reset email verification because email is changed
                sets.push('IsEmailValid = 0')
                validChanges = true;
            }
            // Verify password and set
            if (!isNullOrEmpty(passwordNew) && !isNullOrEmpty(passwordOld)) {
                // Verify
                const isMatch = await comparePasswords(passwordOld, prev.Password);
                if (isMatch) {
                    const hash = await hashPassword(passwordNew);
                    if (hash) {
                        sets.push('Password = ?');
                        parameters.push(hash);
                        validChanges = true;
                    }
                }
            }
            // If no changes detected, return
            if (validChanges === false) return res.status(400).json({ error: 'Missing required fields' });
            // Combine the query
            const setSection = sets.join(', ');
            const updateQuery = 'UPDATE account SET ' + setSection + ' WHERE Id = ?;';
            parameters.push(userId);

            // Finally, update
            pool.query(updateQuery, parameters, (qErr: any, results: any) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }

                // Get updated user
                const selectQuery = 'SELECT Id, Username, FullName, Email, Avatar FROM account WHERE Id = ?;';
                pool.query(selectQuery, [userId], (qErr: any, results: any) => {
                    if (qErr) {
                        return res.status(500).json({ error: 'Query error' });
                    }
                    // Get user from results
                    const user = results[0];
                    // Generate JWT
                    const JWT = createJwt({
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
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}


exports.deleteAvatar = (req: Request, res: Response) => {
    try {
        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');
        // Get image name
        const query = `SELECT Avatar FROM account WHERE Id = ?;`;
        pool.query(query, [userId], (qErr: any, results: any) => {
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
                fs.unlinkSync(imgPath)
            }
            // Delete from Account table
            const deleteAvatarQuery = `UPDATE account SET Avatar = NULL WHERE Id = ?;`;
            pool.query(deleteAvatarQuery, [userId], (qErr: any, results: any) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }

                // Get updated user
                const selectQuery = 'SELECT Id, Username, FullName, Email, Avatar FROM account WHERE Id = ?;';
                pool.query(selectQuery, [userId], (qErr: any, results: any) => {
                    if (qErr) {
                        return res.status(500).json({ error: 'Query error' });
                    }
                    // Get user from results
                    const user = results[0];
                    // Generate JWT
                    const JWT = createJwt({
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
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}

exports.uploadAvatar = (req: Request, res: Response) => {
    try {
        // Get the uploaded file
        if (!req.file) throw new Error('Image upload error');
        const newAvatar = {
            name: req.file.filename, // Has extension
            path: req.file.path // Full directory path
        };

        // Deletes the uploaded images when called
        const deleteUploadedOnError = () => {
            if (fs.existsSync(newAvatar.path)) {
                fs.unlinkSync(newAvatar.path)
            }
        }

        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) {
            deleteUploadedOnError();
            return res.status(401).send('Not authorized');
        }


        // Get old avatar name
        const query = `SELECT Avatar FROM account WHERE Id = ?;`;
        pool.query(query, [userId], (qErr: any, results: any) => {
            if (qErr) {
                deleteUploadedOnError();
                return res.status(500).json({ error: 'Query error' });
            }
            // Delete from storage if there is an old avatar
            if (results.length > 0 && results[0].Avatar) {
                const imgPath = `${appDir}/uploaded/avatar/${results[0].Avatar}`;
                if (fs.existsSync(imgPath)) {
                    fs.unlinkSync(imgPath)
                }
            }

            // Update the avatar
            const query = `UPDATE account SET Avatar = ? WHERE Id = ?`;
            pool.query(query, [newAvatar.name, userId], (qErr: any, results: any) => {
                if (qErr) {
                    deleteUploadedOnError();
                    return res.status(500).json({ error: 'Query error' });
                }

                // Get updated user
                const selectQuery = 'SELECT Id, Username, FullName, Email, Avatar FROM account WHERE Id = ?;';
                pool.query(selectQuery, [userId], (qErr: any, results: any) => {
                    if (qErr) {
                        // We don't call deleteUploadedOnError(); because it didn't fail during UPDATE
                        return res.status(500).json({ error: 'Query error' });
                    }
                    // Get user from results
                    const user = results[0];
                    // Generate JWT
                    const JWT = createJwt({
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
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}

exports.getUserProfile = (req: Request, res: Response) => {
    try {
        // Get user id
        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');

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
        pool.query(query, [userId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            const posts = results;

            const query2 = `
                SELECT CI.Body AS Body, CI.ContactTypeId AS Type
                FROM contact_information CI
                WHERE CI.AccountId = ?
            `;
            pool.query(query2, [userId], (qErr2: any, results2: any) => {
                if (qErr2) {
                    return res.status(500).json({ error: 'Query error' });
                }
                const contactInfo = results2;

                return res.status(200).json({ posts, contactInfo });
            });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}

exports.updateContactInfo = (req: Request, res: Response) => {
    try {
        // Get user id
        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');
        // Get request body
        const body = req.body;
        if (!body || !body.contactInfo || !Array.isArray(body.contactInfo)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const contactInfo = body.contactInfo;

        // New contact queries
        const queries: string[] = []
        const parameters: (number | string)[] = [];
        for (let i = 0; i < contactInfo.length; i++) {
            const info: { Body: string, Type: number } = contactInfo[i];
            // Only 5 contact info is allowed
            if (i > 4) {
                break;
            }
            // Check, then push
            if (isNullOrEmpty(info.Body) || info.Body.trim().length > 60 || ![1, 2, 3, 4, 5].includes(info.Type)) continue;
            queries.push('INSERT INTO contact_information(Body, ContactTypeId, AccountId) VALUES(?, ?, ?);')
            parameters.push(info.Body, info.Type, userId);
        }

        // Delete the existing contact information
        const deleteQuery = `DELETE FROM contact_information WHERE AccountId = ?;`;
        pool.query(deleteQuery, [userId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }

            // Return empty list if user deleted all. It's okay
            if (queries.length === 0) {
                return res.status(200).json({ contactInfo: [] });
            }
            // Add all contact info at the same time
            const newContactsQuery = queries.join('');
            pool.query(newContactsQuery, parameters, (qErr: any, results: any) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }

                const selectQuery = `
                    SELECT CI.Body AS Body, CI.ContactTypeId AS Type
                    FROM contact_information CI
                    WHERE CI.AccountId = ?
                `;
                pool.query(selectQuery, [userId], (qErr: any, results: any) => {
                    if (qErr) {
                        return res.status(500).json({ error: 'Query error' });
                    }

                    return res.status(200).json({ contactInfo: results });
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