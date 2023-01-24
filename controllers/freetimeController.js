const UserModel = require("../models/shopAdminSignup");
const UserFreeTimeModel  = require('../models/userFreeTime');
const GroupModel = require("../models/groups");
const InvitationCardModel = require("../models/InvitationCard");
// const Kitchen   = require('../models/kitchen');
// const PlateModel      = require('../models/plates');
// const OrderModel      = require('../models/order');
const jwt       = require('jsonwebtoken');
const Push = require("../helper/pushNotifications");
var moment = require('moment');

// Add Free Time
exports.addFreeTime = async function (req, res) {
    try{

    if (!req.body.userId) return res.status(400).send({success: false, message:"Invalid Request"});

    
    let userFreeTimeModel = new UserFreeTimeModel();
    userFreeTimeModel.userId        = req.body.userId
    userFreeTimeModel.monday     = req.body.monday
    userFreeTimeModel.tuesday     = req.body.tuesday
    userFreeTimeModel.wednesday = req.body.wednesday
    userFreeTimeModel.thursday =  req.body.thursday
    userFreeTimeModel.friday = req.body.friday
    userFreeTimeModel.saturday = req.body.saturday
    userFreeTimeModel.sunday = req.body.sunday

    userFreeTimeModel.save(async function (err, freetimeData) {
        if (err) return res.status(400).send({success: false, message:"FreeTime Not Saved, Maybe Alredy Added!"});


        res.json({
            success: true,
            message: "Free Time Added",
            data: freetimeData
        });
    });
    }catch (error) {
        console.log("ERR",error)
        res.status(500).send({
            success: false, message:"Server Internal Error. Contact Support"
        });
    }
}

// Update LoggedIn User Free Time
// Add Free Time
exports.updateFreeTime = async function (req, res) {
    try{

    let userFreeTimeModel = await UserFreeTimeModel.findOne({userId: req.user._id})
        if (!userFreeTimeModel) return res.status(400).send({success: false, message:"Not Found"});
    
        if(req.body.monday){
            userFreeTimeModel.monday     = req.body.monday
        }
        if(req.body.tuesday){
            userFreeTimeModel.tuesday     = req.body.tuesday
        }
        if(req.body.wednesday){
            userFreeTimeModel.wednesday = req.body.wednesday
        }
        if(req.body.thursday){
            userFreeTimeModel.thursday =  req.body.thursday
        }
        if(req.body.friday){
            userFreeTimeModel.friday = req.body.friday
        }
        if(req.body.saturday){
            userFreeTimeModel.saturday = req.body.saturday
        }
        if(req.body.sunday){
            userFreeTimeModel.sunday = req.body.sunday
        }

    userFreeTimeModel.save(async function (err, freetimeData) {
        if (err) return res.status(400).send({success: false, message:"FreeTime Not Saved, Eror Contact Admin"});


        res.json({
            success: true,
            message: "Free Time Updated",
            data: freetimeData
        });
    });
    }catch (error) {
        console.log("ERR",error)
        res.status(500).send({
            success: false, message:"Server Internal Error. Contact Support"
        });
    }
}

// Get Logged In User Free Time
exports.getLoggedInUserFreeTime = async function (req, res) {
    try{

    // Find The Free time of logged in user
    let userFreeTimeModel = await UserFreeTimeModel.findOne({userId: req.user._id})
    if (!userFreeTimeModel) return res.status(400).send({success: false, message:"Not Found"});

        res.json({
            success: true,
            message: "Free time User",
            data: userFreeTimeModel
        });
    }catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
}

// Get Single User Free Time
exports.getSingleUserFreeTime = async function (req, res) {
    try{
        if (!req.body.userId) return res.status(400).send({success: false, message:"Invalid Request"});
    
    let userFreeTimeModel = await UserFreeTimeModel.findOne({userId: req.body.userId})
    if (!userFreeTimeModel) return res.status(400).send({success: false, message:"Not Found"});

        res.json({
            success: true,
            message: "Free time User",
            data: userFreeTimeModel
        });
    }catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
}

// DashBoard Home API create auto invitation card & get the other people invitation list
exports.getHomeInvitationList = async function (req, res) {
    try{
        // We will get invitation card based on current user in the group, This current user can see all other user inviation card which is aprt of his groups
        let group = await GroupModel.find({users: req.user._id})
        let groupData;
        let freetimeData = []
        if (!group.length){
            groupData = []
        }
        var groupUsersArray = [];
        group.map((val,key)=>{
            // console.log("val", val)
            // Just remove current user from the array list
            val.users.map((val1,key1)=>{
                if(val1 !== req.user._id){
                    groupUsersArray.push(val1)
                }
            })
        })

        // Get Invitation Card
        // Need to add additional requirement only get invitation card based on future time
        let startDate = new Date(new Date().toDateString());
        var priorDate = new Date(new Date().setDate(startDate.getDate() + 30));
                    // console.log("start date", startDate, 'end date', priorDate)
        let invitationCardList = await InvitationCardModel.find({ userId: { $in: groupUsersArray  }, date : {"$gte": startDate, "$lt": priorDate}, isBooked: false }).populate('userId').lean();
        if (!invitationCardList.length){
            groupData = []
        }
        groupData = invitationCardList;
    
        let userFreeTimeModel = await UserFreeTimeModel.findOne({userId: req.user._id})
        // console.log("Date", userFreeTimeModel)        
        if (userFreeTimeModel){
            var dt = moment().format('dddd');
            var dts = dt.toLowerCase()
            console.log("Date", dts, userFreeTimeModel[dts])
            let freeTimeObj = {
                dts,
                time: userFreeTimeModel[dts]
            }
            freetimeData = freeTimeObj
        }
    
    
            res.json({
                success: true,
                message: "Free time User",
                group: groupData,
                freetime: freetimeData
            });
        }catch (error) {
            res.status(500).send({
                success: false, error,message:"Server Internal Error"
            });
        }
}


// Get Loggedin User group in which he has been added
exports.getLoggedinUserGroup = async function (req, res) {
    try{
        if (!req.body.page) return res.status(400).send({success: false, message:"Invalid Request"});
        let maxDocument = 10;
        let pagesSkip = 10 * req.body.page;
    // console.log('ddd', req.user)
    let group = await GroupModel.find({users: req.user._id}).skip(parseFloat(pagesSkip))
    .limit(maxDocument)
    if (!group.length) return res.status(400).send({success: false, message:"Not Found"});
        
    
        res.json({
            success: true,
            message: "Group Detail",
            data: group
        });
    }catch (error) {
        res.status(500).send({
            success: false, error, message:"Server Internal Error"
        });
    }
}


// // Get ALL Review of Specific Plate
// exports.getAllReviewsOfPlate = async function (req, res) {
//     try{
//         if (!req.body.plateId|| !req.body.page) return res.status(400).send({success: false, message:"Invalid Request"});
//         let maxDocument = 10;
//         let pagesSkip = 10 * req.body.page;

//     // Find The Reviews
//     let review = await ReviewModel.find({plateId: req.body.plateId}).sort({created_at: -1}).skip(parseFloat(pagesSkip)).limit(maxDocument)
//     if (!review) return res.status(400).send({success: false, message:"Review Not Found"});

//         res.json({
//             success: true,
//             message: "Plate Reviews",
//             data: review
//         });
//     }catch (error) {
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// }
