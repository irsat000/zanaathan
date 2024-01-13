"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const helperUtils_1 = require("../utils/helperUtils");
const fs = __importStar(require("fs"));
const userUtils_1 = require("../utils/userUtils");
const appDir = process.cwd();
const pool = require('../db/db');
// Get the first sub category under category. This is used when sub category is not selected.
const getFirstSubCategoryId = (category) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT Id FROM sub_category WHERE CategoryId = ? LIMIT 1;`, [category], (qErr, results) => {
            if (qErr) {
                return resolve(null);
            }
            resolve(results[0].Id);
        });
    });
});
exports.getPosts = (req, res) => {
    try {
        // Get necessary filter data from query strings and path
        const category = req.params.category;
        const { subc, sortby, city, district, page } = req.query;
        // SUBSTRING(Description, 1, 200) // If description is needed, it's best to shorten it
        let query = `
            FROM job_posting JP
            LEFT JOIN sub_category ON sub_category.Id = JP.SubCategoryId
        `;
        const parameters = [];
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
        }
        else {
            // Filter by city
            if (city) {
                query += ` AND district.CityId = ?`;
                parameters.push(city);
            }
        }
        // Get post total count
        const countSelect = `SELECT COUNT(*) as Count `;
        pool.query(countSelect + query, parameters, (qErr, count) => {
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
            pool.query(postsSelect + query + postsExclusive, [...parameters, ...postsExclusiveParameters], (qErr, posts) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error 2' });
                }
                // Send posts and post count for pagination
                return res.status(200).json({ posts: posts, postCount: count[0].Count });
            });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
exports.getPostDetails = (req, res) => {
    try {
        const postId = req.params.postId;
        if (!postId)
            res.status(400).json({ error: 'Bad request' });
        const query = `SELECT
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
        pool.query(query, [postId], (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            return res.status(200).json({ postDetails: results[0] });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
exports.getCities = (req, res) => {
    try {
        const query = "SELECT * FROM city;";
        pool.query(query, (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            return res.status(200).json({ cities: results });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
exports.getDistricts = (req, res) => {
    try {
        const cityId = req.query.city_id;
        const query = "SELECT district.Id, district.Name FROM district INNER JOIN city ON district.CityId = city.Id WHERE district.CityId = ?;";
        pool.query(query, [cityId], (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error: ' + qErr });
            }
            return res.status(200).json({ districts: results });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
// Deletes the uploaded images when called
const deleteUploadedOnError = (imageNameList) => {
    imageNameList.forEach((file) => fs.existsSync(file.path) && fs.unlinkSync(file.path));
};
exports.createPostValidation = (req, res, next) => {
    var _a, _b;
    try {
        // Get uploaded file list
        // Filtered in multer instance
        const files = req.files;
        const imageNameList = Array.isArray(files) ? files.map(file => {
            return {
                name: file.filename,
                path: file.path // Full directory path
            };
        }) : [];
        // Verify and decode the token
        const jwt = (_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1];
        const userId = (0, userUtils_1.verifyJwt)(jwt);
        if (!userId) {
            deleteUploadedOnError(imageNameList);
            return res.status(401).send('Not authorized');
        }
        // Get inputs
        const body = req.body;
        const title = (0, helperUtils_1.sanatizeInputString)(body.title);
        const description = body.description.trim();
        const category = body.category;
        let subCategory = body.subCategory;
        const district = body.district;
        // Validate the inputs
        if (!req.body || title.trim().length < 5 || title.trim().length > 255
            || description.trim().length < 50 || description.trim().length > 2000
            || (!(0, helperUtils_1.isPositiveNumeric)(subCategory) && !(0, helperUtils_1.isPositiveNumeric)(category)) || !(0, helperUtils_1.isPositiveNumeric)(district)) {
            deleteUploadedOnError(imageNameList);
            return res.status(400).json({ error: 'Bad payload' });
        }
        // Check if the user finished the daily quota of post creation (3)
        const query = `SELECT Count(*) as Count FROM job_posting WHERE AccountId = ? AND CreatedAt >= NOW() - INTERVAL 1 DAY;`;
        pool.query(query, [userId], (qErr, results) => {
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
    }
    catch (error) {
        return res.status(500).json({ error });
    }
};
exports.createPost = (req, res) => {
    try {
        // Get args from validation middleware
        const { userId, title, description, category, district, imageNameList } = req.args;
        let subCategory = req.args.subCategory;
        // Shortens the error handling
        const handleError = (connection) => {
            try {
                // Release connection
                connection.release();
                // Delete uploaded images on error
                deleteUploadedOnError(imageNameList);
            }
            catch (error) {
                // Do nothing
            }
            finally {
                // Return to client
                return res.status(500).json({ error: 'Database error' });
            }
        };
        // Get connection for transaction and rollback
        pool.getConnection((connErr, connection) => __awaiter(void 0, void 0, void 0, function* () {
            if (connErr)
                handleError(connection);
            connection.beginTransaction((beginErr) => {
                if (beginErr)
                    handleError(connection);
            });
            // If sub category is not selected, get the default
            // WILL ALWAYS GO IN HERE because sub categories are planned to exist later
            if (!(0, helperUtils_1.isPositiveNumeric)(subCategory)) {
                // Get the first sub category under the selected category
                const newId = yield getFirstSubCategoryId(category);
                // Check error
                if (newId == null)
                    connection.rollback(() => handleError(connection));
                // Re-assign sub category with a valid one
                subCategory = newId.toString();
            }
            const query = "INSERT INTO job_posting(Title, CreatedAt, Description, DistrictId, SubCategoryId, CurrentStatusId, AccountId) VALUES (?, NOW(), ?, ?, ?, 5, ?);";
            connection.query(query, [title, description, district, subCategory, userId], (qErr, results) => {
                if (qErr)
                    connection.rollback(() => handleError(connection));
                // Get post id
                const postId = results.insertId;
                // If no image is uploaded, finish it here
                if (imageNameList.length === 0) {
                    connection.commit((commitErr) => {
                        if (commitErr)
                            connection.rollback(() => handleError(connection));
                        connection.release();
                        return res.status(200).json({ postId });
                    });
                }
                // Iterate image names to get necessary image insert queries
                let imageQueries = '';
                const imageParameters = [];
                imageNameList.forEach((file, index) => {
                    imageQueries += "INSERT INTO job_posting_images(Body, ImgIndex, JobPostingId) VALUES (?, ?, ?);";
                    imageParameters.push(file.name, index, postId);
                });
                // Run the image queries in one go
                connection.query(imageQueries, imageParameters, (qErr2) => {
                    if (qErr2)
                        connection.rollback(() => handleError(connection));
                    // COMMIT
                    connection.commit((commitErr) => {
                        if (commitErr)
                            connection.rollback(() => handleError(connection));
                        connection.release();
                        return res.status(200).json({ postId });
                    });
                });
            });
        }));
    }
    catch (error) {
        return res.status(500).json({ error });
    }
};
exports.updatePostStatus = (req, res) => {
    var _a, _b;
    try {
        const body = req.body;
        // Validate the newStatusId, it can only be -> 1 | 2 | 3
        // 4 (Kaldırıldı) and 5 (Onay bekliyor) are out of option
        if (!body || ![1, 2, 3].includes(body.newStatusId)) {
            return res.status(400).json({ error: 'Bad request' });
        }
        // Verify and decode the token
        const jwt = (_b = (_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1];
        const userId = (0, userUtils_1.verifyJwt)(jwt);
        if (!userId)
            return res.status(401).send('Not authorized');
        // Get post id
        const postId = req.params.postId;
        if (!postId)
            res.status(400).json({ error: 'Bad request' });
        // Check previous status and prevent unauthorization
        const query = `SELECT CurrentStatusId FROM job_posting WHERE AccountId = ? AND Id = ?;`;
        pool.query(query, [userId, postId], (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            // results.length === 0: Not the owner of the post
            // 4: Onay bekliyor(waiting approval)
            // 5: Kaldırıldı (deleted)
            if (results.length === 0 || ![1, 2, 3].includes(results[0].CurrentStatusId)) {
                return res.status(401).send('Not authorized');
            }
            // Update post current status
            const query = `
                UPDATE job_posting 
                SET CurrentStatusId = ? 
                WHERE Id = ?;
            `;
            pool.query(query, [body.newStatusId, userId, postId], (qErr, results) => {
                if (qErr) {
                    return res.status(500).json({ error: 'Query error' });
                }
                return res.status(200).json({ message: 'Success!' });
            });
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
exports.asdf = (req, res) => {
    try {
        const query = ``;
        pool.query(query, (qErr, results) => {
            if (qErr) {
                return res.status(500).json({ error: 'Query error' });
            }
            return res.status(200).json({});
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error });
    }
};
