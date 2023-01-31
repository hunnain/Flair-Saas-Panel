var express 	= require('express')
var router 		= express.Router()
var controller 	= require('../controllers/shopBarberPanelController')

router.route('/signupbarberofshop')			.post(controller.signupBarberOfShop)
router.route('/updatebarber')			.post(controller.updateBarber)
router.route('/sendotpformobilenumchange')			.post(controller.sendOTPOnNumberForMobileNumberChange)
router.route('/verifyotpformobilenumchange')			.post(controller.verifyOtpForMobileNumberChange)
// router.route('/reportchat')			.post(controller.reportChat)
// router.route('/getallusers')	.post(controller.getAllUsers)
// router.route('/userlogout')	.post(controller.userLogout)
// router.route('/getsingleuserprofiledetail')	.post(controller.getSingleUserProfileDetail)

module.exports = router;
