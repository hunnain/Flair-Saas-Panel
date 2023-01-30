var express 	= require('express')
var router 		= express.Router()
var controller 	= require('../controllers/shopBarberPanelController')

router.route('/signupbarberofshop')			.post(controller.signupBarberOfShop)
// router.route('/googlecreate')			.post(controller.googleCreate)
// router.route('/facebookcreate')			.post(controller.facebookCreate)
// router.route('/reportplate')			.post(controller.reportPlate)
// router.route('/reportchat')			.post(controller.reportChat)
// router.route('/getallusers')	.post(controller.getAllUsers)
// router.route('/userlogout')	.post(controller.userLogout)
// router.route('/getsingleuserprofiledetail')	.post(controller.getSingleUserProfileDetail)

module.exports = router;
