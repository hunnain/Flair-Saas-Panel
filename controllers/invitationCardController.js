const fs        = require("fs")
const GroupModel = require("../models/groups");
const InvitationCardModel = require("../models/InvitationCard");
const moment = require('moment-timezone');
// const jwt 	    = require('jsonwebtoken');
// const Push = require("../helper/pushNotifications");
// const User = require('../models/user');
const NotificationModel = require('../models/notification');

// Creating Invitation Card this will show to the user friends and groups
exports.createInvitationCard = async function (req, res) {
    try{

    if (!req.body.userId || !req.body.date || !req.body.timezoneName) return res.status(400).send({success: false, message:"Invalid Request"});

    const userDate = moment(req.body.date).format('YYYY-MM-DD');
    const userTime = moment(req.body.date).format("hh:mma");
    // Checking that inviation card should not exist in the db with the same time.
    let invitationCardChecking = await InvitationCardModel.find({userId: req.body.userId , invitationDate: userDate})
        // if (invitationCardChecking.length) return res.status(400).send({success: false ,message:"Invitation Not Created, This event !"});

        if (invitationCardChecking.length){
            invitationCardChecking.map((val,key)=>{
                const valueHourtTime = moment(val.date).format("hha");
                const userHourTime = moment(req.body.date).format("hha");
                if(valueHourtTime == userHourTime){
                            if (invitationCardChecking.length) return res.status(400).send({success: false ,message:"Invitation Not Created, This time of invitation already exist in our record, Please add one hour later time."});
                }
            })
        }

    let invitationCardModel = new InvitationCardModel();
    invitationCardModel.userId        = req.body.userId
    invitationCardModel.date     = req.body.date
    invitationCardModel.invitationDate     = userDate
    invitationCardModel.invitationTime     = userTime
    invitationCardModel.timezoneName     = req.body.timezoneName
    invitationCardModel.location = req.body.location
    invitationCardModel.isBooked = false

    invitationCardModel.save(async function (err, freetimeData) {
        if (err) return res.status(400).send({success: false, err ,message:"Invitation Not Created, Something Went Wrong!"});


        res.json({
            success: true,
            message: "Invitation Card Created",
            data: freetimeData
        });
    });

    // const dt = Date.now();
    // const dateUS = moment.tz( "PST");
    // var tz = moment.tz.guess();
    // console.log("date us", myMomentObject, 'aaa', anotherDate)
    }catch (error) {
        console.log("ERR",error)
        res.status(500).send({
            success: false, message:"Server Internal Error. Contact Support"
        });
    }
}




// Add plate in user kitchen
// exports.create = async function (req, res) {
//     if (!req.body.kitchenId || !req.body.dishName || !req.body.description || !req.body.ingredients || !req.body.readyIn || !req.body.servingSize || !req.body.foodCategory || !req.body.cuisine || !req.body.price || !req.body.image) return res.status(400).send({success: false, message:"Invalid Request"});

//         try{

//     let kitchen = await Kitchen.findOne({userId: req.user._id});
//     if(!kitchen) return res.status(400).send({success: false, message:"Kitchen Not Found"});

//     let plate = new PlateModel();
//     plate.userId     = req.user._id
//     plate.kitchenId          = req.body.kitchenId
//     plate.dishName           = req.body.dishName
//     plate.description           = req.body.description
//     plate.ingredients       = req.body.ingredients
//     plate.readyIn            = req.body.readyIn
//     plate.servingSize            = req.body.servingSize
//     plate.foodCategory            = req.body.foodCategory
//     plate.cuisine            = req.body.cuisine
//     plate.price            = req.body.price
//     plate.image            = req.body.image   
//     plate.specialDiet            = req.body.specialDiet
//     plate.allergies            = req.body.allergies
//     plate.location = kitchen.location

//     await plate.save(async function (err, plate) {
//         if (err) return res.status(400).send({success: false, message: err});
//         // console.log("chal", kitchen)
//         let userNotification = await User.find({ _id: { $in: kitchen.likes  } });
//         let push = new Push();
//         if(userNotification.length){
//             userNotification.map(async(value, key)=>{
//                 //  console.log("userss notifiction send", kitchen.kitchenName)

//                  push.sendPushNotification(value.notificationToken, `${kitchen.kitchenName} has posted a new meal, go check it out!`, "CheckOut Updtes", "plate", `${plate._id}`)
//                  let notificationSave = new NotificationModel();
//                  notificationSave.userId = value._id
//                  notificationSave.notificationTitle = "CheckOut Updtes"
//                  notificationSave.notificationMessage = `${kitchen.kitchenName} has posted a new meal, go check it out!`
//                  notificationSave.type = "plate"
//                  notificationSave.id = plate._id
//                  await notificationSave.save()
//              })
//         }
//         res.json({
//             success: true,
//             message: "Plate Has been Added!",
//             data: plate
//         });
//     });
// }catch (error){
//     res.status(500).send({
//         success: false, message:"Server Internal Error"
//     });
// }
// };

