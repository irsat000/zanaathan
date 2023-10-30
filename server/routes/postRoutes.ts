import { Router } from 'express';
const router = Router();
const postController = require('../controllers/postController');


// To get posts
router.get('/get-posts', postController.getPosts);
// To get cities
router.get('/get-cities', postController.getCities);
// To get districts of a specific city
router.get('/get-districts', postController.getDistricts);

module.exports = router;