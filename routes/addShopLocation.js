var express 					= require('express');
var router 						= express.Router();
var controller 	                = require('../controllers/shopLocationsController')

router.route('/addshoplocation')         .post(controller.addShopLocations)
// router.route('/usermeetinghistory')         .post(controller.getLoggedUserMeetingHistory)
// router.route('/update')         .put(controller.update)
// router.route('/getnearestplate')         .post(controller.getNearestPlateOfKitchen)
// router.route('/getnearestplatecategory')         .post(controller.getNearestPlateOfKitchencategory)
// router.route('/likeplate')         .post(controller.likePlate)

module.exports = router;
