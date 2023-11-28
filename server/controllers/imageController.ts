
import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import { acceptedImgSet_1 } from '../utils/helperUtils';
const path = require('path');
const appDir = path.dirname(require.main?.filename);




// Define storage for uploaded files
const postImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Set the directory where you want to store uploaded images
        cb(null, appDir + '/uploaded/post');
    },
    filename: function (req, file, cb) {
        // Define the filename for the uploaded image
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    },
});

// Custom multer middleware
export const uploadPostImage = (req: Request, res: Response, next: NextFunction) => {
    const multerMiddleware = multer({
        storage: postImageStorage,
        limits: { fileSize: 5000000, files: 10 }, // 5 megabyte
        fileFilter: (req, file, cb) => {
            // Accept only images, excluding gif
            if (acceptedImgSet_1.includes(file.mimetype))
                cb(null, true);
            else
                cb(null, false);
        }
    }).array('postImages', 10);

    // Apply multer middleware
    multerMiddleware(req, res, (multerError: any) => {
        if (multerError) {
            // Probably deletes automatically upon error
            // Delete all the uploaded files upon error
            /*const uploadedList = Array.isArray(req.files) ? req.files : [];
            uploadedList.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });*/

            if (multerError.code === 'LIMIT_FILE_SIZE') {
                // 5mb limit, if one exceeds, return 413, payload too large error
                return res.status(413).json({ error: 'A file exceeded the 5 megabyte limit' });
            }
            else if (multerError.code === 'LIMIT_FILE_COUNT') {
                // 10 image limit
                return res.status(417).json({ error: 'Maximum of 10 files can be sent' });
            }
            return next(multerError);
        }

        // To route handler
        next();
    });
};


// Define storage for uploaded files
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Set the directory where you want to store uploaded images
        cb(null, appDir + '/uploaded/avatar');
    },
    filename: function (req, file, cb) {
        // Define the filename for the uploaded image
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    },
});

// Custom multer middleware
export const uploadAvatar = (req: Request, res: Response, next: NextFunction) => {
    const multerMiddleware = multer({
        storage: avatarStorage,
        limits: { fileSize: 5000000 }, // 5 megabyte
        fileFilter: (req, file, cb) => {
            // Accept only images, excluding gif
            if (acceptedImgSet_1.includes(file.mimetype))
                cb(null, true);
            else
                cb(null, false);
        }
    }).single('image');

    // Apply multer middleware
    multerMiddleware(req, res, (multerError: any) => {
        if (multerError) {
            if (multerError.code === 'LIMIT_FILE_SIZE') {
                // 5mb limit, if one exceeds, return 413, payload too large error
                return res.status(413).json({ error: 'A file exceeded the 5 megabyte limit' });
            }
            return next(multerError);
        }

        // To route handler
        next();
    });
};























/*
// Create an instance of multer
export const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: (req, file, cb) => {
        const files = req.files;
        if (!files || !Array.isArray(files) || files.length === 0) {
            return cb(new Error('No image uploaded'));
        }
        // Reject the file if it's too large, > 5mb
        // Reducing file size will be in client side
        else if (file.size > 5000000) {
            // Delete the uploaded files
            files.forEach((uploadedFile) =>
                fs.existsSync(uploadedFile.path) && fs.unlinkSync(uploadedFile.path)
            );
            return cb(new Error('File size is too large'));
        }

        // If no error is detected, accept the file
        cb(null, true);
    }
});*/


// TODO: COMBINE BOTH!

// To serve images
// /api/post-image/[name].[ext]
exports.servePostImage = (req: Request, res: Response) => {
    const imageName = req.params.imageName;
    const imagePath = appDir + `/uploaded/post/${imageName}`;
    if (fs.existsSync(imagePath)) {
        // The file exists, so you can send it
        return res.sendFile(imagePath);
    } else {
        // The file doesn't exist, so you can send an error response or handle it as needed
        return res.status(404).send('File not found');
    }
};
// /api/avatar/[name].[ext]
exports.serveAvatar = (req: Request, res: Response) => {
    const imageName = req.params.imageName;
    const imagePath = appDir + `/uploaded/avatar/${imageName}`;
    if (fs.existsSync(imagePath)) {
        // The file exists, so you can send it
        return res.sendFile(imagePath);
    } else {
        // The file doesn't exist, so you can send an error response or handle it as needed
        return res.status(404).send('File not found');
    }
};