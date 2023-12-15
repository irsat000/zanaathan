import { Router } from 'express';
import { rateLimiter } from '../utils/helperUtils';
const router = Router();
const chatController = require('../controllers/chatController');


// To get the list of all the user's contacts
router.get('/chat/get-contacts', rateLimiter(), chatController.getContacts);
// To get a message thread
router.get('/chat/get-thread/:contactId/:method', rateLimiter(), chatController.getThread);
// To let a user block another user
router.get('/block-user-toggle/:targetId', rateLimiter(), chatController.blockUserToggle);


module.exports = router;