
import { Request, Response } from 'express';
import { isNullOrEmpty, isPositiveNumeric, sanatizeInputString } from '../utils/helperUtils';
import * as fs from 'fs';
import { verifyJwt } from '../utils/userUtils';
const path = require('path');
const appDir = path.dirname(require.main?.filename);

const pool = require('../db/db');

// TODO: USE PROCEDURES INSTEAD

exports.getPosts = (req: Request, res: Response) => {
    try {
        // Get necessary filter data from query strings and path
        const category = req.params.category;
        const { subc, sortby, city, district } = req.query as {
            subc?: string | string[],
            sortby?: string,
            city?: string,
            district?: string
        };

        // SUBSTRING(Description, 1, 200) // If description is needed, it's best to shorten it
        let query = `
            SELECT JP.Id, JP.Title, TIMESTAMPDIFF(SECOND, CreatedAt, NOW()) AS SecondsAgo,
                (
                    SELECT JPI.Body
                    FROM JobPostingImages JPI
                    WHERE JP.Id = JPI.JobPostingId
                    ORDER BY JPI.ImgIndex
                    LIMIT 1
                ) AS MainImage
            FROM JobPosting JP
            LEFT JOIN SubCategory ON SubCategory.Id = JP.SubCategoryId
        `;
        const parameters: (string | string[])[] = [];

        // Join district to get city afterwards
        // No need for district table and city id if district is selected, we can use DistrictId of JP
        if (city && !district) {
            query += ` LEFT JOIN District ON District.Id = JP.DistrictId`;
        }

        // Start WHERE after JOIN(s)
        // Filter by category [Mandatory]
        query += ` WHERE CurrentStatusId = 1 AND SubCategory.CategoryId = ?`;
        parameters.push(category);

        // Filter by sub categories
        if (subc) {
            // subc can be string[] or string
            query += ` AND JP.SubCategoryId IN (?)`;
            parameters.push(subc);
        }

        // Filter by district
        if (district) {
            query += ` AND JP.DistrictId = ?`;
            parameters.push(district);
        } else {
            // Filter by city
            if (city) {
                query += ` AND District.CityId = ?`;
                parameters.push(city);
            }
        }

        // Sort by seconds ago, default is DESC, meaning old first
        query += ` ORDER BY SecondsAgo`;
        if (!sortby || sortby === 'old') {
            query += ` DESC`;
        }

        pool.query(query, parameters, (qErr: any, results: any) => {
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
        if (!postId) res.status(400).json({ error: 'Bad request' });

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
                A.Avatar AS A_Avatar,
                GROUP_CONCAT(DISTINCT CONCAT(CI.Body, ' - ', CT.Body) ORDER BY CI.Id SEPARATOR ';') AS ContactInfo,
                CONCAT(D.Name, ' - ', C.Name) AS Location
            FROM JobPosting JP
            LEFT JOIN JobPostingImages JPI ON JP.Id = JPI.JobPostingId
            LEFT JOIN Account A ON JP.AccountId = A.Id
            LEFT JOIN ContactInformation CI ON A.Id = CI.AccountId
            LEFT JOIN ContactType CT ON CI.ContactTypeId = CT.Id
            LEFT JOIN District D ON JP.DistrictId = D.Id
            LEFT JOIN City C ON D.CityId = C.Id
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
        // Filtered in multer instance
        const files = req.files;
        const imageNameList = Array.isArray(files) ? files.map(file => {
            return {
                name: file.filename, // Has extension
                path: file.path // Full directory path
            }
        }) : [];

        // Deletes the uploaded images when called
        const deleteUploadedOnError = () => {
            imageNameList.forEach((file) =>
                fs.existsSync(file.path) && fs.unlinkSync(file.path)
            );
        }

        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) {
            deleteUploadedOnError();
            return res.status(401).send('Not authorized');
        }

        // Get inputs
        const body: CreatePost = req.body;
        const title = sanatizeInputString(body.title);
        const description = body.description.trim();
        const subCategory = body.subCategory;
        const district = body.district;

        // Note: This can be done with a middleware before image uploading
        // Validate the inputs
        if (!req.body || title.length < 5 || title.length > 255
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

            const query = "INSERT INTO JobPosting(Title, CreatedAt, Description, DistrictId, SubCategoryId, CurrentStatusId, AccountId) VALUES (?, NOW(), ?, ?, ?, 1, ?);";
            connection.query(query, [title, description, district, subCategory, userId], (qErr: any, results: any) => {
                if (qErr) connection.rollback(() => handleError(connection));

                // Get post id
                const postId = results.insertId;

                // If no image is uploaded, finish it here
                if (imageNameList.length === 0) {
                    connection.commit((commitErr: any) => {
                        if (commitErr) connection.rollback(() => handleError(connection));

                        // Send postId to go to the post after it's published
                        return res.status(200).json({ postId });
                    });
                }

                // Iterate image names to get necessary image insert queries
                const imageQueries = imageNameList.map((file, index) => ({
                    sql: "INSERT INTO JobPostingImages(Body, ImgIndex, JobPostingId) VALUES (?, ?, ?);",
                    values: [file.name, index, postId]
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
        return res.status(500).json({ error });
    }
}


exports.getUserPosts = (req: Request, res: Response) => {
    try {
        // Get user id
        const userId = req.params.userId;
        if (isNullOrEmpty(userId)) return;

        // Fetch user's posts (excluding posts with deleted status which is 4)
        let query = `
            SELECT JP.Id, JP.Title, TIMESTAMPDIFF(SECOND, CreatedAt, NOW()) AS SecondsAgo,
                (
                    SELECT JPI.Body
                    FROM JobPostingImages JPI
                    WHERE JP.Id = JPI.JobPostingId
                    ORDER BY JPI.ImgIndex
                    LIMIT 1
                ) AS MainImage,
                JP.CurrentStatusId,
                C.Code AS CategoryCode
            FROM JobPosting JP
            LEFT JOIN SubCategory SC ON SC.Id = JP.SubCategoryId
            LEFT JOIN Category C ON C.Id = SC.CategoryId
            WHERE JP.CurrentStatusId != 4 AND AccountId = ?
            ORDER BY SecondsAgo DESC;
        `;
        pool.query(query, [userId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }

            return res.status(200).json({ posts: results });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}


exports.updatePostStatus = (req: Request, res: Response) => {
    try {
        const body = req.body;
        // Validate the newStatusId, it can only be -> 1 | 2 | 3
        if (!body || ![1, 2, 3].includes(body.newStatusId)) {
            return res.status(400).json({ error: 'Bad request' });
        }

        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');

        // Get post id
        const postId = req.params.postId;
        if (!postId) res.status(400).json({ error: 'Bad request' });

        // Update post current status if authorized(using AccountId)
        const query = `
            UPDATE JobPosting 
            SET CurrentStatusId = ? 
            WHERE AccountId = ? AND Id = ?;
        `;
        pool.query(query, [body.newStatusId, userId, postId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            if (results.affectedRows === 0) {
                return res.status(401).send('Not authorized');
            }
            return res.status(200).json({ message: 'Success!' });
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