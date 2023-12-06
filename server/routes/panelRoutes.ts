import { Router } from 'express';
const router = Router();
const panelController = require('../controllers/panelController');


// Get posts that are waiting for approval
router.get('/panel/waiting-approval', panelController.waitingApproval);
// To approve posts
router.put('/panel/approve-post/:postId', panelController.approvePost);

module.exports = router;