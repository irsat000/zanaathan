
import { Request, Response } from 'express';

const pool = require('../db/db');

exports.getPosts = (req: Request, res: Response) => {
    try {
        const query = "SELECT * FROM JobPosting;";
        pool.query(query, (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            // If there are no posts
            // Might return empty instead!
            /*if (results.length === 0) {
                return res.status(404).json({ error: 'No post found' });
            }*/

            return res.status(200).json({ posts: results });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}


exports.getCities = (req: Request, res: Response) => {
    try {
        const query = "SELECT * FROM City;";
        pool.query(query, (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            return res.status(200).json({ cities: results });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}


exports.getDistricts = (req: Request, res: Response) => {
    try {
        const cityId = req.query.city_id;
        const query = "SELECT District.Id, District.Name FROM District INNER JOIN City ON District.CityId = City.Id WHERE District.CityId = ?;";
        pool.query(query, [cityId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error: ' + qErr });
            }
            return res.status(200).json({ districts: results });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}












exports.asdf = (req: Request, res: Response) => {
    try {
        const query = "";
        pool.query(query, (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }

        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}