import { Router } from 'express';
import { uploadAvatar } from '../controllers/imageController';
import { rateLimiter } from '../utils/helperUtils';
const router = Router();
const userController = require('../controllers/userController');


// To login
router.post('/sign-in', rateLimiter({ minute: 5, max: 10 }), userController.signin);
// To register
router.post('/sign-up', rateLimiter({ minute: 30, max: 4 }), userController.signup);
// To login or register with google
router.post('/auth-google', rateLimiter({ minute: 30, max: 15 }), userController.authGoogle);
// To login or register with facebook
router.post('/auth-facebook', rateLimiter({ minute: 30, max: 15 }), userController.authFacebook);
// To get user info
// - router.get('/get-user-info/:userId', userController.getUserInfo);
// To let user change their profile
router.patch('/edit-profile', rateLimiter(), userController.editProfile);
// To let user delete their avatar
router.delete('/delete-avatar', rateLimiter({ minute: 10, max: 6 }), userController.deleteAvatar);
// To let user change their avatar with a new one
router.post('/set-new-avatar', rateLimiter({ minute: 30, max: 5 }), uploadAvatar, userController.uploadAvatar);
// To get user's profile
router.get('/get-user-profile/:userId', rateLimiter(), userController.getUserProfile);
// To let user update their contact information
router.post('/update-contact-info', rateLimiter(), userController.updateContactInfo);



module.exports = router;