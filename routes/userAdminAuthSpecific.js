var express 	= require('express')
var router 		= express.Router()
var controller 	= require('../controllers/adminUserAuthSpecificController')

// router.route('/')				.get(controller.index)
router.route('/changeonboardingadminpassword')			.post(controller.changeAdminPasswordForOnbarding)
router.route('/updatebusinessdetail')			.post(controller.updateInitialShopDetails)
router.route('/updatemobile')			.post(controller.updateMobileandSendOtpToAdminUser)
router.route('/resendmobileotp')			.post(controller.resendMobileOtpForAdminUser)
router.route('/verifymobileotp')			.post(controller.verifyOtpForAdminUser)

module.exports = router;