// // Get User Plates
// exports.getUserPlate = async (req, res) => {
//     if (!req.body.userId) return res.status(400).send({success: false, message:"Invalid Request"});
//     try{
//     const plate = await PlateModel.find({
// 		userId: req.body.userId
// 	});
//     if (!plate) return res.status(400).send({success: false, message:"Plates Not Found"});
    
//     res.json({
//         success: true,
//         data: plate
//     });
//     }catch (err){
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// // Update Plates
// exports.update = async function (req, res) {
//     if (!req.body.plateId) return res.status(400).send({success: false, message:"Invalid Request"});
//     try{
//     const plate = await PlateModel.findOne({
// 		_id: req.body.plateId,
//         userId: req.user._id
// 	});
//     if (!plate) return res.status(400).send({success: false, message:"Plate Not Found"});
    
//     plate.dishName           = req.body.dishName
//     plate.description           = req.body.description
//     plate.ingredients       = req.body.ingredients
//     plate.readyIn            = req.body.readyIn
//     plate.servingSize            = req.body.servingSize
//     plate.foodCategory            = req.body.foodCategory
//     plate.cuisine            = req.body.cuisine
//     plate.price            = req.body.price
//     plate.image            = req.body.image   
//     plate.specialDiet            = req.body.specialDiet
//     plate.allergies            = req.body.allergies

//     await plate.save(function (err, plate) {
//         if (err) return res.status(400).send({success: false, message: err});
        
//         res.json({
//             success: true,
//             message: "Plate Updated!",
//             data: plate
//         });
//     });
//     }catch (err){
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// exports.delete = async function (req, res) {
//     try {
//         await Lead.findByIdAndRemove(req.body.leadId)
//         res.json({
//             message: "Lead has been deleted!",
//         });        
//     } catch (error) {
//         res.json({
//             message: error,
//             error: true
//         });        
//     }
// };

// // Get Nearest Plate
// exports.getNearestPlateOfKitchen = async (req, res) => {
//     // We will get nearest according to kitchen query
//     if (!req.body.userLat || !req.body.userLong || !req.body.page) return res.status(400).send({success: false, message:"Invalid Request"});
//     let maxDocument = 10;
//     let pagesSkip = 10 * req.body.page;

//     try{
//     let plate = await PlateModel.aggregate([
//         {
//             $geoNear: {
//                 near: { type: 'Point', coordinates: [ req.body.userLong, req.body.userLat ] },
//                 spherical: true, 
//                 distanceField: "distance",
//                 maxDistance: 100000000
//             }
//         },
//         {$skip : parseFloat(pagesSkip)},
//         {$limit : maxDocument}
//       ])
//     if (!plate) return res.status(400).send({success: false, message:"Plates Not Found in your Area"});
    
//     await User.populate(plate, {path: "userId"});
//     await Kitchen.populate(plate, {path: "kitchenId"});
    
//     // let kitchenArray = []
//     // kitchen.map((value,key)=>{
//         //     // console.log("Kitchen",value)
//         //     kitchenArray.push(value._id)     
//         // })
        
//         // let plate = await PlateModel.find({ kitchenId: { $in: kitchenArray  } }).populate('userId').populate('kitchenId').lean();
//         // if (!plate) return res.status(400).send({success: false, message:"Plates Not Found in your Area"});
        
//         // Convert array element to string & then match the ids & add the distance field in the final object
//         // let all_to_str = kitchenArray.map(num => {return num.toString()})
//         // plate.map((value,key)=>{
//             //     // console.log("PLATEE",value)
//             //         let stringData = value.kitchenId.toString()
//             //         const checkingIds = all_to_str.indexOf(stringData)
//             //         if(checkingIds != -1){
//                 //             plate[key].distance = kitchen[checkingIds].distance
//                 //         }
//                 //     })
                
//                 // Remove Blocked User Content
//                 await plate.map((value,keyOfPlate)=>{
//                     // Also Remove Login User plate from data
//                     if(value.userId._id == req.user._id){
//                         delete plate[keyOfPlate]
//                     }
//                     if(!value.userId.blockedUsers){
//                         plate[keyOfPlate].userId.blockedUsers = []
//                     }
//                     if(value.userId.blockedUsers.length){
                        
