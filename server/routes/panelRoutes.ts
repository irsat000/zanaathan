import { Router } from 'express';
const router = Router();
const panelController = require('../controllers/panelController');


// Get posts that are waiting for approval
router.get('/panel/waiting-approval', panelController.waitingApproval);
// To approve posts
router.put('/panel/approve-post/:postId', panelController.approvePost);
// To reject posts
router.put('/panel/reject-post/:postId', panelController.rejectPost);
// To get users by name or id
router.get('/panel/get-user/:target', panelController.getUser);
// To ban user
router.put('/panel/ban-user/:target', panelController.banUser);


module.exports = router;