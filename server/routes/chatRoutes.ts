import { Router } from 'express';
const router = Router();
const chatController = require('../controllers/chatController');


// To get the list of all the user's contacts
router.get('/chat/get-contacts', chatController.getContacts);


module.exports = router;