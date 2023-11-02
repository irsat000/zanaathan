
import { Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs';
const path = require('path');
const appDir = path.dirname(require.main?.filename);




// NEEDS FURTHER WORK
// Clearing the metadata
// Changing extension may be necessary

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

// Create an instance of multer
export const uploadPostImage = multer({ storage: postImageStorage });





// To serve images
// /api/images/[name].[ext]
exports.serveImage = (req: Request, res: Response) => {
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