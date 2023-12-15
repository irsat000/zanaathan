import { Router } from 'express';
import { rateLimiter } from '../utils/helperUtils';
const router = Router();
const imageController = require('../controllers/imageController');


// To serve images
router.get('/post-image/:imageName', rateLimiter({ minute: 15, max: 2000 }), imageController.servePostImage);
// To serve avatar
router.get('/avatar/:imageName', rateLimiter(), imageController.serveAvatar);


module.exports = router;