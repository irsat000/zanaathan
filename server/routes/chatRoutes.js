"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const helperUtils_1 = require("../utils/helperUtils");
const router = (0, express_1.Router)();
const chatController = require('../controllers/chatController');
// To get the list of all the user's contacts
router.get('/chat/get-contacts', (0, helperUtils_1.rateLimiter)(), chatController.getContacts);
// To get a message thread
router.get('/chat/get-thread/:contactId/:method', (0, helperUtils_1.rateLimiter)(), chatController.getThread);
// To let a user block another user
router.get('/block-user-toggle/:targetId', (0, helperUtils_1.rateLimiter)(), chatController.blockUserToggle);
module.exports = router;
