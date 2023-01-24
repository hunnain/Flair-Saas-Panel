var express = require("express");
var router = express.Router();
var controller = require("../controllers/virtualMeeting");

router.route("/create").post(controller.createVirtualMeeting);
router.route("/createchannel").post(controller.createAgoraChannelAndToken);
router.route("/userbookedmeeting").post(controller.getLoggedUserBookedMeeting);
// router.route("/addstripeaccount").post(controller.addAccountStripe);
// router.route("/updatestatus").post(controller.updateStatus);
// router.route("/buyerlist").post(controller.buyersOrderList);
// router.route("/sellerlist").post(controller.sellersOrderList);
// router.route("/acceptorder").post(controller.acceptOrder);
// router.route("/rejectorder").post(controller.rejectOrder);
// router.route("/sellertransaction").post(controller.sellersOrderTransaction);
// router.route("/pay").post(controller.pay);
// router.route("/capture").post(controller.capture);
// router.route("/singleorder").post(controller.getSingleOrder);
// router.route("/getnotification").post(controller.getNotifications);
// router.route("/addcard").post(controller.addCard);
// router.route("/getcard").post(controller.getCard);
// router.route("/deletecard").post(controller.deleteCard);

module.exports = router;
