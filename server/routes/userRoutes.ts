import { Router } from 'express';
const router = Router();
const userController = require('../controllers/userController');


// To login
router.post('/sign-in', userController.signin);
// To register
router.post('/sign-up', userController.signup);
// To login or register with google
router.post('/auth-google', userController.authGoogle);
// To login or register with facebook
router.post('/auth-facebook', userController.authFacebook);

module.exports = router;