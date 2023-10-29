import { Router } from 'express';
const router = Router();
const postController = require('../controllers/postController');


// To get posts
router.get('/get-posts', postController.getPosts);

module.exports = router;