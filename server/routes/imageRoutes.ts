import { Router } from 'express';
const router = Router();
const imageController = require('../controllers/imageController');


// To serve images
router.get('/images/:imageName', imageController.serveImage);


module.exports = router;