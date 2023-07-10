var express 	= require('express')
var router 		= express.Router()
var controller 	= require('../controllers/shopAdminUsersCampaigns')


router.route('/createbirthdaycampaign')			.post(controller.createAutomatedBirthdayCampaigns)
router.route('/updatebirthdaycampaign')			.post(controller.updateAutomatedBirthdayCampaigns)
router.route('/createpromotereviewcampaign')			.post(controller.createAutomatedPromoteReviewCampaigns)
router.route('/updatepromotereviewcampaign')			.post(controller.updateAutomatedPromoteReviewCampaigns)
router.route('/createnewclientscampaign')			.post(controller.createAutomatedNewClientsCampaigns)
router.route('/updatenewclientscampaign')			.post(controller.updateAutomatednewClientsCampaigns)
router.route('/createrewardregularcampaign')			.post(controller.createAutomatedRewardRegularCampaigns)
router.route('/updaterewardregularcampaign')			.post(controller.updateAutomatedRewardRegularCampaigns)
router.route('/createbookaremindercampaign')			.post(controller.createAutomatedBookAReminderCampaigns)
router.route('/updatebookaremindercampaign')			.post(controller.updateAutomatedBookAReminderCampaigns)

module.exports = router;