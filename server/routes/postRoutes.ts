import { Router } from 'express';
import { uploadPostImage } from '../controllers/imageController';
import { rateLimiter } from '../utils/helperUtils';
const router = Router();
const postController = require('../controllers/postController');


// To get posts
router.get('/get-posts/:category', rateLimiter(), postController.getPosts);
// To get post details
router.get('/get-post-details/:postId', rateLimiter(), postController.getPostDetails);
// To get cities
router.get('/get-cities', rateLimiter(), postController.getCities);
// To get districts of a specific city
router.get('/get-districts', rateLimiter(), postController.getDistricts);
// To create a new post
router.post('/create-post', rateLimiter({ minute: 30, max: 5 }),
    uploadPostImage,
    postController.createPostValidation,
    postController.createPost);
// To update post status by post owner
router.put('/update-post-status/:postId', rateLimiter({ minute: 15, max: 15 }), postController.updatePostStatus);

module.exports = router;