//                         value.userId.blockedUsers.map((dti,key)=>{
//                             if(dti.user == req.user._id){
//                                 delete plate[keyOfPlate]
//                             }
//                         })
//                     }
//                 })
//     // Remove null property
//     var finalPlate = plate.filter(function (e) {return e != null;});
//     res.json({
//         success: true,
//         data: finalPlate
//     });
//     }catch (err){
//         console.log("err",err)
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// // Get Nearest Plate according to food category filter
// exports.getNearestPlateOfKitchencategory = async (req, res) => {
//     // We will get nearest according to kitchen query
//     if (!req.body.userLat || !req.body.userLong || !req.body.page || !req.body.category) return res.status(400).send({success: false, message:"Invalid Request"});
//     let maxDocument = 10;
//     let pagesSkip = 10 * req.body.page;

//     try{
//     let plate = await PlateModel.aggregate([
//         {
//             $geoNear: {
//                 near: { type: 'Point', coordinates: [ req.body.userLong, req.body.userLat ] },
//                 spherical: true, 
//                 distanceField: "distance",
//                 maxDistance: 100000000
//             }
//         },
//         { $match: { 
//             foodCategory: { $in: req.body.category },
//             // "cond1": "false"
//         }}, 
//         {$skip : parseFloat(pagesSkip)},
//         {$limit : maxDocument}
//       ])
//     if (!plate) return res.status(400).send({success: false, message:"Plates Not Found in your Area"});
//     await User.populate(plate, {path: "userId"});
//     await Kitchen.populate(plate, {path: "kitchenId"});

//     // let kitchenArray = []
//     // kitchen.map((value,key)=>{
//     //     kitchenArray.push(value._id)     
//     // })
//     // let plate = await PlateModel.find({ kitchenId: { $in: kitchenArray  }, foodCategory: { $in: req.body.category} }).populate('userId').populate('kitchenId').limit(maxDocument).lean();
//     // if (!plate) return res.status(400).send({success: false, message:"Plates Not Found in your Area"});

//     // Convert array element to string & then match the ids & add the distance field in the final object
//     // let all_to_str = kitchenArray.map(num => {return num.toString()})
//     // plate.map((value,key)=>{
//     //         let stringData = value.kitchenId.toString()
//     //         const checkingIds = all_to_str.indexOf(stringData)
//     //         if(checkingIds != -1){
//     //             plate[key].distance = kitchen[checkingIds].distance
//     //         }
//     //     })

//     // Remove Blocked User Content
//     await plate.map((value,keyOfPlate)=>{
//         // Also Remove Login User plate from data
//         if(value.userId._id == req.user._id){
//             delete plate[keyOfPlate]
//         }
//         if(!value.userId.blockedUsers){
//             plate[keyOfPlate].userId.blockedUsers = []
//         }
//         if(value.userId.blockedUsers.length){
            
//             value.userId.blockedUsers.map((dti)=>{
//                 if(dti.user == req.user._id){
//                     delete plate[keyOfPlate]
//                 }
//             })
//         }
//     })
//     // Remove null property
//     var finalPlate = plate.filter(function (e) {return e != null;});
//     res.json({
//         success: true,
//         data: finalPlate
//     });
//     }catch (err){
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// // Add or Undo Likes Plate
// exports.likePlate = async function (req, res) {
//     if (!req.body.plateId) return res.status(400).send({success: false, message:"Invalid Request"});
//     try{
//     const plate = await PlateModel.findOne({
// 		_id: req.body.plateId
// 	}).populate('userId')
//     if (!plate) return res.status(400).send({success: false, message:"Plate Not Found"});
    
//     const indexFind = plate.likes.indexOf(req.user._id)
//     if (indexFind > -1) {
//         plate.likes.splice(indexFind, 1);
//       }else{
//         plate.likes.push(req.user._id)
//       }
//       // Notification
//       var tokend = plate.userId.notificationToken
//     // var tokend = "dRnC9OwaR8-_Kr4o2zkd_m:APA91bEnOr7ST8xNkbiFWCWlImo-yLQTmbO-Jgds7kaQvy7FgZHDcgpU7Y1ByQO6ECV1yjxL3IEsWBSBrcPRijtgoXNFIaAogFitGmndoD87JrZ95q8YoXqpM1794hXVMr-gL1ATIY0F"
//       console.log("chalo",tokend)
//     await plate.save(async function (err, plate) {
//         if (err) return res.status(400).send({success: false, message: err});
        
//         let push = new Push();
//         // for (let i in user_token_data) {
//             push.sendPushNotification(tokend, `You have received a new like on your ${plate.dishName}`, "One New Like", "plate",`${plate._id}`)
//             let notificationSave = new NotificationModel();
//                  notificationSave.userId = plate.userId._id
//                  notificationSave.notificationTitle = "One New Like"
//                  notificationSave.notificationMessage = `You have received a new like on your ${plate.dishName}`
//                  notificationSave.type = "plate"
//                  notificationSave.id = plate._id
//                  await notificationSave.save()
//         // }
//         res.json({
//             success: true,
//             message: "Updated!",
//             data: plate
//         });
//     });
//     }catch (err){
//         console.log(err)
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// // GET Single USER LIKE PLATES
// // exports.getSingleUserLikedPlate = async (req, res) => {
// //     if (!req.body.userId) return res.status(400).send({success: false, message:"Invalid Request"});
// //     try{
// //     const plate = await PlateModel.find({
// // 		likes: req.user._id
// // 	});
// //     if (!plate) return res.status(400).send({success: false, message:"Plates Not Found"});
    
