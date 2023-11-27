

const bcrypt = require('bcrypt');
import { Request, Response } from 'express';
import * as fs from 'fs';
const path = require('path');
const appDir = path.dirname(require.main?.filename);
const { OAuth2Client } = require('google-auth-library');
import { isNullOrEmpty } from '../utils/helperUtils';
import { createJwt, verifyJwt } from '../utils/userUtils';

const pool = require('../db/db');
const client = new OAuth2Client();

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
        const query = 'SELECT Id, Username, FullName, Email, Avatar, Password FROM Account WHERE Username = ? AND OAuthProviderId IS NULL;';
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
            bcrypt.compare(password, user.Password, (bErr: any, isMatch: boolean) => {
                if (bErr) {
                    return res.status(500).json({ error: 'Bcrypt compare error' });
                }

                if (isMatch) {
                    // Generate JWT
                    const JWT = createJwt({
                        sub: user.Id,
                        username: user.Username,
                        fullName: user.FullName,
                        email: user.Email,
                        avatar: user.Avatar
                    });
                    return res.status(200).json({ JWT });
                } else {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }
            });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};


exports.signup = (req: Request, res: Response) => {
    try {
        const body: SignupBody = req.body;
        // Validate the request body
        if (!body || isNullOrEmpty(body.username) || isNullOrEmpty(body.email) || isNullOrEmpty(body.password)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const username = body.username;
        const fullName = isNullOrEmpty(body.fullName) ? null : body.fullName;
        const email = body.email;
        const password = body.password;

        // Check value lengths
        if (username.trim().length < 3 || password.trim().length < 5) {
            return res.status(400).json({ error: 'Form data is not good enough' });
        }

        // Check if username or verified account already exists
        const checkExistingQuery = 'SELECT * FROM Account WHERE Username = ? OR (Email = ? AND IsEmailValid = 1)';
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
                INSERT INTO Account (Username, FullName, Email, IsEmailValid, Password, Avatar, ExternalId, OAuthProviderId)
                VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL);
            `;
            pool.query(signUpQuery, [username, fullName, email, 0, hash], (qErr: any, results: any) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
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
};


// TODO: Ask if they are nullable
interface GoogleUser {
    sub: string;
    email: string;
    name: string;
    picture: string | null;
};

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
            const ticket = await client.verifyIdToken({
                idToken: body.credentials.credential,
                audience: '714554272496-8aan1i53sdgkp9o9s78mlnu5af214ipk.apps.googleusercontent.com' // Not from body
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
                    SELECT Id, Username, FullName, Email, Avatar FROM Account WHERE ExternalId = ? && OAuthProviderId = 1;
                `;
                pool.query(checkQuery, [user.sub], async (qErr: any, results: any) => {
                    if (qErr) {
                        return res.status(500).json({ error: 'Query error' });
                    }

                    if (results.length > 0) {
                        // Login if user exists
                        // Get user
                        const existing = results[0];

                        // Generate JWT
                        const JWT = createJwt({
                            sub: existing.Id,
                            username: existing.Username,
                            fullName: existing.FullName,
                            email: existing.Email,
                            avatar: existing.Avatar
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
                            INSERT INTO Account (Username, FullName, Email, IsEmailValid, Password, Avatar, ExternalId, OAuthProviderId)
                            VALUES (?, ?, ?, 1, NULL, ?, ?, 1);
                        `;
                        pool.query(signUpQuery, [uniqueUsername, user.name, user.email, newAvatar, user.sub], (qErr: any, results: any) => {
                            if (qErr) {
                                return res.status(500).json({ error: 'Query error' });
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
};


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
                    SELECT Id, Username, FullName, Email, Avatar FROM Account WHERE ExternalId = ? && OAuthProviderId = 2;
                `;
                pool.query(checkQuery, [data.id], async (qErr: any, results: any) => {
                    if (qErr) {
                        return res.status(500).json({ error: 'Query error' });
                    }

                    if (results.length > 0) {
                        // Login if user exists
                        // Get user
                        const existing = results[0];

                        // Generate JWT
                        const JWT = createJwt({
                            sub: existing.Id,
                            username: existing.Username,
                            fullName: existing.FullName,
                            email: existing.Email,
                            avatar: existing.Avatar
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
                            INSERT INTO Account (Username, FullName, Email, IsEmailValid, Password, Avatar, ExternalId, OAuthProviderId)
                            VALUES (?, ?, ?, 1, NULL, ?, ?, 2);
                        `;
                        pool.query(signUpQuery, [uniqueUsername, data.name, data.email, newAvatar, data.id], (qErr: any, results: any) => {
                            if (qErr) {
                                return res.status(500).json({ error: 'Query error' });
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
                return res.status(500).json({ error: 'Server error: ' + error });
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

/* Will be used for target user's info rather than "my info"
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
        const query = 'SELECT FullName, Email, Password FROM Account WHERE Id = ?;';
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
            const updateQuery = 'UPDATE Account SET ' + setSection + ' WHERE Id = ?;';
            parameters.push(userId);

            // Finally, update
            pool.query(updateQuery, parameters, (qErr: any, results: any) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }

                // Get updated user
                const selectQuery = 'SELECT Id, Username, FullName, Email, Avatar FROM Account WHERE Id = ?;';
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