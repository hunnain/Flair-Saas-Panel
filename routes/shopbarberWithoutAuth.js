var express 	= require('express')
var router 		= express.Router()
var controller 	= require('../controllers/authenticationShopBarbersController')

router.route('/barberlogin')			.post(controller.loginForShopBarbers)
router.route('/forgotpasswordemail')			.post(controller.forgotPasswordSendOTPForBarberEMAIL)
router.route('/verifyforgotpasswordotpemail')			.post(controller.verifyForgotPasswordOtpEMAIL)
router.route('/recoverpassword')			.post(controller.recoverPassword)
// router.route('/reportchat')			.post(controller.reportChat)
// router.route('/getallusers')	.post(controller.getAllUsers)
// router.route('/userlogout')	.post(controller.userLogout)
// router.route('/getsingleuserprofiledetail')	.post(controller.getSingleUserProfileDetail)

module.exports = router;