// //     res.json({
// //         success: true,
// //         data: plate
// //     });
// //     }catch (err){
// //         res.status(500).send({
// //             success: false, message:"Server Internal Error"
// //         });
// //     }
// // };

// exports.getSingleUserLikedPlate = async (req, res) => {
//     if (!req.body.userId) return res.status(400).send({success: false, message:"Invalid Request"});
//     try{
//     const plate = await PlateModel.find({
// 		likes: req.user._id
// 	}).populate('kitchenId');
//     if (!plate) return res.status(400).send({success: false, message:"Plates Not Found"});
    
//     res.json({
//         success: true,
//         data: plate
//     });
//     }catch (err){
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };




// // Get Single Plate detil with it's kitchen name
// exports.getSinglePlateDetail = async (req, res) => {
//     if (!req.body.plateId) return res.status(400).send({success: false, message:"Invalid Request"});
//     try{
//     const plate = await PlateModel.findOne({
// 		_id: req.body.plateId
// 	}).populate('kitchenId')
//     if (!plate) return res.status(400).send({success: false, message:"Plates Not Found"});
    
//     res.json({
//         success: true,
//         data: plate
//     });
//     }catch (err){
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// // Detail Filter with search API
// exports.getNearestPlateOfKitchenSearchWithFlter = async (req, res) => {
//     // We will get nearest according to kitchen query
//     if (!req.body.userLat || !req.body.userLong || !req.body.page) return res.status(400).send({success: false, message:"Invalid Request"});
//     let maxDocument = 10;
//     let pagesSkip = 10 * req.body.page;

//     try{
//     let kitchen = await Kitchen.aggregate([
//         {
//             $geoNear: {
//                 near: { type: 'Point', coordinates: [ req.body.userLong, req.body.userLat ] },
//                 spherical: true, 
//                 distanceField: "distance",
//                 maxDistance: 100000000
//             }
//         },
//         {$skip : parseFloat(pagesSkip)},
//         {$limit : maxDocument}
//       ])
//     if (!kitchen) return res.status(400).send({success: false, message:"Kitchen Not Found in your Area"});
//     let kitchenArray = []
//     kitchen.map((value,key)=>{
//         kitchenArray.push(value._id)     
//     })
//     let obj = { kitchenId: { $in: kitchenArray } }
//     if(req.body.searchString){
//         obj.ingredients= { $regex: new RegExp("^" + req.body.searchString, "i") }
//     }
//     if(req.body.category.length){
//         obj.foodCategory= { $in: req.body.category}
//     }
//     if(req.body.cuisine.length){
//         obj.cuisine= { $in: req.body.cuisine}
//     }
//     if(req.body.specialDiet.length){
//         obj.specialDiet= { $in: req.body.specialDiet}
//     }
//     if(req.body.allergies.length){
//         obj["$nor"] = [{allergies: req.body.allergies}]
//     }
//     if(req.body.readyIn.length){
//         obj.readyIn= req.body.readyIn
//     }
//     // console.log("object", obj)
//     let plate = await PlateModel.find(obj).select('-__v').populate('userId').populate('kitchenId').limit(maxDocument).lean();
//     if (!plate.length) return res.status(400).send({success: false, message:"Plates Not Found in your Area"});

//         // Convert array element to string & then match the ids & add the distance field in the final object
//         let all_to_str = await kitchenArray.map(num => {return num.toString()})
//         await plate.map((value,key)=>{
//             if(!value.userId.blockedUsers){
//             plate[key].userId.blockedUsers = []
//         }
//                 let stringData = value.kitchenId.toString()
//                 const checkingIds = all_to_str.indexOf(stringData)
//                 if(checkingIds != -1){
//                     plate[key].distance = kitchen[checkingIds].distance
//                 }
//             })

//     // Remove Blocked User Content
//     await plate.map((value,keyOfPlate)=>{
//         // Also Remove Login User plate from data
//         if(value.userId._id == req.user._id){
//             delete plate[keyOfPlate]
//         }
//         if(value.userId.blockedUsers.length){
            
//             value.userId.blockedUsers.map((dti)=>{
//                 if(dti.user == req.user._id){
//                     delete plate[keyOfPlate]
//                 }
//             })
//         }
//     })
//     // Remove null property
//     var finalPlate = plate.filter(function (e) {return e != null;});
//     res.json({
//         success: true,
//         data: finalPlate
//     });
//     }catch (err){
//         console.log("err",err)
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };