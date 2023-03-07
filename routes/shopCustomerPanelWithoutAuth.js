var express 	= require('express')
var router 		= express.Router()
var controller 	= require('../controllers/shopCustomersPanelWithoutAuthController')
var shopCustomerAuthController 	= require('../controllers/authenticationShopCustomerController')

router.route('/signupcustomerofshop')			.post(controller.signupCustomerOfShop)
router.route('/getallshoplocations')			.post(controller.getAllShopLocations)
router.route('/getallneabyshoplocations')			.post(controller.getAllNearbyShopLocations)
router.route('/googlecreate')			.post(controller.googleCreate)
router.route('/facebookcreate')			.post(controller.facebookCreate)
router.route('/applecreate')			.post(controller.appleCreate)
router.route('/logincustomer')			.post(shopCustomerAuthController.loginForShopCustomers)
router.route('/logoutcustomer')			.post(shopCustomerAuthController.logout)
router.route('/verifymobile')			.post(controller.verifyCustomerOfShopOtp)
router.route('/resendmobileotp')			.post(controller.resendMobileOtpForCustomerOfShop)
router.route('/forgotpassword')			.post(controller.forgotPasswordSendOTPForCustomers)
router.route('/verifyforgotpasswordotp')			.post(controller.verifyForgotPasswordOtp)
router.route('/recoverpassword')			.post(controller.recoverPassword)
router.route('/forgotpasswordemail')			.post(controller.forgotPasswordSendOTPForCustomersEMAIL)
router.route('/verifyforgotpasswordotpemail')			.post(controller.verifyForgotPasswordOtpEMAIL)
router.route('/getallbarbersofshop')			.post(controller.getAllBarberOfShop)
router.route('/searchbarber')			.post(controller.searchBarberOfShop)
router.route('/allservices')			.post(controller.getAllServicesOfShop)
router.route('/searchservices')			.post(controller.searchServiceOfShop)
// router.route('/reportplate')			.post(controller.reportPlate)
// router.route('/reportchat')			.post(controller.reportChat)
// router.route('/getallusers')	.post(controller.getAllUsers)
// router.route('/userlogout')	.post(controller.userLogout)
// router.route('/getsingleuserprofiledetail')	.post(controller.getSingleUserProfileDetail)

module.exports = router;
