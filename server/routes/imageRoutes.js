"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const helperUtils_1 = require("../utils/helperUtils");
const router = (0, express_1.Router)();
const imageController = require('../controllers/imageController');
// To serve images
router.get('/post-image/:imageName', (0, helperUtils_1.rateLimiter)({ minute: 15, max: 2000 }), imageController.servePostImage);
// To serve avatar
router.get('/avatar/:imageName', (0, helperUtils_1.rateLimiter)(), imageController.serveAvatar);
module.exports = router;
