const Kitchen   = require('../models/kitchen');
const User = require('../models/user');
// const ChatListModel = require('../models/chatList');
const MessagesModel = require('../models/messages');
const Push = require("../helper/pushNotifications");

exports.listChat = async function (req, res) {

    try{
    let userId = req.user._id;
    let chatList = await MessagesModel.find({ $or: [{ sender: userId }, { reciever: userId }] }).sort({date: -1}).populate("sender").populate("reciever");
    if (!chatList.length) return res.status(400).send({success: false, message:"Chat List Not Found"});
    
    var c = chatList.filter((value, index, self) =>
    index === self.findIndex((t) => (
        t.channel === value.channel
        ))
        )
        var userArrayForKitchen = [];
        
        c.map((value,key)=>{
            userArrayForKitchen.push(value.sender._id,value.reciever._id)
            value.sender.password = "";
        })

//   Find User Kitchen
const kitchen = await Kitchen.find({
    userId: { $in: userArrayForKitchen  }
});
kitchen.map((value,valueKey)=>{
    c.map((mainData,mainDataKey)=>{     
     if(mainData.sender._id.toString() == value.userId.toString()){
         c[mainDataKey].sender.password = value.kitchenName
     }
     if(mainData.reciever._id.toString() == value.userId.toString()){
        c[mainDataKey].reciever.password = value.kitchenName
     }
    })
})

// var tokend = "dRnC9OwaR8-_Kr4o2zkd_m:APA91bEnOr7ST8xNkbiFWCWlImo-yLQTmbO-Jgds7kaQvy7FgZHDcgpU7Y1ByQO6ECV1yjxL3IEsWBSBrcPRijtgoXNFIaAogFitGmndoD87JrZ95q8YoXqpM1794hXVMr-gL1ATIY0F"
// // var tokend = order.buyerUserId.notificationToken
// // Send Notification
// let push = new Push();
// // for (let i in user_token_data) {
//     push.sendPushNotification(tokend, `New Message Checkout!`, "New Messege", "chat", `${chatList._id}`)
res.json({
    success: true,
    message: "Chat List",
    data: c
});
    }catch (err){
        console.log(err)
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
 
}


exports.chatMessages = async function (req, res) {
    try{
        if (!req.body.channel || !req.body.page) return res.status(400).send({success: false, message:"Invalid Request"});
        let maxDocument = 20;
        let pagesSkip = 20 * req.body.page;

        let updateReadStatus = await MessagesModel.updateMany({channel: req.body.channel}, { $set: { read :true }});
        
        let chat = await MessagesModel.find({ channel: req.body.channel}).sort({date: -1}).populate("sender").populate("reciever").skip(parseFloat(pagesSkip)).limit(maxDocument)
        if (!chat.length) return res.status(400).send({success: false, message:"Chat Not Found of this channel"});
        
        // var tokend = "dRnC9OwaR8-_Kr4o2zkd_m:APA91bEnOr7ST8xNkbiFWCWlImo-yLQTmbO-Jgds7kaQvy7FgZHDcgpU7Y1ByQO6ECV1yjxL3IEsWBSBrcPRijtgoXNFIaAogFitGmndoD87JrZ95q8YoXqpM1794hXVMr-gL1ATIY0F"
        // var tokend = order.buyerUserId.notificationToken
        // Send Notification
        // let push = new Push();
        // for (let i in user_token_data) {
            // push.sendPushNotification(tokend, `New Message Checkout!`, "New Messege", "chat", `${chat._id}`)
        res.json({
            success: true,
            message: "Chat Messages",
            data: chat
        });

    }catch (err){
        console.log("ERR",err)
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
}