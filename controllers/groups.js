const fs        = require("fs")
const jwt 	    = require('jsonwebtoken');
const GroupModel = require("../models/groups");
const Push = require("../helper/pushNotifications");
const NotificationModel = require('../models/notification');
// const ReviewModel  = require('../models/reviews');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// Load the full build.
var _ = require('lodash');
// const sortByDistance = require('sort-by-distance');

exports.createGroup = async function (req, res) {
    // Required Request
    if (!req.body.GroupName || !req.body.users) return res.status(400).send({success: false, message:"Invalid Request"});

    var group = new GroupModel();
    group.GroupName     = req.body.GroupName
    group.users = req.body.users

    try{       
        await group.save(function (err, group) {
            if (err) return res.status(400).send({success: false, message: err});
            
            res.json({
                success: true,
                message: "Group Has been created!",
                data: group
            });
        });
    }catch (error){
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
};

// get All Group
exports.getAllGroup = async function (req, res) {
    try{
        if (!req.body.page) return res.status(400).send({success: false, message:"Invalid Request"});
        let maxDocument = 10;
        let pagesSkip = 10 * req.body.page;

    let group = await GroupModel.find({}).skip(parseFloat(pagesSkip))
    .limit(maxDocument)
    if (!group) return res.status(400).send({success: false, message:"Not Found"});
        
    
        res.json({
            success: true,
            message: "Group Detail",
            data: group
        });
    }catch (error) {
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
}

// Add User in the Group
exports.addUserInGroup = async function (req, res) {
    try{
        if (!req.body.groupId || !req.body.userId) return res.status(400).send({success: false, message:"Invalid Request"});

    let group = await GroupModel.findOne({_id:req.body.groupId})
    if (!group) return res.status(400).send({success: false, message:"Not Found"});
        
    let isValueMatch = group.users.includes(req.body.userId);
    if (isValueMatch == true) return res.status(400).send({success: false, message:"User Alreadyt Added"});

    group.users.push(req.body.userId)
    await group.save(function (err, user) {
        if (err) return res.status(400).send({success: false, message: err});
    
        res.json({
            success: true,
            message: "Group Detail",
            data: group
        });
    })
    }catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
}

// // Get Loggedin User group in which he has been added
// exports.getLoggedinUserGroup = async function (req, res) {
//     try{
//         if (!req.body.page) return res.status(400).send({success: false, message:"Invalid Request"});
//         let maxDocument = 10;
//         let pagesSkip = 10 * req.body.page;
//     // console.log('ddd', req.user)
//     let group = await GroupModel.find({users: req.user._id}).skip(parseFloat(pagesSkip))
//     .limit(maxDocument)
//     if (!group.length) return res.status(400).send({success: false, message:"Not Found"});
        
    
//         res.json({
//             success: true,
//             message: "Group Detail",
//             data: group
//         });
//     }catch (error) {
//         res.status(500).send({
//             success: false, error, message:"Server Internal Error"
//         });
//     }
// }














// exports.updateKitchen = async function (req, res) {
//     if (!req.body.kitchenId) return res.status(400).send({success: false, message:"Invalid Request"});
//     try{
//         const kitchen = await Kitchen.findOne({
//             _id: req.body.kitchenId,
//             userId: req.user._id
//         });
//         if (!kitchen) return res.status(400).send({success: false, message:"Kitchen Not Found"});

//         if(req.body.kitchenName){
//             kitchen.kitchenName = req.body.kitchenName.toLowerCase()
//         }
//         if(req.body.description){
//             kitchen.description = req.body.description 
//         }
//         if(req.body.mobile){
//             kitchen.mobile      = req.body.mobile 
//         }
//         if(req.body.city){
//             kitchen.city        = req.body.city 
//         }
//         if(req.body.zipCode){
//             kitchen.zipCode     = req.body.zipCode
//         }
//         if(req.body.state){
//             kitchen.state       = req.body.state
//         }
//         if(req.body.lat && req.body.long){
//             // Coordinates
//     req.body.location = {
//         type : "Point",
//         address : req.body.address,
//         coordinates : [ parseFloat(req.body.long), parseFloat(req.body.lat)]
//       }
//             kitchen.location = req.body.location
//         }
//         if(req.body.kitchenImage){
//             kitchen.kitchenImage  = req.body.kitchenImage
//         }
//         if(req.body.facebookLink){
//             kitchen.facebookLink  = req.body.facebookLink
//         }
//         if(req.body.instagramLink){
//             kitchen.instagramLink = req.body.instagramLink
//         }
//         if(req.body.tiktokLink){
//             kitchen.tiktokLink    = req.body.tiktokLink
//         }
//         if(req.body.stripeAccountConnected){
//             kitchen.stripeAccountConnected    = req.body.stripeAccountConnected
//         }

//         await kitchen.save(function (err, kitchenData) {
//             if (err) return res.status(400).send({success: false, message: err});
            
//             res.json({
//                 success: true,
//                 message: "Kitchen Detail Updated!",
//                 data: kitchenData
//             });
//         })


//     }catch (error) {
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }

// };
// exports.deleteUserKitchen = async function (req, res) {
//     if (!req.body.kitchenId) return res.status(400).send({success: false, message:"Invalid Request"});
//     try{
//         const kitchen = await Kitchen.findOne({
//             _id: req.body.kitchenId,
//             userId: req.user._id
//         })
//         if (!kitchen) return res.status(400).send({success: false, message:"Kitchen Not Found"});
//         await kitchen.remove(async function (err, kitchenData) {
//             if (err) return res.status(400).send({success: false, message: err});

//             // Delete User Kitchen Plate as well
//             const plate = await PlateModel.deleteMany({kitchenId: req.body.kitchenId})
            
            
//             res.json({
//                 success: true,
//                 message: "Kitchen Deleted",
//                 data: kitchenData
//             });
//         })
//     }catch (error) {
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// // Get Single Kitchen
// exports.getSingleKitchen = async (req, res) => {
//     if (!req.body.userId) return res.status(400).send({success: false, message:"Invalid Request"});
//     try{
//     const kitchen = await Kitchen.findOne({
// 		userId: req.body.userId
// 	});
//     if (!kitchen) return res.status(400).send({success: false, message:"Kitchen Not Found"});
    
//     res.json({
//         success: true,
//         data: kitchen
//     });
//     }catch (err){
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// // Get Single Kitchen
// exports.getSingleKitchenViaID = async (req, res) => {
//     if (!req.body.kitchenId) return res.status(400).send({success: false, message:"Invalid Request"});
//     try{
//     const kitchen = await Kitchen.findOne({
// 		_id: req.body.kitchenId
// 	});
//     if (!kitchen) return res.status(400).send({success: false, message:"Kitchen Not Found"});
    
//     res.json({
//         success: true,
//         data: kitchen
//     });
//     }catch (err){
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// // Agree Kitchen Terms
// exports.agreeKitchenTerms = async (req, res) => {
//     if (!req.body.agreeKitchenTerms) return res.status(400).send({success: false, message:"Invalid Request"});
//     try{
//     let kitchen = await Kitchen.findOne({userId: req.user._id});
//     if(!kitchen) return res.status(400).send({success: false, message:"Kitchen Not Found"});

//     kitchen.agreeKitchenTerms    = req.body.agreeKitchenTerms  
//         await kitchen.save(function (err, kitchen) {
//             if (err) return res.status(400).send({success: false, message: err});
            
//             res.json({
//                 success: true,
//                 message: "Kitchen Terms has been Agreed!",
//                 data: kitchen
//             });
//         });
//     }catch (err){
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// // Search Kitchen
// exports.searchKitchen = async (req, res) => {
//     if (!req.body.userId) return res.status(400).send({success: false, message:"Invalid Request"});
//     try{
//     const kitchen = await Kitchen.findOne({
// 		userId: req.body.userId
// 	});
//     if (!kitchen) return res.status(400).send({success: false, message:"Kitchen Not Found"});
    
//     res.json({
//         success: true,
//         data: kitchen
//     });
//     }catch (err){
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// // Get Kitchen with nearest location
// exports.getNearestKitchen = async (req, res) => {
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

//     await User.populate(kitchen, {path: "userId"});

//     var kitchenArrayForReviews = [];

//     // Remove Blocked User Content
//     await kitchen.map((value,keyOfKitchen)=>{
//           // Also Remove Login User plate from data
//           if(value.userId._id == req.user._id){
//             delete kitchen[keyOfKitchen]
//         }
//         // Adding value in kitchen array
//         kitchenArrayForReviews.push(value._id)
//         if(value.userId.blockedUsers.length){
            
//             value.userId.blockedUsers.map((dti,key)=>{
//                 if(dti.user == req.user._id){
//                     delete kitchen[keyOfKitchen]
//                 }
//             })
//         }
//     })

//     // Average Review of each kitchen & it's count
//     let reviews = await ReviewModel.find({ kitchenId: { $in: kitchenArrayForReviews  } });
//     if(reviews.length){
//         // console.log("Kitchen Array ", reviews)
//         kitchen.map((val1,key1)=>{
//             var reviewsCount = 0;
//             var oneStar = 0;
//             var twoStar = 0;
//             var threeStar = 0;
//             var fourStar = 0;
//             var fiveStar = 0;
//             let valToString = val1._id.toString()
//             const index = reviews.map(object => {
//                 return object.kitchenId.toString() === valToString;
//               });
//             const statementAr = index.map((val2,key2)=>{
//                 if(val2 === true){
//                     reviewsCount += 1
//                     if(reviews[key2].star === 1){
//                        oneStar += 1
//                     }else if(reviews[key2].star === 2){
//                         twoStar += 1
//                     }else if(reviews[key2].star === 3){
//                         threeStar += 1
//                     }else if(reviews[key2].star === 4){
//                         fourStar += 1
//                     }else if(reviews[key2].star === 5){
//                         fiveStar += 1
//                     }
              
//                 }
//             })

//             var oneTotal = oneStar * 1;
//             var twoTotal = twoStar * 2;
//             var threeTotal = threeStar *3
//             var fourTotal = fourStar * 4;
//             var fiveTotal = fiveStar * 5;
//             var totalClicks = (oneStar + twoStar + threeStar + fourStar + fiveStar);
//             var totalStars = (oneTotal + twoTotal + threeTotal + fourTotal + fiveTotal);
//             var avgStars = (totalStars/totalClicks);
//             kitchen[key1].star = avgStars;
//             kitchen[key1].reviewsCount = reviewsCount;
//         })

//     }
    
//     // Remove null property
//     var finalKitchen = kitchen.filter(function (e) {return e != null;});
//     res.json({
//         success: true,
//         data: finalKitchen
//     });
//     }catch (err){
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// // Search Kitchen with nearest location
// exports.searchKitchen = async (req, res) => {
//     if (!req.body.userLat || !req.body.userLong || !req.body.page || !req.body.search) return res.status(400).send({success: false, message:"Invalid Request"});
//     let maxDocument = 10;

//     try{
//     let kitchen = await Kitchen.aggregate([
//         {
//             $geoNear: {
//                 near: { type: 'Point', coordinates: [ req.body.userLong, req.body.userLat ] },
//                 // $match: { kitchenName: { $regex: req.body.search } },
//                 spherical: true, 
//                 distanceField: "distance",
//                 maxDistance: 100000000
//             }
//         },
//         { $match: {  kitchenName: { $regex: req.body.search } } },
//         {$skip : parseFloat(req.body.page)},
//         {$limit : maxDocument}
//       ])
//     if (!kitchen) return res.status(400).send({success: false, message:"Kitchen Not Found"});

//     await User.populate(kitchen, {path: "userId"});

//     var kitchenArrayForReviews = [];
//     // Remove Blocked User Content
//     await kitchen.map((value,keyOfKitchen)=>{
//          // Also Remove Login User plate from data
//          if(value.userId._id == req.user._id){
//             delete kitchen[keyOfKitchen]
//         }
//         kitchenArrayForReviews.push(value._id)
//         if(value.userId.blockedUsers.length){
            
//             value.userId.blockedUsers.map((dti,key)=>{
//                 if(dti.user == req.user._id){
//                     delete kitchen[keyOfKitchen]
//                 }
//             })
//         }
//     })

//      // Average Review of each kitchen & it's count
//      let reviews = await ReviewModel.find({ kitchenId: { $in: kitchenArrayForReviews  } });
//      if(reviews.length){
//          // console.log("Kitchen Array ", reviews)
//          kitchen.map((val1,key1)=>{
//              var reviewsCount = 0;
//              var oneStar = 0;
//              var twoStar = 0;
//              var threeStar = 0;
//              var fourStar = 0;
//              var fiveStar = 0;
//              let valToString = val1._id.toString()
//              const index = reviews.map(object => {
//                  return object.kitchenId.toString() === valToString;
//                });
//              const statementAr = index.map((val2,key2)=>{
//                  if(val2 === true){
//                      reviewsCount += 1
//                      if(reviews[key2].star === 1){
//                         oneStar += 1
//                      }else if(reviews[key2].star === 2){
//                          twoStar += 1
//                      }else if(reviews[key2].star === 3){
//                          threeStar += 1
//                      }else if(reviews[key2].star === 4){
//                          fourStar += 1
//                      }else if(reviews[key2].star === 5){
//                          fiveStar += 1
//                      }
               
//                  }
//              })
 
//              var oneTotal = oneStar * 1;
//              var twoTotal = twoStar * 2;
//              var threeTotal = threeStar *3
//              var fourTotal = fourStar * 4;
//              var fiveTotal = fiveStar * 5;
//              var totalClicks = (oneStar + twoStar + threeStar + fourStar + fiveStar);
//              var totalStars = (oneTotal + twoTotal + threeTotal + fourTotal + fiveTotal);
//              var avgStars = (totalStars/totalClicks);
//              kitchen[key1].star = avgStars;
//              kitchen[key1].reviewsCount = reviewsCount;
//          })
 
//      }
//     // Remove null property
//     var finalKitchen = kitchen.filter(function (e) {return e != null;});
//     res.json({
//         success: true,
//         data: finalKitchen
//     });
//     }catch (err){
//         console.log("err",err)
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// // Add or Undo Likes Kitchen
// exports.likeKitchen = async function (req, res) {
//     if (!req.body.kitchenId) return res.status(400).send({success: false, message:"Invalid Request"});
//     try{
//     const kitchen = await Kitchen.findOne({
// 		_id: req.body.kitchenId
// 	}).populate('userId')
//     if (!kitchen) return res.status(400).send({success: false, message:"Kitchen Not Found"});
    
//     const indexFind = kitchen.likes.indexOf(req.user._id)
//     if (indexFind > -1) {
//         kitchen.likes.splice(indexFind, 1);
//       }else{
//         kitchen.likes.push(req.user._id)
//       }
//     //    console.log("Notificaton", kitchen.userId.notificationToken)
//       // Send Notfication
//       var tokend = kitchen.userId.notificationToken
//     await kitchen.save(async function (err, kitchen) {
//         if (err) return res.status(400).send({success: false, message: err});

//         let push = new Push();
//         // for (let i in user_token_data) {
//             push.sendPushNotification(tokend, "You have received a new like on your kitchen", "One New Like", "likekitchen", `${kitchen._id}`)
//             let notificationSave = new NotificationModel();
//                  notificationSave.userId = kitchen.userId._id
//                  notificationSave.notificationTitle = "One New Like"
//                  notificationSave.notificationMessage = "You have received a new like on your kitchen"
//                  notificationSave.type = "likekitchen"
//                  notificationSave.id = kitchen._id
//                  await notificationSave.save()
//         // }
        
//         res.json({
//             success: true,
//             message: "Updated!",
//             data: kitchen
//         });
//     });
//     }catch (err){
//         console.log(err)
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// // GET Single USER LIKed Kitchen
// exports.getSingleUserLikedKitchen = async (req, res) => {
//     if (!req.body.userId) return res.status(400).send({success: false, message:"Invalid Request"});
//     try{
//     const kitchen = await Kitchen.find({
// 		likes: req.user._id
// 	});
//     if (!kitchen) return res.status(400).send({success: false, message:"Kitchen Not Found"});
    
//     res.json({
//         success: true,
//         data: kitchen
//     });
//     }catch (err){
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };

