
import { Request, Response } from 'express';
import { dateToMysqlDate, isPositiveNumeric, sanatizeInputString } from '../utils/helperUtils';

const pool = require('../db/db');

exports.getPosts = (req: Request, res: Response) => {
    try {
        // SUBSTRING(Description, 1, 200)
        const query = "SELECT Id, Title, TIMESTAMPDIFF(SECOND, CreatedAt, NOW()) AS SecondsAgo FROM JobPosting;";
        pool.query(query, (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            // If there are no posts we can return empty instead of error
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


interface CreatePost {
    title: string;
    description: string;
    subCategory: string; // Id
    district: string; // Id
}

exports.createPost = (req: Request, res: Response) => {
    try {
        const body: CreatePost = req.body;
        const title = sanatizeInputString(body.title);
        const description = body.description.trim();
        const subCategory = body.subCategory;
        const district = body.district;

        // Check the inputs
        if (title.length < 5 || title.length > 255
            || description.length < 50 || description.length > 2000
            || !isPositiveNumeric(subCategory) || !isPositiveNumeric(district)) {
            return res.status(400).json({ error: 'Bad payload' });
        }

        //const dateNow = dateToMysqlDate(new Date()); // I will use NOW() of mysql instead

        const query = "INSERT INTO JobPosting(Title, CreatedAt, Description, DistrictId, SubCategoryId, CurrentStatusId) VALUES (?, NOW(), ?, ?, ?, 1);";
        pool.query(query, [title, description, district, subCategory], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }

            return res.status(200).json({ postId: results.insertId });
            // TODO: Will add images with insertId
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

            return res.status(200).json({});
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}