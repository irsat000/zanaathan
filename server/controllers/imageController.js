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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = exports.uploadPostImage = void 0;
const multer_1 = __importDefault(require("multer"));
const fs = __importStar(require("fs"));
const helperUtils_1 = require("../utils/helperUtils");
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const nsfwjs = require('nsfwjs');
const appDir = process.cwd();
// CRITICAL - Sharp caches files, which prevents deletion with EBUSY error, because they are "used".
sharp_1.default.cache(false);
// Define nsfwjs model once
let nsfwjsModel;
function loadNsfwModel() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            nsfwjsModel = yield nsfwjs.load();
        }
        catch (error) {
            console.error('Error loading NSFW model:', error);
        }
    });
}
/*files.forEach(file => {
    if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
    }
});*/
// Define storage for uploaded files
const postImageStorage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        // Set the directory to store uploaded images
        cb(null, path_1.default.join(appDir, 'uploaded', 'post'));
    },
    filename: function (req, file, cb) {
        // Define the filename for the uploaded image
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp' /*path.extname(file.originalname)*/);
    },
});
// Custom multer middleware
const uploadPostImage = (req, res, next) => {
    const multerMiddleware = (0, multer_1.default)({
        storage: postImageStorage,
        limits: { fileSize: 1000 * 1000 * 5, files: 4 },
        fileFilter: (req, file, cb) => {
            // Accept only images, excluding gif
            if (helperUtils_1.acceptedImgSet_1.includes(file.mimetype))
                cb(null, true);
            else
                cb(null, false);
        }
    }).array('postImages', 10);
    // Apply multer middleware
    multerMiddleware(req, res, (multerError) => __awaiter(void 0, void 0, void 0, function* () {
        if (multerError) {
            if (multerError.code === 'LIMIT_FILE_SIZE') {
                // 5mb limit, if one exceeds, return 413, payload too large error
                return res.status(413).json({ error: 'A file exceeded the 5 megabyte limit' });
            }
            else if (multerError.code === 'LIMIT_FILE_COUNT') {
                // 4 image limit
                return res.status(417).json({ error: 'Maximum of 4 files can be sent' });
            }
            return res.status(500).json({ error: multerError });
        }
        // Get files
        const files = req.files;
        // Remove uploaded
        const removeAllUploaded = () => __awaiter(void 0, void 0, void 0, function* () {
            yield Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
                if (fs.existsSync(file.path)) {
                    fs.unlink(file.path, (err) => {
                        // Logging
                    });
                }
            })));
        });
        try {
            // Iterate and reformat the uploaded images
            for (const image of files) {
                // Shrink, reformat, remove metadata etc
                const sanitizedImage = yield (0, sharp_1.default)(image.path)
                    .resize({ fit: 'inside', width: 720, height: 720, withoutEnlargement: true })
                    .toColorspace('srgb')
                    .flatten()
                    .toFormat('webp')
                    .toBuffer();
                // Overwrite the existing file
                yield fs.promises.writeFile(image.path, sanitizedImage);
            }
        }
        catch (err) {
            yield removeAllUploaded();
            return res.status(500).json({ error: 'Error while handling files: ' + err });
        }
        // To route handler
        next();
    }));
};
exports.uploadPostImage = uploadPostImage;
// Define storage for uploaded files
const avatarStorage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        // Set the directory where you want to store uploaded images
        cb(null, path_1.default.join(appDir, 'uploaded', 'avatar'));
    },
    filename: function (req, file, cb) {
        // Define the filename for the uploaded image
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp');
    },
});
// Custom multer middleware
const uploadAvatar = (req, res, next) => {
    const multerMiddleware = (0, multer_1.default)({
        storage: avatarStorage,
        limits: { fileSize: 1000 * 1000 * 5 },
        fileFilter: (req, file, cb) => {
            // Accept only images, excluding gif
            if (helperUtils_1.acceptedImgSet_1.includes(file.mimetype))
                cb(null, true);
            else
                cb(null, false);
        }
    }).single('image');
    // Apply multer middleware
    multerMiddleware(req, res, (multerError) => __awaiter(void 0, void 0, void 0, function* () {
        if (multerError) {
            if (multerError.code === 'LIMIT_FILE_SIZE') {
                // 5mb limit, if the file exceeds, return 413, payload too large error
                return res.status(413).json({ error: 'The file exceeded the 5 megabyte limit' });
            }
            return next(multerError);
        }
        // Get file
        const image = req.file;
        // Remove uploaded
        const removeUploaded = () => {
            try {
                if (fs.existsSync(image.path)) {
                    fs.unlinkSync(image.path);
                }
            }
            catch (error) {
                return res.status(500).json({ error: 'Error while deleting uploaded avatar' });
            }
        };
        try {
            // Shrink, reformat, remove metadata etc
            const sanitizedImage = yield (0, sharp_1.default)(image.path)
                .resize({ fit: 'inside', width: 400, height: 400, withoutEnlargement: true })
                .toColorspace('srgb')
                .flatten()
                .toFormat('webp')
                .toBuffer({ resolveWithObject: true });
            // Check for unallowed content
            // Deactivated because everything is detected as drawing
            //const problematic = await checkUnallowed(sanitizedImage.data, { width: sanitizedImage.info.width, height: sanitizedImage.info.height });
            //if (problematic) return res.status(400).json({ error: 'Unallowed content detected' });
            // Overwrite the existing file
            yield fs.promises.writeFile(image.path, sanitizedImage.data);
        }
        catch (err) {
            removeUploaded();
            return res.status(500).json({ error: 'Error while handling files: ' + err });
        }
        // To route handler
        next();
    }));
};
exports.uploadAvatar = uploadAvatar;
// Check if images have NSFW content using NSFWJS library
function checkUnallowed(data, args) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Load the model if not already loaded
            if (!nsfwjsModel) {
                yield loadNsfwModel();
            }
            // Create image data object
            const imageData = { data: new Uint8Array(data), width: args.width, height: args.height };
            // Classify the image
            const predictions = yield nsfwjsModel.classify(imageData);
            // If problematic, return true and the caller function will return unallowed content detected
            const problematic = predictions.some((prediction) => ((prediction.className === 'Porn'
                || prediction.className === 'Hentai')
                && prediction.probability > 0.8) || (prediction.className === 'Sexy' && prediction.probability > 0.8));
            //console.log(predictions, problematic);
            return problematic;
        }
        catch (error) {
            // Upon error, log it and allow the user to upload
            console.log(error);
            return null;
        }
    });
}
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
        else if (file.size > 1000 * 1000 * 5) {
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
exports.servePostImage = (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path_1.default.join(appDir, 'uploaded', 'post', imageName);
    // Serve if file exists
    if (fs.existsSync(imagePath)) {
        return res.sendFile(imagePath);
    }
    else {
        // The file doesn't exist
        return res.status(404).send('File not found');
    }
};
// /api/avatar/[name].[ext]
exports.serveAvatar = (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path_1.default.join(appDir, 'uploaded', 'avatar', imageName);
    // Serve if file exists
    if (fs.existsSync(imagePath)) {
        return res.sendFile(imagePath);
    }
    else {
        return res.status(404).send('File not found');
    }
};
