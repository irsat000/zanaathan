import { Router } from 'express';
import { uploadAvatar } from '../controllers/imageController';
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
// To get user info
// - router.get('/get-user-info/:userId', userController.getUserInfo);
// To let user change their profile
router.put('/edit-profile', userController.editProfile);
// To let user delete their avatar
router.put('/delete-avatar', userController.deleteAvatar);
// To let user change their avatar with a new one
router.post('/set-new-avatar', uploadAvatar, userController.uploadAvatar);
// To get user's profile
router.get('/get-user-profile/:userId', userController.getUserProfile);



module.exports = router;