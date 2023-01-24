var express 					= require('express');
var router 						= express.Router();
var controller 	                = require('../controllers/chatController');

router.route('/listChat')         .post(controller.listChat)
router.route('/messages')	        .post(controller.chatMessages)

module.exports = router;
