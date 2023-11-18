

const bcrypt = require('bcrypt');
import { Request, Response } from 'express';
const { OAuth2Client } = require('google-auth-library');
import { isNullOrEmpty } from '../utils/helperUtils';
import { createJwt } from '../utils/userUtils';

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
        const query = 'SELECT Id, Username, FullName, Email, Password FROM Account WHERE Username = ? AND OAuthProviderId = NULL;';
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
                        id: user.Id,
                        username: user.Username,
                        fullName: user.FullName,
                        email: user.Email
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
                    id: results.insertId,
                    username: username,
                    fullName: fullName,
                    email: email
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
    email_verified: boolean;
    name: string;
    picture: string;
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
            email_verified: false,
            name: '',
            picture: ''
        };
        // Verify google credentials response
        async function verify() {
            const ticket = await client.verifyIdToken({
                idToken: body.credentials.credential,
                audience: '714554272496-8aan1i53sdgkp9o9s78mlnu5af214ipk.apps.googleusercontent.com'
            });
            const payload = ticket.getPayload();
            user.sub = payload['sub'];
            user.email = payload['email'];
            user.email_verified = payload['email_verified'];
            user.name = payload['name'];
            user.picture = payload['picture'];
        }
        // Verify then move on to register/login
        verify()
            .then(() => {
                // Check if user exists
                const checkQuery = `
                    SELECT Id, Username, FullName, Email FROM Account WHERE ExternalId = ? && OAuthProviderId = 1;
                `;
                pool.query(checkQuery, [user.sub], (qErr: any, results: any) => {
                    if (qErr) {
                        return res.status(500).json({ error: 'Query error' });
                    }

                    if (results.length > 0) {
                        // Login if user exists
                        // Get user
                        const existing = results[0];

                        // Generate JWT
                        const JWT = createJwt({
                            id: existing.Id,
                            username: existing.Username,
                            fullName: existing.FullName,
                            email: existing.Email
                        });

                        return res.status(200).json({ JWT });
                    }
                    else {
                        // Register if user doesn't exist
                        // Username column has UNIQUE, even if it somehow conflicts, it will return 500
                        const uniqueUsername = user.name.replace(/\s/g, '') + '-' + Date.now();
                        // Run the query
                        const signUpQuery = `
                            INSERT INTO Account (Username, FullName, Email, IsEmailValid, Password, Avatar, ExternalId, OAuthProviderId)
                            VALUES (?, ?, ?, ?, NULL, ?, ?, ?);
                        `;
                        pool.query(signUpQuery, [uniqueUsername, user.name, user.email, user.email_verified, user.picture, user.sub, 1], (qErr: any, results: any) => {
                            if (qErr) {
                                return res.status(500).json({ error: 'Query error' });
                            }

                            // Generate JWT
                            const JWT = createJwt({
                                id: results.insertId,
                                username: uniqueUsername,
                                fullName: user.name,
                                email: user.email
                            });

                            return res.status(200).json({ JWT });
                        });
                    }
                });
            })
            .catch(() => {
                // Error at verifying
            });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
