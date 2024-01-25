"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const imageController_1 = require("../controllers/imageController");
const helperUtils_1 = require("../utils/helperUtils");
const router = (0, express_1.Router)();
const userController = require('../controllers/userController');
// To login
router.post('/sign-in', (0, helperUtils_1.rateLimiter)({ minute: 5, max: 10 }), userController.signin);
// To register
router.post('/sign-up', (0, helperUtils_1.rateLimiter)({ minute: 30, max: 4 }), userController.signup);
// To login or register with google
router.post('/auth-google', (0, helperUtils_1.rateLimiter)({ minute: 30, max: 15 }), userController.authGoogle);
// To login or register with facebook
router.post('/auth-facebook', (0, helperUtils_1.rateLimiter)({ minute: 30, max: 15 }), userController.authFacebook);
// To get user info
// - router.get('/get-user-info/:userId', userController.getUserInfo);
// To let user change their profile
router.patch('/edit-profile', (0, helperUtils_1.rateLimiter)(), userController.editProfile);
// To let user delete their avatar
router.delete('/delete-avatar', (0, helperUtils_1.rateLimiter)({ minute: 10, max: 6 }), userController.deleteAvatar);
// To let user change their avatar with a new one
router.post('/set-new-avatar', (0, helperUtils_1.rateLimiter)({ minute: 30, max: 5 }), imageController_1.uploadAvatar, userController.uploadAvatar);
// To get user's profile
router.get('/get-user-profile/:userId', (0, helperUtils_1.rateLimiter)(), userController.getUserProfile);
// To let user update their contact information
router.post('/update-contact-info', (0, helperUtils_1.rateLimiter)(), userController.updateContactInfo);
module.exports = router;
