
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
import { Request, Response } from 'express';
import { isNullOrEmpty } from '../utils/helperMethods';
import { createJwt } from '../utils/userUtils';

const pool = require('../db/db');

interface SigninBody {
    username: string;
    password: string;
}
interface SignupBody {
    username: string;
    fullname: string | null;
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
        const query = 'SELECT * FROM Account WHERE Username = ?';
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
                    const JWT = createJwt(results.insertId);
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
        const fullname = body.fullname;
        const email = body.email;
        const password = body.password;

        // Check value lengths
        if (username.trim().length < 3 || email.trim().length || password.trim().length < 5) {
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
            const signUpQuery = "INSERT INTO Account (Username, FullName, Email, IsEmailValid, Password, Avatar) VALUES (?, ?, ?, ?, ?, NULL);";
            pool.query(signUpQuery, [username, fullname, email, 0, hash], (qErr: any, results: any) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }

                // Generate JWT
                const JWT = createJwt(results.insertId);
                return res.status(200).json({ JWT });
            });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
