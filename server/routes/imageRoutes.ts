import { Router } from 'express';
const router = Router();
const imageController = require('../controllers/imageController');


// To serve images
router.get('/post-image/:imageName', imageController.servePostImage);
// To serve avatar
router.get('/avatar/:imageName', imageController.serveAvatar);


module.exports = router;