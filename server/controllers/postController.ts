
import { NextFunction, Request, Response } from 'express';
import { isPositiveNumeric, sanatizeInputString } from '../utils/helperUtils';
import * as fs from 'fs';
import { verifyJwt } from '../utils/userUtils';
const appDir = process.cwd();

const pool = require('../db/db');


// Get the first sub category under category. This is used when sub category is not selected.
const getFirstSubCategoryId = async (category: string): Promise<number | null> => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT Id FROM sub_category WHERE CategoryId = ? LIMIT 1;`, [category], (qErr: any, results: any) => {
            if (qErr) {
                return resolve(null);
            }
            resolve(results[0].Id);
        });
    });
}



exports.getPosts = (req: Request, res: Response) => {
    try {
        // Get necessary filter data from query strings and path
        const category = req.params.category;
        const { subc, sortby, city, district, page } = req.query as {
            subc?: string | string[],
            sortby?: string,
            city?: string,
            district?: string,
            page?: number
        };

        // SUBSTRING(Description, 1, 200) // If description is needed, it's best to shorten it
        let query = `
            FROM job_posting JP
            LEFT JOIN sub_category ON sub_category.Id = JP.SubCategoryId
        `;
        const parameters: (string | string[] | number)[] = [];

        // Join district to get city afterwards
        // No need for district table and city id if district is selected, we can use DistrictId of JP
        if (city && !district) {
            query += ` LEFT JOIN district ON district.Id = JP.DistrictId`;
        }

        // Start WHERE after JOIN(s)
        // Filter by category [Mandatory]
        query += ` WHERE CurrentStatusId IN (1, 2, 3) AND sub_category.CategoryId = ?`;
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
                query += ` AND district.CityId = ?`;
                parameters.push(city);
            }
        }

        // Get post total count
        const countSelect = `SELECT COUNT(*) as Count `;
        pool.query(countSelect + query, parameters, (qErr: any, count: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error 1' });
            }

            // Get filtered 50 posts
            const postsSelect = `
                SELECT JP.Id, JP.Title, TIMESTAMPDIFF(SECOND, CreatedAt, NOW()) AS SecondsAgo,
                (
                    SELECT JPI.Body
                    FROM job_posting_images JPI
                    WHERE JP.Id = JPI.JobPostingId
                    ORDER BY JPI.ImgIndex
                    LIMIT 1
                ) AS MainImage, CurrentStatusId `;

            // Post exclusive is to get the post count with same filtering
            // Sort by seconds ago, default is DESC, meaning old first
            let postsExclusive = ` ORDER BY CurrentStatusId, SecondsAgo`;
            if (!sortby || sortby === 'old') {
                postsExclusive += ` DESC`;
            }

            // Page
            postsExclusive += ` LIMIT 20`;
            const postsExclusiveParameters = [];
            if (page != undefined) {
                // - Offset will be 0 when page is set to 1, same as when it doesn't exist
                postsExclusive += ` OFFSET ?`;
                postsExclusiveParameters.push((page - 1) * 20);
            }

            // Get posts
            pool.query(postsSelect + query + postsExclusive, [...parameters, ...postsExclusiveParameters], (qErr: any, posts: any) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error 2' });
                }

                // Send posts and post count for pagination
                return res.status(200).json({ posts: posts, postCount: count[0].Count });
            });
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
                CONCAT(D.Name, ' - ', C.Name) AS Location,
                MAX(CASE WHEN Ban.LiftDate > NOW() THEN Ban.LiftDate ELSE NULL END) AS BanLiftDate
            FROM job_posting JP
            LEFT JOIN job_posting_images JPI ON JP.Id = JPI.JobPostingId
            LEFT JOIN account A ON JP.AccountId = A.Id
            LEFT JOIN user_bans Ban ON Ban.AccountId = A.Id
            LEFT JOIN contact_information CI ON A.Id = CI.AccountId
            LEFT JOIN contact_type CT ON CI.ContactTypeId = CT.Id
            LEFT JOIN district D ON JP.DistrictId = D.Id
            LEFT JOIN city C ON D.CityId = C.Id
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
        const query = "SELECT * FROM city;";
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
        const query = "SELECT district.Id, district.Name FROM district INNER JOIN city ON district.CityId = city.Id WHERE district.CityId = ?;";
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

type UploadedImage = {
    name: string;
    path: string;
}[];

interface CreatePost {
    title: string;
    description: string;
    category: string; // Id
    subCategory: string; // Id
    district: string; // Id
}
// Extend the Request type
interface CreatePostRequest extends Request {
    args?: {
        userId: number;
        imageNameList: UploadedImage;
    } & CreatePost;
}

// Deletes the uploaded images when called
const deleteUploadedOnError = (imageNameList: UploadedImage) => {
    imageNameList.forEach((file) =>
        fs.existsSync(file.path) && fs.unlinkSync(file.path)
    );
}

exports.createPostValidation = (req: CreatePostRequest, res: Response, next: NextFunction) => {
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

        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) {
            deleteUploadedOnError(imageNameList);
            return res.status(401).send('Not authorized');
        }

        // Get inputs
        const body: CreatePost = req.body;
        const title = sanatizeInputString(body.title);
        const description = body.description.trim();
        const category = body.category;
        let subCategory = body.subCategory;
        const district = body.district;

        // Validate the inputs
        if (!req.body || title.trim().length < 5 || title.trim().length > 255
            || description.trim().length < 10 || description.trim().length > 2000
            || (!isPositiveNumeric(subCategory) && !isPositiveNumeric(category)) || !isPositiveNumeric(district)
        ) {
            deleteUploadedOnError(imageNameList);
            return res.status(400).json({ error: 'Bad payload' });
        }

        // Check if the user finished the daily quota of post creation (3)
        const query = `SELECT Count(*) as Count FROM job_posting WHERE AccountId = ? AND CreatedAt >= NOW() - INTERVAL 1 DAY;`;
        pool.query(query, [userId], (qErr: any, results: any) => {
            if (qErr) {
                deleteUploadedOnError(imageNameList);
                return res.status(500).json({ error: 'Query error' });
            }
            if (results[0].Count > 2) {
                // 3 posts per day limit
                deleteUploadedOnError(imageNameList);
                return res.status(403).json({ error: 'Can only create 3 posts per day' });
            }

            // Double it and give it to the next person
            req.args = {
                userId,
                title,
                description,
                category,
                subCategory,
                district,
                imageNameList
            };

            // If the data is valid, move on to the next middleware
            next();
        });
    } catch (error) {
        return res.status(500).json({ error });
    }
}

exports.createPost = (req: CreatePostRequest, res: Response) => {
    try {
        // Get args from validation middleware
        const { userId, title, description, category, district, imageNameList } = req.args!;
        let subCategory = req.args!.subCategory;

        // Shortens the error handling
        const handleError = (connection: any) => {
            try {
                // Release connection
                connection.release();
                // Delete uploaded images on error
                deleteUploadedOnError(imageNameList);
            } catch (error) {
                // Do nothing
            } finally {
                // Return to client
                return res.status(500).json({ error: 'Database error' });
            }
        };

        // Get connection for transaction and rollback
        pool.getConnection((connErr: any, connection: any) => {
            if (connErr) handleError(connection);

            connection.beginTransaction(async (beginErr: any) => {
                if (beginErr) handleError(connection);

                // If sub category is not selected, get the default
                // WILL ALWAYS GO IN HERE because sub categories are planned to exist later
                if (!isPositiveNumeric(subCategory)) {
                    // Get the first sub category under the selected category
                    const newId = await getFirstSubCategoryId(category);
                    // Check error
                    if (newId == null) connection.rollback(() => handleError(connection));
                    // Re-assign sub category with a valid one
                    subCategory = newId!.toString();
                }

                const query = "INSERT INTO job_posting(Title, CreatedAt, LastStatusUpdate, Description, DistrictId, SubCategoryId, CurrentStatusId, AccountId) VALUES (?, NOW(), NOW(), ?, ?, ?, 5, ?);";
                connection.query(query, [title, description, district, subCategory, userId], (qErr: any, results: any) => {
                    if (qErr) connection.rollback(() => handleError(connection));

                    // Get post id
                    const postId = results.insertId as number;

                    // If no image is uploaded, finish it here
                    if (imageNameList.length === 0) {
                        connection.commit((commitErr: any) => {
                            if (commitErr) connection.rollback(() => handleError(connection));

                            connection.release();
                            return res.status(200).json({ postId });
                        });
                    }

                    // Iterate image names to get necessary image insert queries
                    let imageQueries = '';
                    const imageParameters: (number | string)[] = [];
                    imageNameList.forEach((file, index) => {
                        imageQueries += "INSERT INTO job_posting_images(Body, ImgIndex, JobPostingId) VALUES (?, ?, ?);";
                        imageParameters.push(file.name, index, postId);
                    });
                    // Run the image queries in one go
                    connection.query(imageQueries, imageParameters, (qErr2: any) => {
                        if (qErr2) connection.rollback(() => handleError(connection));

                        // COMMIT
                        connection.commit((commitErr: any) => {
                            if (commitErr) connection.rollback(() => handleError(connection));

                            connection.release();
                            return res.status(200).json({ postId });
                        });
                    });
                });
            });
        });
    } catch (error) {
        return res.status(500).json({ error });
    }
}



exports.updatePostStatus = (req: Request, res: Response) => {
    try {
        const body = req.body;
        // Validate the newStatusId, it can only be -> 1 | 2 | 3
        // 4 (Kaldırıldı) and 5 (Onay bekliyor) are out of option
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

        // Delete job posting expiration data if there are any
        const query = `
            DELETE JPE
            FROM job_posting_expiration as JPE
            JOIN job_posting as JP ON JPE.JobPostingId = JP.Id
            WHERE JP.AccountId = ? AND JPE.JobPostingId = ?;
        `;
        pool.query(query, [userId, postId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error 1' });
            }

            // Update post current status
            // Also checks ownership and if the current status is allowed to be changed by users
            const query = `
                UPDATE job_posting
                SET CurrentStatusId = ?, LastStatusUpdate = NOW()
                WHERE Id = ? AND AccountId = ? AND CurrentStatusId IN (1, 2, 3);
            `;
            pool.query(query, [body.newStatusId, postId, userId], (qErr: any, results: any) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error 2' });
                }
                if (results.affectedRows > 0) {
                    return res.status(200).json({ message: 'Success!' });
                }
                else {
                    return res.status(401).send('Not authorized');
                }
            });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
}


exports.delayPostExpiration = (req: Request, res: Response) => {
    try {
        const postId = req.params.postId;
        if (!isPositiveNumeric(postId)) return res.status(400).send('Bad request');
        // Verify and decode the token
        const jwt = req.headers?.authorization?.split(' ')[1];
        const userId = verifyJwt(jwt);
        if (!userId) return res.status(401).send('Not authorized');
        // Set expiration status id to 2 ("Extended")
        const query = `
            UPDATE job_posting_expiration AS JPE
            JOIN job_posting AS JP ON JPE.JobPostingId = JP.Id
            SET JPE.ExpirationStatusId = 2, JPE.LastUpdate = NOW()
            WHERE JP.AccountId = ? AND JPE.JobPostingId = ?;
        `;
        pool.query(query, [userId, postId], (qErr: any, results: any) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error', qErr });
            }

            if (results.affectedRows > 0) {
                return res.status(200).json({ message: 'Success' });
            } else {
                return res.status(401).json({ error: "User doesn't own the post or the expiration status doesn't exist" });
            }
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