// // Block User & Vise Versa
// exports.blockUser = async function (req, res) {
//     if (!req.body.userId || !req.body.recipentId) return res.status(400).send({success: false, message:"Invalid Request"});

//     try{
//         const user = await User.findOne({
//             _id: req.body.userId,
//         });
//         if (!user) return res.status(400).send({success: false, message:"User Not Found"});

//         const blockedUsersData = {
//             isHeBlocked : true,
//             user: req.body.recipentId
//         }
//         user.blockedUsers.push(blockedUsersData)
//         await user.save(async function (err, user) {
//             if (err) return res.status(400).send({success: false, message: err});
            
//             // Find recipent user
//             const recipentUser = await User.findOne({
//                 _id: req.body.recipentId,
//             });
//             if(recipentUser){
//                 const blockedUsersData = {
//                     isHeBlocked : false,
//                     user: req.body.userId
//                 }
//                 recipentUser.blockedUsers.push(blockedUsersData)
//                 await recipentUser.save()
//             }
            
//             res.json({
//                 success: true,
//                 message: "User Detail Updated!",
//                 data: user
//             });
//         })
//     } catch (error) {
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }

// };

// // Strpe Merchant exist
// exports.isStripeMerchantConnected = async (req, res) => {
//     if (!req.body.kitchenId) return res.status(400).send({success: false, message:"Invalid Request"});
//     try{
//     const kitchen = await Kitchen.findOne({
// 		_id: req.body.kitchenId
// 	});
//     if (!kitchen) return res.status(400).send({success: false, message:"Kitchen Not Found"});

//         if(kitchen.stripeAccountId){

//             console.log('conected',kitchen.stripeAccountConnected)
//             res.json({
//                 success: true,
//                 data: kitchen,
//                 message: "Stripe is Connected"
//             });
//         }else{
//             res.json({
//                 success: false,
//                 data: kitchen,
//                 message: "Stripe is not Connected"
//             });
//         }
    
//     }catch (err){
//         res.status(500).send({
//             success: false, message:"Server Internal Error"
//         });
//     }
// };