import { Router } from 'express';
import { rateLimiter } from '../utils/helperUtils';
const router = Router();
const panelController = require('../controllers/panelController');


// Get posts that are waiting for approval
router.get('/panel/waiting-approval', rateLimiter(), panelController.waitingApproval);
// To approve posts
router.put('/panel/approve-post/:postId', rateLimiter(), panelController.approvePost);
// To reject posts
router.put('/panel/reject-post/:postId', rateLimiter(), panelController.rejectPost);
// To get users by name or id
router.get('/panel/get-user/:target', rateLimiter(), panelController.getUser);
// To ban user
router.put('/panel/ban-user/:target', rateLimiter(), panelController.banUser);
// To remove the active bans of user
router.delete('/panel/lift-ban/:target', rateLimiter(), panelController.liftBan);


module.exports = router;