var express 	= require('express')
var router 		= express.Router()
var controller 	= require('../controllers/adminUserAuthSpecificController')

// router.route('/')				.get(controller.index)
router.route('/changeonboardingadminpassword')			.post(controller.changeAdminPasswordForOnbarding)
router.route('/updatebusinessdetail')			.post(controller.updateInitialShopDetails)
router.route('/updatemobile')			.post(controller.updateMobileandSendOtpToAdminUser)
router.route('/resendmobileotp')			.post(controller.resendMobileOtpForAdminUser)
router.route('/verifymobileotp')			.post(controller.verifyOtpForAdminUser)
router.route('/subadminsignup')			.post(controller.subAdminSignupOfShop)
router.route('/passwordcheck')			.post(controller.checkingPasswordForEmailUpdateAdmin)
router.route('/sendotpmobilechange')			.post(controller.sendOTPOnNumberForMobileNumberChange)
router.route('/verifyotpmobilechange')			.post(controller.verifyOtpForMobileNumberChange)

module.exports = router;