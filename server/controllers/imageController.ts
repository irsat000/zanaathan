
import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import { acceptedImgSet_1, removeExtension } from '../utils/helperUtils';
import sharp from 'sharp';
const path = require('path');
const appDir = path.dirname(require.main?.filename);



/*files.forEach(file => {
    if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
    }
});*/

// Define storage for uploaded files
const postImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Set the directory where you want to store uploaded images
        cb(null, appDir + '/uploaded/post');
    },
    filename: function (req, file, cb) {
        // Define the filename for the uploaded image
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp' /*path.extname(file.originalname)*/);
    },
});

// Custom multer middleware
export const uploadPostImage = (req: Request, res: Response, next: NextFunction) => {
    const multerMiddleware = multer({
        storage: postImageStorage,
        limits: { fileSize: 10000000, files: 10 }, // 10 megabyte
        fileFilter: (req, file, cb) => {
            // Accept only images, excluding gif
            if (acceptedImgSet_1.includes(file.mimetype))
                cb(null, true);
            else
                cb(null, false);
        }
    }).array('postImages', 10);

    // Apply multer middleware
    multerMiddleware(req, res, async (multerError: any) => {
        if (multerError) {
            if (multerError.code === 'LIMIT_FILE_SIZE') {
                // 10mb limit, if one exceeds, return 413, payload too large error
                return res.status(413).json({ error: 'A file exceeded the 10 megabyte initial limit' });
            }
            else if (multerError.code === 'LIMIT_FILE_COUNT') {
                // 10 image limit
                return res.status(417).json({ error: 'Maximum of 10 files can be sent' });
            }
            return next(multerError);
        }


        // Get files
        const files = req.files as Express.Multer.File[];

        // Remove uploaded
        const removeAllUploaded = () => {
            files.forEach(async (file) => {
                if (fs.existsSync(file.path)) {
                    await fs.unlink(file.path, (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Error while deleting uploaded images' });
                        }
                    });
                }
            });
        }

        try {
            // Iterate and reformat the uploaded images
            for (const image of files) {
                // Shrink, reformat, remove metadata etc
                // - Create the new file in the same path
                const sanitizedImage = await sharp(image.path)
                    .resize({ fit: 'inside', width: 720, height: 720 })
                    .toColorspace('srgb')
                    .flatten()
                    .toFormat('webp')
                    .toBuffer();

                // Check new size, 5 mb is the limit
                const stillExceeded5MB = sanitizedImage.length > 5000000;
                if (stillExceeded5MB) {
                    removeAllUploaded();
                    return res.status(413).json({ error: 'A file exceeded the 5 megabyte sanitized limit' });
                }

                // Virus scan
                if (false) {
                    removeAllUploaded();
                    return res.status(406).json({ error: 'Infected file detected.' });
                }

                // Replace file
                await fs.promises.writeFile(image.path, sanitizedImage);
            }
        } catch (err) {
            removeAllUploaded();
            return res.status(500).json({ error: 'Error while handling files: ' + err });
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
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp');
    },
});

// Custom multer middleware
export const uploadAvatar = (req: Request, res: Response, next: NextFunction) => {
    const multerMiddleware = multer({
        storage: avatarStorage,
        limits: { fileSize: 10000000 }, // 10 megabyte
        fileFilter: (req, file, cb) => {
            // Accept only images, excluding gif
            if (acceptedImgSet_1.includes(file.mimetype))
                cb(null, true);
            else
                cb(null, false);
        }
    }).single('image');

    // Apply multer middleware
    multerMiddleware(req, res, async (multerError: any) => {
        if (multerError) {
            if (multerError.code === 'LIMIT_FILE_SIZE') {
                // 10mb limit, if the file exceeds, return 413, payload too large error
                return res.status(413).json({ error: 'The file exceeded the 10 megabyte initial limit' });
            }
            return next(multerError);
        }

        // Get file
        const image = req.file as Express.Multer.File;

        // Remove uploaded
        const removeUploaded = () => {
            try {
                if (fs.existsSync(image.path)) {
                    fs.unlinkSync(image.path);
                }
            } catch (error) {
                return res.status(500).json({ error: 'Error while deleting uploaded avatar' });
            }
        }

        try {
            // Shrink, reformat, remove metadata etc
            // - Create the new file in the same path
            const sanitizedImage = await sharp(image.path)
                .resize({ fit: 'fill', width: 400, height: 400 })
                .toColorspace('srgb')
                .flatten()
                .toFormat('webp')
                .toBuffer();

            // Check new size, 3 mb is the limit
            const stillExceeded3MB = sanitizedImage.length > 3000000;
            if (stillExceeded3MB) {
                removeUploaded();
                return res.status(413).json({ error: 'A file exceeded the 3 megabyte sanitized avatar limit' });
            }

            // Replace file
            await fs.promises.writeFile(image.path, sanitizedImage);
        } catch (err) {
            removeUploaded();
            return res.status(500).json({ error: 'Error while handling files: ' + err });
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
    // Serve if file exists
    if (fs.existsSync(imagePath)) {
        return res.sendFile(imagePath);
    } else {
        // The file doesn't exist
        return res.status(404).send('File not found');
    }
};
// /api/avatar/[name].[ext]
exports.serveAvatar = (req: Request, res: Response) => {
    const imageName = req.params.imageName;
    const imagePath = appDir + `/uploaded/avatar/${imageName}`;
    // Serve if file exists
    if (fs.existsSync(imagePath)) {
        return res.sendFile(imagePath);
    } else {
        return res.status(404).send('File not found');
    }
};