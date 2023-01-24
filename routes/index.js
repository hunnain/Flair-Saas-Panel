var express 					= require('express');
var router 						= express.Router();
var authenticationController 	= require('../controllers/authenticationController')
// var productsController 	        = require('../controllers/platesController')

router.route('/authentication')	.post(authenticationController.loginForAdminPanel)
// router.route('/verification')	.post(authenticationController.verificationForOnbardingPanel)
router.route('/logout')				.post(authenticationController.logout)

module.exports = router;
