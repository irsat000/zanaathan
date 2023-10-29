import { Router } from 'express';
const router = Router();
const userController = require('../controllers/userController');


// To login
router.post('/sign-in', userController.signin);
// To register
router.post('/sign-up', userController.signup);

module.exports = router;