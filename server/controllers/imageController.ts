
import { Request, Response } from 'express';
import multer from 'multer';
const { dirname, path } = require('path');
const appDir = dirname(require.main?.filename);



// Define storage for uploaded files
const postImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Set the directory where you want to store uploaded images
        cb(null, appDir + '/uploaded/post');
    },
    filename: function (req, file, cb) {
        // Define the filename for the uploaded image
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

// Create an instance of multer
export const uploadPostImage = multer({ storage: postImageStorage });





// To serve images
exports.serveImage = (req: Request, res: Response) => {
    const imageName = req.params.imageName;
    return res.sendFile(appDir + `/uploaded/post/${imageName}`);
};