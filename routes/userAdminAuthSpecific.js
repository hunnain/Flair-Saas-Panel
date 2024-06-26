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
router.route('/updateemail')			.post(controller.updateEmail)
router.route('/sendotpmobilechange')			.post(controller.sendOTPOnNumberForMobileNumberChange)
router.route('/verifyotpmobilechange')			.post(controller.verifyOtpForMobileNumberChange)
router.route('/addshopservicecategory')			.post(controller.addShopServiceCategory)
router.route('/addshopservices')			.post(controller.addShopServices)
router.route('/updateshopservicecategory')			.post(controller.updateShopServiceCategory)
router.route('/updateshopservice')			.post(controller.updateShopServices)
router.route('/getallcategoryserviceofshop')			.post(controller.getAllCategoriesOfShopWithServices)
router.route('/getsingleserviceofshop')			.post(controller.getSingleServicesBasedOnId)
router.route('/getsinglecategoryofshop')			.post(controller.getSingleCategoryBasedOnId)
router.route('/getallcategoriesofshop')			.post(controller.getAllCategoriesOfShopList)
router.route('/deletesingleserviceofshop')			.post(controller.deleteSingleServiceOfShop)
router.route('/getallbarbers')			.post(controller.getAllBarbers)
router.route('/searchbarber')			.post(controller.searchBarber)
router.route('/searchservices')			.post(controller.searchServices)

module.exports = router;