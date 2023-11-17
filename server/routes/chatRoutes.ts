import { Router } from 'express';
const router = Router();
const chatController = require('../controllers/chatController');


// To get the list of all the user's contacts
router.get('/chat/get-contacts', chatController.getContacts);
// To get a message thread
router.get('/chat/get-thread/:contactId', chatController.getThread);
// To let a user block another user
router.get('/block-user-toggle/:targetId', chatController.blockUserToggle);


module.exports = router;