import { Router } from 'express';
import { rateLimiter } from '../utils/helperUtils';
const router = Router();
const notificationController = require('../controllers/notificationController');


// Get notifications
router.get('/get-notifications', rateLimiter(), notificationController.getNotifications);
// Set notification isSeen
router.patch('/notification-seen/:notificationId', rateLimiter(), notificationController.notificationSeen);


module.exports = router;