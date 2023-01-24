var express 	= require('express')
var router 		= express.Router()
var controller 	= require('../controllers/shopAdminUserController')

// router.route('/')				.get(controller.index)
router.route('/signupadmin')			.post(controller.signupAdminOfShop)
router.route('/recover')			.post(controller.updateAdminUser)
// router.route('/resetpassword')			.post(controller.resetPassword)
// router.route('/updateuser')			.post(controller.updateUser)
// router.route('/appfeedback')			.post(controller.appFeedback)
// router.route('/googlecreate')			.post(controller.googleCreate)
// router.route('/facebookcreate')			.post(controller.facebookCreate)
// router.route('/reportplate')			.post(controller.reportPlate)
// router.route('/reportchat')			.post(controller.reportChat)
// router.route('/getallusers')	.post(controller.getAllUsers)
// router.route('/userlogout')	.post(controller.userLogout)
// router.route('/getsingleuserprofiledetail')	.post(controller.getSingleUserProfileDetail)

module.exports = router;
