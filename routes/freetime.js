var express 		    = require('express')
var router 			    = express.Router()
var controller 	        = require('../controllers/freetimeController')

router.route('/addfreetime')		                            .post(controller.addFreeTime)
router.route('/loggedinuserfreetime')		                            .post(controller.getLoggedInUserFreeTime)
router.route('/singleuserfreetime')		                            .post(controller.getSingleUserFreeTime)
router.route('/home')	                        .post(controller.getHomeInvitationList)
router.route('/updatefreetime')	                .post(controller.updateFreeTime)
router.route('/loggedinusergroup')	    .post(controller.getLoggedinUserGroup)
// router.route('/sellerlist')	                .post(controller.sellersOrderList)
// router.route('/acceptorder')         .post(controller.acceptOrder)
// router.route('/rejectorder')         .post(controller.rejectOrder)

module.exports = router;
