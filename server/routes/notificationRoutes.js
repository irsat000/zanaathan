"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const helperUtils_1 = require("../utils/helperUtils");
const router = (0, express_1.Router)();
const notificationController = require('../controllers/notificationController');
// Get notifications
router.get('/get-notifications', (0, helperUtils_1.rateLimiter)(), notificationController.getNotifications);
// Set notification isSeen
router.patch('/notification-seen/:notificationId', (0, helperUtils_1.rateLimiter)(), notificationController.notificationSeen);
module.exports = router;
