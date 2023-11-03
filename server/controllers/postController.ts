
import { Request, Response } from 'express';
import { isPositiveNumeric, sanatizeInputString } from '../utils/helperUtils';
import * as fs from 'fs';
const path = require('path');
const appDir = path.dirname(require.main?.filename);

const pool = require('../db/db');

// TODO: USE PROCEDURES INSTEAD

exports.getPosts = (req: Request, res: Response) => {
    try {
        // SUBSTRING(Description, 1, 200) // If description is needed, it's best to shorten it
        const query =
            `SELECT JP.Id, JP.Title, TIMESTAMPDIFF(SECOND, CreatedAt, NOW()) AS SecondsAgo,
            (
                SELECT JPI.Body
                FROM JobPostingImages JPI
                WHERE JP.Id = JPI.JobPostingId
                ORDER BY JPI.ImgIndex
                LIMIT 1
            ) AS MainImage FROM JobPosting JP
            ORDER BY SecondsAgo DESC;`;
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


exports.getPostDetails = (req: Request, res: Response) => {
    try {
        const postId = req.params.postId;
        const query =
            `SELECT
                JP.Id,
                JP.Title,
                TIMESTAMPDIFF(SECOND, JP.CreatedAt, NOW()) AS SecondsAgo,
                JP.Description,
                GROUP_CONCAT(DISTINCT JPI.Body ORDER BY JPI.ImgIndex SEPARATOR ';') AS Images,
                A.Id AS A_Id,
                A.Username AS A_Username,
                A.FullName AS A_FullName,
                GROUP_CONCAT(DISTINCT CONCAT(CI.Body, ' - ', CT.Body) ORDER BY CI.Id SEPARATOR ';') AS ContactInfo
            FROM JobPosting JP
            LEFT JOIN JobPostingImages JPI ON JP.Id = JPI.JobPostingId
            LEFT JOIN Account A ON JP.AccountId = A.Id
            LEFT JOIN ContactInformation CI ON A.Id = CI.AccountId
            LEFT JOIN ContactType CT ON CI.ContactTypeId = CT.Id
            WHERE JP.Id = ?
            GROUP BY JP.Id;`;
        pool.query(query, [postId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }

            return res.status(200).json({ postDetails: results[0] });
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
        // Get uploaded file list
        // We already check this in fileFilter
        const files = req.files;
        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ error: 'No image uploaded' });
        }
        const imageNameList = files.map(file => file.filename);

        // Deletes the images uploaded when called
        const deleteUploadedOnError = () => {
            files.forEach((uploadedFile) =>
                fs.existsSync(uploadedFile.path) && fs.unlinkSync(uploadedFile.path)
            );
        }

        // Get inputs
        const body: CreatePost = req.body;
        const title = sanatizeInputString(body.title);
        const description = body.description.trim();
        const subCategory = body.subCategory;
        const district = body.district;

        // Validate the inputs
        if (title.length < 5 || title.length > 255
            || description.length < 50 || description.length > 2000
            || !isPositiveNumeric(subCategory) || !isPositiveNumeric(district)
        ) {
            deleteUploadedOnError();
            return res.status(400).json({ error: 'Bad payload' });
        }

        // Shortens the error handling
        const handleError = (connection: any) => {
            try {
                // Release connection
                connection.release();
                // Delete uploaded images on error
                deleteUploadedOnError();
            } catch (error) {
                // Do nothing
            } finally {
                // Return to client
                return res.status(500).json({ error: 'Database error' });
            }
        };

        // Get connection for transaction and rollback
        pool.getConnection((connErr: any, connection: any) => {
            if (connErr) return handleError(connection);

            connection.beginTransaction((beginErr: any) => {
                if (beginErr) return handleError(connection);
            });

            const query = "INSERT INTO JobPosting(Title, CreatedAt, Description, DistrictId, SubCategoryId, CurrentStatusId) VALUES (?, NOW(), ?, ?, ?, 1);";
            connection.query(query, [title, description, district, subCategory], (qErr: any, results: any) => {
                if (qErr) connection.rollback(() => handleError(connection));

                // Get post id
                const postId = results.insertId;
                // Iterate image names to get necessary image insert queries
                const imageQueries = imageNameList.map((imageName, index) => ({
                    sql: "INSERT INTO JobPostingImages(Body, ImgIndex, JobPostingId) VALUES (?, ?, ?);",
                    values: [imageName, index, postId]
                }));
                // Iterate over image insert queries
                imageQueries.forEach((imageQuery, index) => {
                    connection.query(imageQuery.sql, imageQuery.values, (qErr2: any) => {
                        if (qErr2) connection.rollback(() => handleError(connection));

                        // COMMIT IN THE LAST INDEX
                        if (index === imageQueries.length - 1) {
                            connection.commit((commitErr: any) => {
                                if (commitErr) connection.rollback(() => handleError(connection));

                                // Send postId to go to the post after it's published
                                return res.status(200).json({ postId });
                            });
                        }
                    });
                })
            });
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