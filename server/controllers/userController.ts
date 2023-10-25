const express = require("express");
import { Request, Response } from 'express';

const pool = require('../db/db').pool;

exports.login = async (req: Request, res: Response) => {
    try {
        res.status(200).json({ req: req.body });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};