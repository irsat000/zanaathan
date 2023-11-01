import { Router } from 'express';
import { uploadPostImage } from '../controllers/imageController';
const router = Router();
const postController = require('../controllers/postController');


// To get posts
router.get('/get-posts', postController.getPosts);
// To get cities
router.get('/get-cities', postController.getCities);
// To get districts of a specific city
router.get('/get-districts', postController.getDistricts);
// To create a new post
router.post('/create-post', uploadPostImage.array('postImages', 10), postController.createPost);

module.exports = router;