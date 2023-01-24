const UserModel = require("../models/shopAdminSignup");
const GroupModel = require("../models/groups");
const InvitationCardModel = require("../models/InvitationCard");
const VirtualMeetingModel = require("../models/virtualMeeting");
const moment = require('moment-timezone');
const jwt = require("jsonwebtoken");
const Push = require("../helper/pushNotifications");
const NotificationModel = require("../models/notification");
const {RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole} = require('agora-access-token')
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
var apn = require('apn');
const fs = require('fs')
var admin = require("firebase-admin");


// Firebase Setups
// const serviceAccount = require('../firbaseVeliaServiceAccount.json');

// initializeApp({
//   credential: cert(serviceAccount)
// });

const db = getFirestore();

exports.createVirtualMeeting = async function (req, res) {
  try{

  if (!req.body.invitationCardId || !req.body.invitationCreatorUserId || !req.body.invitationAcceptorUserId) return res.status(400).send({success: false, message:"Invalid Request"});

  const userDate = moment(req.body.date).format('YYYY-MM-DD');
  const userTime = moment(req.body.date).format("hh:mma");
//   Checking that invitation card should exist in the db then proceed further
  let invitationCardChecking = await InvitationCardModel.findOne({userId: req.body.invitationCreatorUserId , _id: req.body.invitationCardId})
      if (!invitationCardChecking) return res.status(400).send({success: false ,message:"This invitation not exist in database, You cannot create any virtual Meeting"});


  // Checking that virtual meeting should not exist in the db with the same time.
  let virtualMeetingChecking = await VirtualMeetingModel.find({invitationCreatorUserId: req.body.invitationCreatorUserId, invitationAcceptorUserId: req.body.invitationAcceptorUserId, meetingDate: userDate})
      // if (invitationCardChecking.length) return res.status(400).send({success: false ,message:"Invitation Not Created, This event !"});

      if (virtualMeetingChecking.length){
        virtualMeetingChecking.map((val,key)=>{
              const valueHourtTime = moment(val.date).format("hha");
              const userHourTime = moment(req.body.date).format("hha");
              if(valueHourtTime == userHourTime){
                          if (virtualMeetingChecking.length) return res.status(400).send({success: false ,message:"Virtual Meeting Not Created, This time of Virtual Meeting already exist in our record, Please add one hour later time."});
              }
          })
      }

  let virtualMeetingModel = new VirtualMeetingModel();
  virtualMeetingModel.invitationCardId        = req.body.invitationCardId
  virtualMeetingModel.invitationCreatorUserId     = invitationCardChecking.userId
  virtualMeetingModel.invitationAcceptorUserId     = req.body.invitationAcceptorUserId
  virtualMeetingModel.date     = invitationCardChecking.date
  virtualMeetingModel.timezoneName     = invitationCardChecking.timezoneName
  virtualMeetingModel.meetingDate = invitationCardChecking.invitationDate
  virtualMeetingModel.meetingTime = invitationCardChecking.invitationTime
  virtualMeetingModel.location = invitationCardChecking.location

  virtualMeetingModel.save(async function (err, freetimeData) {
    if (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        // Duplicate username
        return res.status(400).send({ succes: false, message: 'Looks Like this meeting already exist!' });
      }

      // Some other error
      return res.status(400).send({success: false, err ,message:"Virtual Meeting Not Created, Something Went Wrong!"});
    }

    invitationCardChecking.isBooked = true
    invitationCardChecking.save();


      res.json({
          success: true,
          message: "Virtual Meeting Created",
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



// Agora Channel Creation
exports.createAgoraChannelAndToken = async function (req, res) {
    // try{
        if (!req.body.invitationCreatorUserId || !req.body.invitationAcceptorUserId) return res.status(400).send({success: false, message:"Invalid Request, This is test api"});

        let invitationCreatorUserId = req.body.invitationCreatorUserId;
        let invitationAcceptorUserId = req.body.invitationAcceptorUserId;
        
        const appID = 'a6f51d1f07cc4a6fb34bdc9794db82c6';    
        const appCertificate = '722c15167c6c42d299bd5e21652b4cd7';
        const channelName = Math.floor(Math.random() * 100).toString()
        const uid = 0;
        const role = RtcRole.PUBLISHER;
        const expirationTimeInSeconds = 3600

  const currentTimestamp = Math.floor(Date.now() / 1000)

  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds
  // IMPORTANT! Build token with either the uid or with the user account. Comment out the option you do not want to use below.

  // Build token with uid
  const token = RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channelName, uid, role, privilegeExpiredTs);
  console.log("Token With Integer Number Uid: " + token);

//   Add Data in firestore
const usersDb = db.collection('calling');


let invitationCreator = await User.findOne({_id: invitationCreatorUserId}).lean()
if (!invitationCreator) return res.status(400).send({success: false, message:"Not Found"});
console.log('ccccreator', invitationCreator)
delete invitationCreator.password

let invitationAcceptor = await User.findOne({_id: invitationAcceptorUserId}).lean()
if (!invitationAcceptor) return res.status(400).send({success: false, message:"Not Found"}); 
console.log('ccccreator', invitationAcceptor)
delete invitationAcceptor.password

// Invitation Creator
await usersDb.doc(invitationCreatorUserId).set({
    token: token,
    channelName: channelName,
    mobile: invitationAcceptor.mobile,
    profilePic: invitationAcceptor.profilepic,
    // email: invitationAcceptor.email,
    name: invitationAcceptor.name,
    // user: invitationAcceptor, // In creator user acceptor data is going because frontend dont have acceptor data that'swhy
    callStarted: false
   });

// //    Invitation Acceptor
   await usersDb.doc(invitationAcceptorUserId).set({
    token: token,
    channelName: channelName,
    mobile: invitationCreator.mobile,
    profilePic: invitationCreator.profilepic,
    // email: invitationCreator.email,
    name: invitationCreator.name,
    // user: invitationCreator,  // In acceptor user creator data is going because frontend dont have creator data that'swhy
    callStarted: false
   });

var tokenFileForNotification = fs.readFileSync(__dirname + "/AuthKey_S254F8SJ3G.p8", 'utf8')

// If creator phone is ios then send notification there else send on it's android
if(invitationCreator.platform === "ios"){
  var options = {
    token: {
      key: tokenFileForNotification,
      keyId: "S254F8SJ3G",
      teamId: "RTNVR47W66"
    },
    production: false
  };

  var apnProvider = new apn.Provider(options);


  // Sender Notification Logic
  const notification = new apn.Notification();

  const recepients = [];
  // recepients.push(apn.token('dtohGl4Xek2fjxFn3p6FhY:APA91bGh9vaqpy1RoJrByuIF0Uvp0Yhdozz7Lutrejpxoy_ayiYFgePVMYCJBxdzV_QLsDphZE9AXKLlHJWwCv4oWvNXX_oT-xj6VwpVQItgr0OxM6qxKJhdSFichoQRXFSrhhgVb9om'));
  // recepients.push(apn.token('d4e2fF36FAA91b9a1BF00d7eaFeCBdDE9AC4606dFcFb9'));

  notification.topic = 'com.techni.velia.voip'; // you have to add the .voip here!!
  notification.payload = {
    "data": {
      mobileCreator: invitationCreator.mobile,
    profilePicCreator: invitationCreator.profilepic,
    emailCreator: invitationCreator.email,
    nameCreator: invitationCreator.name,
    mobileAcceptor: invitationAcceptor.mobile,
    profilePicAcceptor: invitationAcceptor.profilepic,
    emailAcceptor: invitationAcceptor.email,
    nameAcceptor: invitationAcceptor.name,
      token: token,
      channalName: channelName,
      callerName: "Idoh",
      localizedCallerName: "Idoh",
    },
    "callerName": "Idoh",
    "handle": "",
    "handleType": "generic",
    "hasVideo": false,
    "localizedCallerName": "Idoh",
    "headers": {
      "apns-expiration": "1604750400",
      "apns-push-type": "voip",
      "apns-priority": "10",
      "apns-topic": "com.techni.velia"
    }

  }

  notification.rawPayload = {
    mobileCreator: invitationCreator.mobile,
    profilePicCreator: invitationCreator.profilepic,
    emailCreator: invitationCreator.email,
    nameCreator: invitationCreator.name,
    mobileAcceptor: invitationAcceptor.mobile,
    profilePicAcceptor: invitationAcceptor.profilepic,
    emailAcceptor: invitationAcceptor.email,
    nameAcceptor: invitationAcceptor.name,
      token: token,
      channalName: channelName,
      callerName: "Idoh",
      localizedCallerName: "Idoh",
  }
  notification.expiry = "1604750400"
  notification.alert = ""
  notification.aps = {
    "content-available": 1,
  }


  // let tok = apn.token('f3084a642d2c1bf55db6182f7af451d531b8e7aef33b29e1f251d6f813768ad0')
  // Invitation Creator Notification
  let convertingIospnTokenIntoHex = Buffer.from(invitationCreator.iosApn, 'base64').toString('hex');
  let creatortok = apn.token(invitationAcceptor.iosApn)
  apnProvider.send(notification, creatortok).then((reponse) => {
    console.log("yai chala hai bhai ios creatior ka", reponse)
    if(reponse.failed.length){
      // console.log(reponse.failed, 'its failed');  
    }
    // console.log(reponse);
  });

}else{
  console.log("yai chala hai bhai android creatior ka")
  // Invitation Creator  
  const payload = {
    token: invitationCreator.notificationToken,
    notification: {
      title: "There is a Call!",
      body: "There is a Call Coming to You!"
    },
    data: {
      mobileCreator: invitationCreator.mobile,
    profilePicCreator: invitationCreator.profilepic,
    emailCreator: invitationCreator.email,
    nameCreator: invitationCreator.name,
    mobileAcceptor: invitationAcceptor.mobile,
    profilePicAcceptor: invitationAcceptor.profilepic,
    emailAcceptor: invitationAcceptor.email,
    nameAcceptor: invitationAcceptor.name,
      token: token,
      channalName: channelName,
      callerName: "Idoh",
      localizedCallerName: "Idoh",
    },
    "apns": {
      payload: {
        aps: {
          "content-available": 1,
          "alert": "",
          "type": "voip",
        }
      },
      "headers": {
        "apns-expiration": "1604750400",

        // "apns-priority":"10",
        // "apns-topic":"com.barontech.appacn.voip"
      }
    },
    "android": {
      "ttl": 4500
    },
  };
  admin.messaging().send(payload).then(() => {
    // response.send({
    //   status: true
    // })
  })
    .catch((err) => {
      console.log('err',err)
    })
}



// If creator phone is ios then send notification there else send on it's android
if(invitationAcceptor.platform === "ios"){
// Acceptor Notification Logic
const acceptorNotification = new apn.Notification();

const recepientss = [];

// recepients.push(apn.token('dtohGl4Xek2fjxFn3p6FhY:APA91bGh9vaqpy1RoJrByuIF0Uvp0Yhdozz7Lutrejpxoy_ayiYFgePVMYCJBxdzV_QLsDphZE9AXKLlHJWwCv4oWvNXX_oT-xj6VwpVQItgr0OxM6qxKJhdSFichoQRXFSrhhgVb9om'));
// recepients.push(apn.token('d4e2fF36FAA91b9a1BF00d7eaFeCBdDE9AC4606dFcFb9'));
acceptorNotification.topic = 'com.techni.velia.voip'; // you have to add the .voip here!!
acceptorNotification.payload = {
  "data": {
    mobileCreator: invitationCreator.mobile,
    profilePicCreator: invitationCreator.profilepic,
    emailCreator: invitationCreator.email,
    nameCreator: invitationCreator.name,
    mobileAcceptor: invitationAcceptor.mobile,
    profilePicAcceptor: invitationAcceptor.profilepic,
    emailAcceptor: invitationAcceptor.email,
    nameAcceptor: invitationAcceptor.name,
    token: token,
    channalName: channelName,
    callerName: "Idoh",
    localizedCallerName: "Idoh",
  },
  "callerName": "Idoh",
  "handle": "",
  "handleType": "generic",
  "hasVideo": false,
  "localizedCallerName": "Idoh",
  "headers": {
    "apns-expiration": "1604750400",
    "apns-push-type": "voip",
    "apns-priority": "10",
    "apns-topic": "com.techni.velia"
  }

}

acceptorNotification.rawPayload = {
  mobileCreator: invitationCreator.mobile,
    profilePicCreator: invitationCreator.profilepic,
    emailCreator: invitationCreator.email,
    nameCreator: invitationCreator.name,
    mobileAcceptor: invitationAcceptor.mobile,
    profilePicAcceptor: invitationAcceptor.profilepic,
    emailAcceptor: invitationAcceptor.email,
    nameAcceptor: invitationAcceptor.name,
    token: token,
    channalName: channelName,
    callerName: "Idoh",
    localizedCallerName: "Idoh",
}
acceptorNotification.expiry = "1604750400"
acceptorNotification.alert = ""
acceptorNotification.aps = {
  "content-available": 1,
}


// Invitation Acceptor Notification
let acceptortok = apn.token(invitationAcceptor.iosApn)
apnProvider.send(acceptorNotification, acceptortok).then((reponse) => {
  console.log("yai chala hai bhai ios acceptor ka", reponse.failed)
  if(reponse.failed.length){
    // console.log(reponse.failed, 'its failed');  
  }
  console.log(reponse);

});

}else{
  console.log("yai chala hai bhai android acceptor ka")
  // Invitation Acceptor Notification
  const payloadAcceptor = {
    token: invitationAcceptor.notificationToken,
    notification: {
      title: "There is a Call!",
      body: "There is a Call Coming to You!"
    },
    data: {
      mobileCreator: invitationCreator.mobile,
    profilePicCreator: invitationCreator.profilepic,
    emailCreator: invitationCreator.email,
    nameCreator: invitationCreator.name,
    mobileAcceptor: invitationAcceptor.mobile,
    profilePicAcceptor: invitationAcceptor.profilepic,
    emailAcceptor: invitationAcceptor.email,
    nameAcceptor: invitationAcceptor.name,
      token: token,
      channalName: channelName,
      callerName: "Idoh",
      localizedCallerName: "Idoh",
    },
    "apns": {
      payload: {
        aps: {
          "content-available": 1,
          "alert": "",
          "type": "voip",
        }
      },
      "headers": {
        "apns-expiration": "1604750400",

        // "apns-priority":"10",
        // "apns-topic":"com.barontech.appacn.voip"
      }
    },
    "android": {
      "ttl": 4500
    },
  };
  admin.messaging().send(payloadAcceptor).then(() => {
    // response.send({
    //   status: true
    // })
  })
    .catch((err) => {
      console.log('err',err)
    })
}



//    Notification Will come here
// if (req.body.platform === "ios") {
//   var options = {
//     token: {
//       key: tokenFileForNotification,
//       keyId: "4B93348SRN",
//       teamId: "RTNVR47W66"
//     },
//     production: false
//   };

//   console.log(' yeh chala hai 1')
//   var apnProvider = new apn.Provider(options);


//   // Sender Notification Logic
//   const notification = new apn.Notification();

//   const recepients = [];
//   console.log(' yeh chala hai 2')
//   // recepients.push(apn.token('dtohGl4Xek2fjxFn3p6FhY:APA91bGh9vaqpy1RoJrByuIF0Uvp0Yhdozz7Lutrejpxoy_ayiYFgePVMYCJBxdzV_QLsDphZE9AXKLlHJWwCv4oWvNXX_oT-xj6VwpVQItgr0OxM6qxKJhdSFichoQRXFSrhhgVb9om'));
//   // recepients.push(apn.token('d4e2fF36FAA91b9a1BF00d7eaFeCBdDE9AC4606dFcFb9'));

//   notification.topic = 'com.techni.velia.voip'; // you have to add the .voip here!!
//   notification.payload = {
//     "data": {
//       invitationCreator,
//       invitationAcceptor,
//       token: token,
//       channalName: channelName,
//     },
//     "callerName": "Idoh",
//     "handle": "",
//     "handleType": "generic",
//     "hasVideo": false,
//     "localizedCallerName": "Idoh",
//     "headers": {
//       "apns-expiration": "1604750400",
//       "apns-push-type": "voip",
//       "apns-priority": "10",
//       "apns-topic": "com.techni.velia"
//     }

//   }

//   console.log(' yeh chala hai 3')
//   notification.rawPayload = {
//     invitationCreator,
//       invitationAcceptor,
//       token: token,
//       channalName: channelName,
//   }
//   notification.expiry = "1604750400"
//   notification.alert = ""
//   notification.aps = {
//     "content-available": 1,
//   }

//   console.log(' yeh chala hai 4')

//   // let tok = apn.token('f3084a642d2c1bf55db6182f7af451d531b8e7aef33b29e1f251d6f813768ad0')
//   // Invitation Creator Notification
//   console.log(' yeh chala hai 5')
//   let creatortok = apn.token(invitationCreator.iosApn)
//   apnProvider.send(notification, creatortok).then((reponse) => {
//     if(reponse.failed.length){
//       console.log(reponse.failed, 'its failed');  
//     }
//     console.log(reponse);
//   });


//   // Acceptor Notification Logic
//   const acceptorNotification = new apn.Notification();

//   const recepientss = [];

//   // recepients.push(apn.token('dtohGl4Xek2fjxFn3p6FhY:APA91bGh9vaqpy1RoJrByuIF0Uvp0Yhdozz7Lutrejpxoy_ayiYFgePVMYCJBxdzV_QLsDphZE9AXKLlHJWwCv4oWvNXX_oT-xj6VwpVQItgr0OxM6qxKJhdSFichoQRXFSrhhgVb9om'));
//   // recepients.push(apn.token('d4e2fF36FAA91b9a1BF00d7eaFeCBdDE9AC4606dFcFb9'));
//   acceptorNotification.topic = 'com.techni.velia.voip'; // you have to add the .voip here!!
//   acceptorNotification.payload = {
//     "data": {
//       invitationCreator,
//       invitationAcceptor,
//       token: token,
//       channalName: channelName,
//     },
//     "callerName": "Idoh",
//     "handle": "",
//     "handleType": "generic",
//     "hasVideo": false,
//     "localizedCallerName": "Idoh",
//     "headers": {
//       "apns-expiration": "1604750400",
//       "apns-push-type": "voip",
//       "apns-priority": "10",
//       "apns-topic": "com.techni.velia"
//     }

//   }

//   acceptorNotification.rawPayload = {
//     invitationCreator,
//       invitationAcceptor,
//       token: token,
//       channalName: channelName,
//   }
//   acceptorNotification.expiry = "1604750400"
//   acceptorNotification.alert = ""
//   acceptorNotification.aps = {
//     "content-available": 1,
//   }
  

//   // Invitation Acceptor Notification
//   let acceptortok = apn.token(invitationCreator.iosApn)
//   apnProvider.send(acceptorNotification, acceptortok).then((reponse) => {
//     if(reponse.failed.length){
//       console.log(reponse.failed, 'its failed');  
//     }
//     console.log(reponse);

//   });

// } else {
// // Invitation Creator  
//   const payload = {
//     token: invitationCreator.notificationToken,
//     notification: {
//       title: "There is a Call!",
//       body: "There is a Call Coming to You!"
//     },
//     data: {
//       invitationCreator,
//       invitationAcceptor,
//       token: token,
//       channalName: channelName,
//     },
//     "apns": {
//       payload: {
//         aps: {
//           "content-available": 1,
//           "alert": "",
//           "type": "voip",
//         }
//       },
//       "headers": {
//         "apns-expiration": "1604750400",

//         // "apns-priority":"10",
//         // "apns-topic":"com.barontech.appacn.voip"
//       }
//     },
//     "android": {
//       "ttl": 4500
//     },
//   };
//   admin.messaging().send(payload).then(() => {
//     // response.send({
//     //   status: true
//     // })
//   })
//     .catch((err) => {
//       response.send({
//         status: false,
//         error: err
//       })
//     })

//     // Invitation Acceptor Notification
//     const payloadAcceptor = {
//       token: invitationCreator.notificationToken,
//       notification: {
//         title: "There is a Call!",
//         body: "There is a Call Coming to You!"
//       },
//       data: {
//         invitationCreator,
//         invitationAcceptor,
//         token: token,
//         channalName: channelName,
//       },
//       "apns": {
//         payload: {
//           aps: {
//             "content-available": 1,
//             "alert": "",
//             "type": "voip",
//           }
//         },
//         "headers": {
//           "apns-expiration": "1604750400",
  
//           // "apns-priority":"10",
//           // "apns-topic":"com.barontech.appacn.voip"
//         }
//       },
//       "android": {
//         "ttl": 4500
//       },
//     };
//     admin.messaging().send(payloadAcceptor).then(() => {
//       response.send({
//         status: true
//       })
//     })
//       .catch((err) => {
//         response.send({
//           status: false,
//           error: err
//         })
//       })
// }


  // res.json({
  //   token: token,
  //   channelName: channelName
  // })
    // }catch (error) {
    //     res.status(500).send({
    //         success: false, error, message:"Server Internal Error"
    //     });
    // }
}


// Upcoming Booked Meeting
exports.getLoggedUserBookedMeeting = async function (req, res) {
  try{
      if (!req.body.page) return res.status(400).send({success: false, message:"Invalid Request"});
      let maxDocument = 10;
      let pagesSkip = 10 * req.body.page;

      // const userDate = moment().format('YYYY-MM-DD');
      const today = moment().startOf('day')
      const futureDate = new Date(Date.now() + (365 * 86400000))
      console.log('today',today, 'future date',futureDate, req.user._id)
  let virtualMeeting = await VirtualMeetingModel.find({ $or:[ {'invitationCreatorUserId':req.user._id}, {'invitationAcceptorUserId':req.user._id}], date: {$gte: today.toDate(),$lte: futureDate}}).skip(parseFloat(pagesSkip))
  .limit(maxDocument).sort({date: 1})
  if (!virtualMeeting) return res.status(400).send({success: false, message:"Not Found"});
      
  
      res.json({
          success: true,
          message: "virtualMeeting Detail",
          data: virtualMeeting
      });
  }catch (error) {
      res.status(500).send({
          success: false,error, message:"Server Internal Error"
      });
  }
}












// exports.checkout = async function (req, res) {
//   try {
//     if (!req.body.plateId || !req.body.paymentId || !req.body.stripeCustomerId)
//       return res
//         .status(400)
//         .send({ success: false, message: "Invalid Request" });
//     let plate = await PlateModel.findOne({ _id: req.body.plateId }).populate(
//       "kitchenId"
//     );
//     if (!plate)
//       return res.status(400).send({
//         success: false,
//         message: "Plate Not Found, Cannot create the order",
//       });

//     // Now we will check if user have payment id exist then we will do nothing or else e will attach that payment id with strip customer same

//     const user = await User.findOne({
//       _id: req.user._id,
//       paymentMethodId: req.body.paymentId,
//     });
//     if (!user) {
//       const paymentMethods = await stripe.paymentMethods.attach(
//         req.body.paymentId,
//         { customer: req.body.stripeCustomerId }
//       );
//       if (paymentMethods) {
//         const updateUser = await User.findOne({
//           _id: req.user._id,
//         });
//         updateUser.paymentMethodId.push(req.body.paymentId);

//         await updateUser.save();
//       }
//     }
//     //  }
//     let finalAmount = plate.price * 100;
//     let appFees = (plate.price * 18) / 100;
//     appFees = appFees * 100;
//     if (!plate.kitchenId.stripeAccountConnected)
//       return res.status(400).send({
//         success: false,
//         message: "Sorry, We can't Create your Order, Kitchen is not Verified!",
//       });
//     // let customer = await stripe.customers.create();
//     let intent;
//     if (req.body.payment_method_id) {
//       // Create the PaymentIntent
//       intent = await stripe.paymentIntents.create({
//         payment_method: req.body.payment_method_id,
//         description: `Product Id is ${req.body.plateId} and Buyer Id is ${req.user._id}`,
//         amount: finalAmount,
//         currency: "usd",
//         confirmation_method: "manual",
//         confirm: false,
//         application_fee_amount: appFees,
//         setup_future_usage: "on_session",
//         customer: req.body.stripeCustomerId,
//         transfer_data: {
//           destination: plate.kitchenId.stripeAccountId,
//         },
//       });
//       // response.send(generateResponse(intent));
//       return res.json({
//         success: true,
//         message: "Checkout Process!",
//         data: intent,
//         paymentIntent: intent.client_secret,
//       });
//     } else {
//       res.status(500).send({
//         success: false,
//         message: "payment_method_id Id not found",
//       });
//     }
//   } catch (error) {
//     console.log("ERROR PAUMNET FUNC", error);
//     // return false
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error",
//       error,
//     });
//   }
// };

// // Create The Order
// exports.create = async function (req, res) {
//   try {
//     if (!req.body.plateId)
//       return res
//         .status(400)
//         .send({ success: false, message: "Invalid Request" });

//     let plate = await PlateModel.findOne({ _id: req.body.plateId }).populate(
//       "userId"
//     );
//     if (!plate)
//       return res.status(400).send({
//         success: false,
//         message: "Plate Not Found, Cannot create the order",
//       });
//     let order = new OrderModel();
//     order.buyerUserId = req.user._id;
//     order.sellerUserId = plate.userId._id;
//     order.plateId = req.body.plateId;
//     order.kitchenId = plate.kitchenId;
//     order.price = plate.price;
//     order.qty = 1;
//     order.paymentDetail = req.body.paymentDetail;

//     // Notification
//     var tokend = plate.userId.notificationToken;
//     order.save(async function (err, order) {
//       if (err)
//         return res.status(400).send({
//           success: false,
//           message: "Order Not Saved, Something Went Wrong!",
//         });

//       let push = new Push();
//       // for (let i in user_token_data) {
//       push.sendPushNotification(
//         tokend,
//         `You have received a new order ${plate.dishName}`,
//         "Incoming Order",
//         "incomingorder",
//         `${order._id}`
//       );
//       let notificationSave = new NotificationModel();
//       notificationSave.userId = plate.userId._id;
//       notificationSave.notificationTitle = "Incoming Order";
//       notificationSave.notificationMessage = `You have received a new order ${plate.dishName}`;
//       notificationSave.type = "incomingorder";
//       notificationSave.id = order._id;
//       await notificationSave.save();
//       // }
//       // let paymentInt = await createPaymentIntent({plateId: req.body.plateId, orderId: order._id, amount: order.price})
//       // const intent = await stripe.paymentIntents.capture('pi_3KS7XQF7p3hA5uZU0bWOPKWA', {
//       //     amount_to_capture: 1000,
//       //   })
//       // const refund = await stripe.refunds.create({
//       //     payment_intent: 'pi_3KS7XQF7p3hA5uZU0bWOPKWA',
//       //   });
//       // console.log("CLIENT SECRET CONSOLE =======", refund)
//       // if (paymentInt == false) return res.status(400).send({success: false, message:"Payment Issue, payment Not Accepted!"});
//       res.json({
//         success: true,
//         message: "Order has been created, it is now in pending process!",
//         data: order,
//       });
//       setTimeout(async () => {
//         console.log("Response bhej diya ab chala ho mai");
//         // Update Order after 2min
//         let orderUpdate = await OrderModel.findOne({
//           _id: order._id,
//           status: "pending",
//         });
//         if (!orderUpdate) return null;
//         orderUpdate.status = "canceled";
//         orderUpdate.save();
//         let push = new Push();
//         // for (let i in user_token_data) {
//         push.sendPushNotification(
//           tokend,
//           `Your order has been Cancelled of ${plate.dishName}`,
//           "Order Cancelled",
//           "orderrejected",
//           `${order._id}`
//         );
//         let notificationSave = new NotificationModel();
//         notificationSave.userId = plate.userId._id;
//         notificationSave.notificationTitle = "Order Cancelled";
//         notificationSave.notificationMessage = `Your order has been Cancelled of ${plate.dishName}`;
//         notificationSave.type = "orderrejected";
//         notificationSave.id = order._id;
//         await notificationSave.save();
//       }, 200000);
//     });
//   } catch (error) {
//     console.log("ERROR", error);
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error",
//       error,
//     });
//   }
// };

// // Accept Order
// exports.acceptOrder = async function (req, res) {
//   try {
//     if (!req.body.orderId)
//       return res
//         .status(400)
//         .send({ success: false, message: "Invalid Request" });

//     // Find The Order
//     let order = await OrderModel.findOne({ _id: req.body.orderId }).populate(
//       "buyerUserId"
//     );
//     if (!order)
//       return res
//         .status(400)
//         .send({ success: false, message: "Order Not Found" });

//     order.status = "preparing";

//     // const charge = await stripe.paymentIntents.confirm(order.paymentDetail.id, {
//     //   payment_method: order.paymentDetail.pmid,
//     // });
//     // const charge = await stripe.paymentIntents.capture('pi_3KWaaYF7p3hA5uZU19LEcmSs');
//     const confirmPaymentIntent = await stripe.paymentIntents.confirm(
//       order.paymentDetail.id
//     );
//     // Notification
//     var tokend = order.buyerUserId.notificationToken;
//     order.save(async function (err, order) {
//       if (err)
//         return res.status(400).send({
//           success: false,
//           message: "Order Not Saved, Make Sure Status is Correct!",
//         });

//       let push = new Push();
//       // for (let i in user_token_data) {
//       push.sendPushNotification(
//         tokend,
//         `Your Order has been Accepted ${order._id}`,
//         "Order Accepted",
//         "orderaccepted",
//         `${order._id}`
//       );
//       let notificationSave = new NotificationModel();
//       notificationSave.userId = order.buyerUserId._id;
//       notificationSave.notificationTitle = "Order Accepted";
//       notificationSave.notificationMessage = `Your Order has been Accepted ${order._id}`;
//       notificationSave.type = "orderaccepted";
//       notificationSave.id = order._id;
//       await notificationSave.save();
//       // }
//       res.json({
//         success: true,
//         message: "Order Accepted",
//         data: order,
//         confirmPaymentIntent,
//       });
//     });
//   } catch (error) {
//     console.log("ERR", error);
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error or Payment Issues. Contact Support",
//       error,
//     });
//   }
// };

// // Reject Order
// exports.rejectOrder = async function (req, res) {
//   try {
//     if (!req.body.orderId)
//       return res
//         .status(400)
//         .send({ success: false, message: "Invalid Request" });

//     // Find The Order
//     let order = await OrderModel.findOne({ _id: req.body.orderId }).populate(
//       "buyerUserId"
//     );
//     if (!order)
//       return res
//         .status(400)
//         .send({ success: false, message: "Order Not Found" });

//     order.status = "canceled";
//     const charge = await stripe.paymentIntents.cancel(
//       order.paymentDetail.id
//       // {payment_method: 'pm_1KWaaYF7p3hA5uZUUFGJpsGK'}
//     );
//     // const refund = await stripe.refunds.create({
//     //     payment_intent: order.paymentDetail.id,
//     //   })
//     // Notification
//     var tokend = order.buyerUserId.notificationToken;
//     order.save(async function (err, order) {
//       if (err)
//         return res.status(400).send({
//           success: false,
//           message: "Order Not Saved, Make Sure Status is Correct!",
//         });

//       let push = new Push();
//       // for (let i in user_token_data) {
//       push.sendPushNotification(
//         tokend,
//         `Your Order has been Reejected ${order._id}`,
//         "Order Rejected",
//         "orderrejected",
//         `${order._id}`
//       );
//       let notificationSave = new NotificationModel();
//       notificationSave.userId = order.buyerUserId._id;
//       notificationSave.notificationTitle = "Order Rejected";
//       notificationSave.notificationMessage = `Your Order has been Reejected ${order._id}`;
//       notificationSave.type = "orderrejected";
//       notificationSave.id = order._id;
//       await notificationSave.save();
//       // }
//       res.json({
//         success: true,
//         message: "Order Cancelled",
//         data: order,
//       });
//     });
//   } catch (error) {
//     console.log("ERR", error);
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error or Payment Issues. Contact Support",
//     });
//   }
// };

// // Update Order Status
// exports.updateStatus = async function (req, res) {
//   try {
//     if (!req.body.orderId || !req.body.status)
//       return res
//         .status(400)
//         .send({ success: false, message: "Invalid Request" });

//     // Find The Order
//     let order = await OrderModel.findOne({ _id: req.body.orderId })
//       .populate("buyerUserId")
//       .populate("kitchenId");
//     if (!order)
//       return res
//         .status(400)
//         .send({ success: false, message: "Order Not Found" });

//     order.status = req.body.status;
//     // Notification
//     // var tokend = "dRnC9OwaR8-_Kr4o2zkd_m:APA91bEnOr7ST8xNkbiFWCWlImo-yLQTmbO-Jgds7kaQvy7FgZHDcgpU7Y1ByQO6ECV1yjxL3IEsWBSBrcPRijtgoXNFIaAogFitGmndoD87JrZ95q8YoXqpM1794hXVMr-gL1ATIY0F"
//     var tokend = order.buyerUserId.notificationToken;
//     order.save(function (err, order) {
//       if (err)
//         return res.status(400).send({
//           success: false,
//           message: "Order Not Saved, Make Sure Status is Correct!",
//         });

//       let push = new Push();
//       // for (let i in user_token_data) {
//       push.sendPushNotification(
//         tokend,
//         `Your Order has been ${order.status}`,
//         "Order Updates",
//         "orderupdates",
//         `${order._id}`
//       );

//       // }
//       res.json({
//         success: true,
//         message: "Order has been Updated",
//         data: order,
//       });

//       //   If pickeup then after hour send the notification
//       if (order.status == "pickedup") {
//         setTimeout(async () => {
//           console.log("Response bhej diya ab chala ho mai");
//           // Update Order after 2min
//           let push = new Push();
//           // for (let i in user_token_data) {
//           push.sendPushNotification(
//             tokend,
//             `How was your experience with ${order.kitchenId.kitchenName} ?`,
//             "Leave a review",
//             "review",
//             `${order._id}`
//           );
//           let notificationSave = new NotificationModel();
//           notificationSave.userId = order.buyerUserId._id;
//           notificationSave.notificationTitle = "Leave a review";
//           notificationSave.notificationMessage = `How was your experience with ${order.kitchenId.kitchenName} ?`;
//           notificationSave.type = "review";
//           notificationSave.id = order._id;
//           await notificationSave.save();
//         }, 2000000);
//       }
//     });
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error",
//     });
//   }
// };

// // Get Buyer's Order List
// exports.buyersOrderList = async function (req, res) {
//   try {
//     if (!req.body.buyerId || !req.body.page)
//       return res
//         .status(400)
//         .send({ success: false, message: "Invalid Request" });
//     let maxDocument = 10;
//     let pagesSkip = 10 * req.body.page;

//     // Find The Order
//     let order = await OrderModel.find({ buyerUserId: req.body.buyerId })
//       .sort({ created_at: -1 })
//       .skip(parseFloat(pagesSkip))
//       .limit(maxDocument).populate('buyerUserId').populate('sellerUserId').populate('kitchenId')
//     if (!order)
//       return res
//         .status(400)
//         .send({ success: false, message: "Order Not Found" });

//     res.json({
//       success: true,
//       message: "Buyer List",
//       data: order,
//     });
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error",
//     });
//   }
// };

// // Get Seller's Order List
// exports.sellersOrderList = async function (req, res) {
//   try {
//     if (!req.body.sellerId || !req.body.page)
//       return res
//         .status(400)
//         .send({ success: false, message: "Invalid Request" });
//     let maxDocument = 10;
//     let pagesSkip = 10 * req.body.page;

//     // Find The Order
//     let order = await OrderModel.find({ sellerUserId: req.body.sellerId })
//       .sort({ created_at: -1 })
//       .skip(parseFloat(pagesSkip))
//       .limit(maxDocument).populate('buyerUserId').populate('sellerUserId').populate('kitchenId')
//     if (!order)
//       return res
//         .status(400)
//         .send({ success: false, message: "Order Not Found" });

//     res.json({
//       success: true,
//       message: "Seller List",
//       data: order,
//     });
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error",
//     });
//   }
// };

// // Stripe Connect Accounts
// exports.addAccountStripe = async function (req, res) {
//   try {
//     if (!req.body.kitchenId)
//       return res
//         .status(400)
//         .send({ success: false, message: "Invalid Request" });

//     const kitchen = await Kitchen.findOne({
//       userId: req.user._id,
//       _id: req.body.kitchenId,
//     });
//     if (!kitchen)
//       return res
//         .status(400)
//         .send({ success: false, message: "Kitchen Not Found" });
//     // console.log("Kitchen", kitchen)
//     // This ill check that account is valid if valid then it will check that user completed all info & we check through connected boolean value in other condition
//     if (kitchen.stripeAccountId) {
//       if (!kitchen.stripeAccountConnected) {
//         let isupdate = false;
//         // Will Create a link because it's not completed the form
//         const accountLinks = await stripe.accountLinks.create({
//           account: kitchen.stripeAccountId,
//           refresh_url: "https://google.com/cancel",
//           return_url: "https://google.com/returnback",
//           type: isupdate ? "account_update" : "account_onboarding",
//         });
//         return res.json({
//           success: true,
//           message: "Link Generated Again Please re register on this",
//           data: kitchen,
//           stripe: accountLinks,
//         });
//       }

//       return res.json({
//         success: true,
//         message: "Stripe Account is Already Connected",
//         data: kitchen,
//       });
//     }

//     // This will add account if there not added

//     // Add Account
//     const account = await stripe.accounts.create({
//       country: "US",
//       type: "express",
//       capabilities: {
//         card_payments: { requested: true },
//         transfers: { requested: true },
//       },
//     });
//     if (!account)
//       return res.status(400).send({
//         success: false,
//         message:
//           "Something Went Wrong, While creating Stripe Merchant Account! Try Again",
//       });

//     kitchen.stripeAccountId = account.id;
//     await kitchen.save(async function (err, kitchenData) {
//       if (err) return res.status(400).send({ success: false, message: err });

//       let isupdate = false;
//       // Create Link & send to frontend where seller add their account to withdraw funds
//       const accountLinks = await stripe.accountLinks.create({
//         account: account.id,
//         refresh_url: "https://google.com/cancelreturnback",
//         return_url: "https://google.com/returnback",
//         type: isupdate ? "account_update" : "account_onboarding",
//       });
//       if (!accountLinks)
//         return res.status(400).send({
//           success: false,
//           message:
//             "Something Went Wrong, While creating Stripe Merchant Account! Try Again",
//         });
//       return res.json({
//         success: true,
//         message: "Stripe Account Link",
//         data: kitchen,
//         stripe: accountLinks,
//       });
//     });
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error",
//     });
//   }
// };

// // Get Seller's Order List
// exports.sellerTotalEarning = async function (req, res) {
//   try {
//     if (!req.body.sellerId)
//       return res
//         .status(400)
//         .send({ success: false, message: "Invalid Request" });
//     var totalEarnings = 0;
//     // Find The Order
//     let order = await OrderModel.find({
//       sellerUserId: req.body.sellerId,
//       status: "pickedup",
//     });
//     if (!order.length)
//       return res
//         .status(400)
//         .send({ success: false, message: "Sorry, We didn't find your order" });

//     order.map(async (value, key) => {
//       totalEarnings += value.price;
//     });

//     let subtractThisAmountFromTotal = totalEarnings * 0.18;
//     let finalEarning = totalEarnings - subtractThisAmountFromTotal

//     res.json({
//       success: true,
//       message: "Total Earnings",
//       data: finalEarning,
//     });
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error",
//     });
//   }
// };

// // Get Seller Order Specific Earning
// exports.sellersOrderTransaction = async function (req, res) {
//   try {
//     if (!req.body.sellerId || !req.body.page)
//       return res
//         .status(400)
//         .send({ success: false, message: "Invalid Request" });
//     let maxDocument = 10;
//     let pagesSkip = 10 * req.body.page;

//     // Find The Order
//     let order = await OrderModel.find({
//       sellerUserId: req.body.sellerId,
//       status: "pickedup",
//     })
//       .sort({ created_at: -1 })
//       .skip(parseFloat(pagesSkip))
//       .limit(maxDocument);
//     if (!order)
//       return res
//         .status(400)
//         .send({ success: false, message: "Transaction Not Found" });

//     res.json({
//       success: true,
//       message: "Seller Transaction",
//       data: order,
//     });
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error",
//     });
//   }
// };
// exports.pay = async (request, response) => {
//   try {
//     let intent;
//     if (request.body.payment_method_id) {
//       // Create the PaymentIntent
//       console.log(request.body.payment_method_id);
//       intent = await stripe.paymentIntents.create({
//         payment_method: request.body.payment_method_id,
//         amount: 1099,
//         currency: "usd",
//         confirmation_method: "manual",
//         confirm: false,
//         application_fee_amount: 123,
//         transfer_data: {
//           destination: "acct_1KYPxL2ZjBdIQiwO",
//         },
//       });
//       response.send(generateResponse(intent));
//     } else if (request.body.payment_intent_id) {
//       intent = await stripe.paymentIntents.confirm(
//         request.body.payment_intent_id
//       );
//       response.send(generateResponse(intent));
//     }
//     // Send the response to the client
//   } catch (e) {
//     // Display error on client
//     return response.send({ error: e.message });
//   }
// };
// exports.capture = async (request, response) => {
//   try {
//     const confirmPaymentIntent = await stripe.paymentIntents.confirm(
//       "pi_3KYQ3fF7p3hA5uZU00D9mM9h"
//     );
//     // const intent = await stripe.paymentIntents.capture(
//     //   "pi_3KYNEZLHj2UYwTsc1XoSptU2",
//     //   {
//     //     amount_to_capture: 750,
//     //   }
//     // );
//     return response.send({ success: confirmPaymentIntent });
//   } catch (e) {
//     // Display error on client
//     return response.send({ error: e.message });
//   }
// };
// const generateResponse = (intent) => {
//   console.log(intent);
//   if (
//     intent.status === "requires_action" &&
//     intent.next_action.type === "use_stripe_sdk"
//   ) {
//     // Tell the client to handle the action
//     return {
//       requires_action: true,
//       payment_intent_client_secret: intent.client_secret,
//     };
//   } else if (intent.status === "succeeded") {
//     // The payment didn’t need any additional actions and completed!
//     // Handle post-payment fulfillment
//     return {
//       success: true,
//     };
//   } else {
//     // Invalid status
//     return {
//       error: "Invalid PaymentIntent status",
//     };
//   }
// };

// // Get single Order
// exports.getSingleOrder = async (req, res) => {
//   if (!req.body.orderId)
//     return res.status(400).send({ success: false, message: "Invalid Request" });
//   try {
//     const order = await OrderModel.find({
//       _id: req.body.orderId,
//     })
//       .populate("kitchenId")
//       .populate("buyerUserId")
//       .populate("sellerUserId");
//     if (!order)
//       return res
//         .status(400)
//         .send({ success: false, message: "Order Not Found" });

//     res.json({
//       success: true,
//       data: order,
//     });
//   } catch (err) {
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error",
//     });
//   }
// };

// // Get User Notification via Latest Date & pagination
// exports.getNotifications = async (req, res) => {
//   if (!req.body.page)
//     return res.status(400).send({ success: false, message: "Invalid Request" });
//   try {
//     let maxDocument = 10;
//     let pagesSkip = 10 * req.body.page;
//     const notification = await NotificationModel.find({
//       userId: req.user._id,
//     })
//       .sort({ created_at: -1 })
//       .skip(parseFloat(pagesSkip))
//       .limit(maxDocument);
//     if (!notification.length)
//       return res
//         .status(400)
//         .send({ success: false, message: "Notification Not Found" });

//     res.json({
//       success: true,
//       data: notification,
//     });
//   } catch (err) {
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error",
//     });
//   }
// };

// // Add Card
// exports.addCard = async (req, res) => {
//   if (!req.body.customerId || !req.body.source)
//     return res.status(400).send({ success: false, message: "Invalid Request" });
//   try {
//     const card = await stripe.customers.createSource(
//       req.body.customerId,
//       req.body.source
//       // {source: 'tok_visa'}
//     );
//     res.json({
//       success: true,
//       data: card,
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error",
//       err,
//     });
//   }
// };

// // Get Card
// exports.getCard = async (req, res) => {
//   if (!req.body.customerId)
//     return res.status(400).send({ success: false, message: "Invalid Request" });
//   try {
//     console.log(req.body.customerId)
//     const card = await stripe.paymentMethods.list({
//       customer: req.body.customerId,
//       type: "card",
//     });
//     // const card = await stripe.customers.listSources(req.body.customerId);
//     res.json({
//       success: true,
//       data: card,
//     });
//   } catch (err) {
//     console.log("card", err);
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error",
//       err,
//     });
//   }
// };

// // Delete Card
// exports.deleteCard = async (req, res) => {
//   if (!req.body.cardId)
//     return res.status(400).send({ success: false, message: "Invalid Request" });
//   try {
//     // const deleted = await stripe.customers.deleteSource(
//     //   req.body.customerId,
//     //   req.body.cardId
//     // );
//     const deleted = await stripe.paymentMethods.detach(
//       req.body.cardId
//     );
//     res.json({
//       success: true,
//       data: deleted,
//       message: "Card Deleted",
//     });
//   } catch (err) {
//     console.log("card", err);
//     res.status(500).send({
//       success: false,
//       message: "Server Internal Error",
//       err,
//     });
//   }
// };
