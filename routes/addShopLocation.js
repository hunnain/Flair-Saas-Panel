var express 					= require('express');
var router 						= express.Router();
var controller 	                = require('../controllers/shopLocationsController')

router.route('/addshoplocation')         .post(controller.addShopLocations)
router.route('/getallshoplocations')         .post(controller.getAllShopLocations)

module.exports = router;
