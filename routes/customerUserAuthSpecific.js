var express 	= require('express')
var router 		= express.Router()
var controller 	= require('../controllers/customerUserAuthSpecificController')

// router.route('/')				.get(controller.index)
router.route('/updateinfo')			.post(controller.updateCustomer)
router.route('/savecard')			.post(controller.saveCard)
router.route('/checkoutcustomer')			.post(controller.checkoutCustomerPanel)
router.route('/deletecard')			.post(controller.deleteCard)
// router.route('/verifymobileotp')			.post(controller.verifyOtpForAdminUser)

module.exports = router;