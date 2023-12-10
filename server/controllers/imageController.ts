
import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import { acceptedImgSet_1 } from '../utils/helperUtils';
import sharp from 'sharp';
const path = require('path');
const appDir = path.dirname(require.main?.filename);
/*
const NodeClam = require('clamscan');
const ClamScan = new NodeClam().init({
    removeInfected: true, // If true, removes infected files
    quarantineInfected: false, // False: Don't quarantine, Path: Moves files to this place.
    scanLog: null, // Path to a writeable log file to write scan results into
    debugMode: false, // Whether or not to log info/debug/error msgs to the console
    fileList: null, // path to file containing list of files to scan (for scanFiles method)
    scanRecursively: true, // If true, deep scan folders recursively
    clamscan: {
        path: '/usr/bin/clamscan', // Path to clamscan binary on your server
        db: null, // Path to a custom virus definition database
        scanArchives: true, // If true, scan archives (ex. zip, rar, tar, dmg, iso, etc...)
        active: true // If true, this module will consider using the clamscan binary
    },
    clamdscan: {
        socket: '/var/run/clamav/clamd.sock', // Socket file for connecting via TCP
        host: '127.0.0.1', // IP of host to connect to TCP interface
        port: 8123, // Port of host to use when connecting via TCP interface
        timeout: 60000, // Timeout for scanning files
        localFallback: true, // Use local preferred binary to scan if socket/tcp fails
        path: '/usr/bin/clamdscan', // Path to the clamdscan binary on your server
        configFile: null, // Specify config file if it's in an unusual place
        multiscan: true, // Scan using all available cores! Yay!
        reloadDb: false, // If true, will re-load the DB on every call (slow)
        active: true, // If true, this module will consider using the clamdscan binary
        bypassTest: false, // Check to see if socket is available when applicable
    },
    preference: 'clamdscan' // If clamdscan is found and active, it will be used by default
});*/


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
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
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


        // Check files for viruses
        const files = req.files as Express.Multer.File[];

        // Reject all if one is infected
        const removeAllUploaded = () => {
            // Remove uploaded
            files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }

        try {
            for (const file of files) {
                // Virus scan
                /*await ClamScan.isInfected(file.path, (err: any, file: File, isInfected: boolean, viruses: any) => {
                    if (err) throw new Error('ClamScan throw errow while scanning')

                    console.log('infected:', isInfected)
                    if (isInfected) {
                        removeAllUploaded()
                        return res.status(406).json({ error: 'Infected file detected.' });
                    }
                });*/

                const handleSharpError = () => {
                    removeAllUploaded()
                    return res.status(500).json({ error: 'Error while sanitizing image' });
                }
                // Shrink, reformat, remove metadata etc
                // - Create the new file in the same path
                sharp(file.path)
                    .resize({ fit: 'inside', width: 720, height: 720 })
                    .toColorspace('srgb')
                    .flatten()
                    .toFormat('webp')
                    .toBuffer((err, buffer) => {
                        if (err) {
                            handleSharpError()
                            return
                        };

                        // Check new size, 5 mb is the limit
                        const stillExceeded5MB = buffer.length > 5000000;
                        if (stillExceeded5MB) {
                            removeAllUploaded()
                            return res.status(413).json({ error: 'A file exceeded the 5 megabyte sanitized limit' });
                        }

                        // Overwrite the file with sanitized one
                        fs.writeFile(file.path, buffer, (err) => {
                            if (err) {
                                handleSharpError()
                                return
                            };
                        });
                    });
            }
        } catch (error) {
            removeAllUploaded()
            return res.status(500).json({ error: 'hahaha' });
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