var express 					= require('express');
var router 						= express.Router();
var controller 	                = require('../controllers/invitationCardController')

router.route('/create')         .post(controller.createInvitationCard)
// router.route('/getuserplate')         .post(controller.getUserPlate)
// router.route('/update')         .put(controller.update)
// router.route('/getnearestplate')         .post(controller.getNearestPlateOfKitchen)
// router.route('/getnearestplatecategory')         .post(controller.getNearestPlateOfKitchencategory)
// router.route('/likeplate')         .post(controller.likePlate)
// router.route('/getsingleuserlikedplate')         .post(controller.getSingleUserLikedPlate)
// router.route('/getsingleplate')         .post(controller.getSinglePlateDetail)
// router.route('/getplatesearchfilter')         .post(controller.getNearestPlateOfKitchenSearchWithFlter)
// router.route('/delete')	        .post(controller.delete)

module.exports = router;
