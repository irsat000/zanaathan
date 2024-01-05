"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const imageController_1 = require("../controllers/imageController");
const helperUtils_1 = require("../utils/helperUtils");
const router = (0, express_1.Router)();
const postController = require('../controllers/postController');
// To get posts
router.get('/get-posts/:category', (0, helperUtils_1.rateLimiter)(), postController.getPosts);
// To get post details
router.get('/get-post-details/:postId', (0, helperUtils_1.rateLimiter)(), postController.getPostDetails);
// To get cities
router.get('/get-cities', (0, helperUtils_1.rateLimiter)(), postController.getCities);
// To get districts of a specific city
router.get('/get-districts', (0, helperUtils_1.rateLimiter)(), postController.getDistricts);
// To create a new post
router.post('/create-post', (0, helperUtils_1.rateLimiter)({ minute: 10, max: 10 }), imageController_1.uploadPostImage, postController.createPost);
// To update post status by post owner
router.put('/update-post-status/:postId', (0, helperUtils_1.rateLimiter)({ minute: 15, max: 15 }), postController.updatePostStatus);
module.exports = router;
