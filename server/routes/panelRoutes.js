"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const helperUtils_1 = require("../utils/helperUtils");
const router = (0, express_1.Router)();
const panelController = require('../controllers/panelController');
// Get posts that are waiting for approval
router.get('/panel/waiting-approval', (0, helperUtils_1.rateLimiter)(), panelController.waitingApproval);
// To update posts
router.put('/panel/update-post/:action/:postId', (0, helperUtils_1.rateLimiter)(), panelController.adminUpdatePost);
// To get users by name or id
router.get('/panel/get-user/:target', (0, helperUtils_1.rateLimiter)(), panelController.getUser);
// To ban user
router.put('/panel/ban-user/:target', (0, helperUtils_1.rateLimiter)(), panelController.banUser);
// To remove the active bans of user
router.delete('/panel/lift-ban/:target', (0, helperUtils_1.rateLimiter)(), panelController.liftBan);
module.exports = router;
