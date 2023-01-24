var createError 			 = require('http-errors')
var express 				 = require('express')
var cors 					 = require('cors')
var path 					 = require('path')
var cookieParser 			 = require('cookie-parser')
var logger 					 = require('morgan')
var bodyParser 				 = require('body-parser')
var mongoose 				 = require('mongoose')
var authenticationMiddleware = require('./middlewares/index')
var cron 					 = require('node-cron')
var dotenv 					 = require('dotenv')
const moment = require('moment-timezone');
const VirtualMeetingModel = require("./models/virtualMeeting");
const fs = require("fs");
// get config vars
dotenv.config()

const jwt 				= require('jsonwebtoken')
const nodemailer		= require('nodemailer')
 

var cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");


cloudinary.config({
cloud_name: 'dg8ikrdpa',
api_key: '979777468463349',
api_secret: 'TwiqoM8Bm3gIsFZ1pPTb_5U0t7s'
});

// Creating uploads folder if not already present
// In "uploads" folder we will temporarily upload
// image before uploading to cloudinary
if (!fs.existsSync("./uploads")) {
    fs.mkdirSync("./uploads");
}
  
// Multer setup
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
  
var upload = multer({ storage: storage });

// Cron Job 0 * * * *
// cron.schedule('0 * * * *', cronJobController.index)

var app = express()
// Enable All CORS Requests
app.use(cors())

//configure bodyparser to hande the post requests
// Body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const mongo = mongoose.connect(process.env.MONGOURI, {
	useNewUrlParser: true, 
	useUnifiedTopology: true,
	useCreateIndex: true	
})
mongo.then(() => {
    console.log('Database Connected')
}, error => {
    console.log(error, 'error')
})

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({
	extended: false
}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

//   UPLOAD PROFILE PIC

async function uploadToCloudinary(locaFilePath) {
  
    // locaFilePath: path of image which was just
    // uploaded to "uploads" folder
  
    var mainFolderName = "main";
    // filePathOnCloudinary: path of image we want
    // to set when it is uploaded to cloudinary
    var filePathOnCloudinary = locaFilePath;
  
    return cloudinary.uploader
        .upload(locaFilePath)
        .then((result) => {
  
            // Image has been successfully uploaded on
            // cloudinary So we dont need local image 
            // file anymore
            // Remove file from local uploads folder
            fs.unlinkSync(locaFilePath);
  
            return {
                message: "Success",
                url: result.url,
            };
        })
        .catch((error) => {
  
            // Remove file from local uploads folder
            fs.unlinkSync(locaFilePath);
            return { message: "Fail" , error};
        });
}

// cron job run every 30min
// cron.schedule('*/30 * * * *', () => {
//     console.log('running a task after 30min');
// });

// let cronFunc  = async ()=>{

//     const userDate = moment().format('YYYY-MM-DD');
//     console.log('Date Format', userDate)
//     let virtualMeeting = await VirtualMeetingModel.find({meetingDate: userDate}).lean()
//     // console.log('meeting', virtualMeeting)
//     virtualMeeting.map(async(val,key)=>{
//         const dateUS = moment.tz(val.timezoneName);
//         const userTime = moment(dateUS).format("hh:mma");
//         console.log("Data", val, 'usertimezone', userTime)
//         if(val.meetingTime == userTime){
//             console.log("Match hogaya time notification chalao chnnael bnao")
//             let invData = {
//                     invitationCreatorUserId: val.invitationCreatorUserId,
//                     invitationAcceptorUserId: val.invitationAcceptorUserId,
//                     virtualMeetingId: val._id
//                 }
//             callingFeature(invData)
//         }
//         // let invData = {
//         //     invitationCreatorUserId: val.invitationCreatorUserId,
//         //     invitationAcceptorUserId: val.invitationAcceptorUserId
//         // }
//         // testFunc(invData)
//     })
// }
// cronFunc()

// let testFunc = async(invData)=>{
//   console.log('invdataaaaaaaaaaa', invData.invitationCreatorUserId, 'acceptor', invData.invitationAcceptorUserId)
// }

// Cron will run this function, This function will execute calling
// let callingFeature = async (invData)=>{
//   try{
  
//   let invitationCreatorUserId = invData.invitationCreatorUserId
//   let invitationAcceptorUserId = invData.invitationAcceptorUserId;
//   let virtualMeetingId = invData.virtualMeetingId
  
//   const appID = 'a6f51d1f07cc4a6fb34bdc9794db82c6';    
//   const appCertificate = '722c15167c6c42d299bd5e21652b4cd7';
//   const channelName = Math.floor(Math.random() * 100).toString()
//   const uid = 0;
//   const role = RtcRole.PUBLISHER;
//   const expirationTimeInSeconds = 3600

// const currentTimestamp = Math.floor(Date.now() / 1000)

// const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds
// // IMPORTANT! Build token with either the uid or with the user account. Comment out the option you do not want to use below.

// // Build token with uid
// const token = RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channelName, uid, role, privilegeExpiredTs);
// console.log("Token With Integer Number Uid: " + token);

// //   Add Data in firestore
// const usersDb = db.collection('calling');


// let invitationCreator = await User.findOne({_id: invitationCreatorUserId}).lean()
// if (!invitationCreator) return res.status(400).send({success: false, message:"Not Found"});
// // console.log('ccccreator', invitationCreator)
// delete invitationCreator.password

// let invitationAcceptor = await User.findOne({_id: invitationAcceptorUserId}).lean()
// if (!invitationAcceptor) return res.status(400).send({success: false, message:"Not Found"}); 
// // console.log('ccccreator', invitationAcceptor)
// delete invitationAcceptor.password

// // Invitation Creator
// await usersDb.doc(invitationCreatorUserId).set({
// token: token,
// channelName: channelName,
// mobile: invitationAcceptor.mobile,
// profilePic: invitationAcceptor.profilepic,
// email: invitationAcceptor.email,
// name: invitationAcceptor.name,
// virtualMeetingId: virtualMeetingId,
// // user: invitationAcceptor, // In creator user acceptor data is going because frontend dont have acceptor data that'swhy
// callStarted: false
// });

// // //    Invitation Acceptor
// await usersDb.doc(invitationAcceptorUserId).set({
// token: token,
// channelName: channelName,
// mobile: invitationCreator.mobile,
// profilePic: invitationCreator.profilepic,
// email: invitationCreator.email,
// name: invitationCreator.name,
// virtualMeetingId: virtualMeetingId,
// // user: invitationCreator,  // In acceptor user creator data is going because frontend dont have creator data that'swhy
// callStarted: false
// });

// var tokenFileForNotification = fs.readFileSync(__dirname + "/auth_4B93348SRN.p8", 'utf8')

// // If creator phone is ios then send notification there else send on it's android
// if(invitationCreator.platform === "ios"){
// var options = {
// token: {
// key: tokenFileForNotification,
// keyId: "4B93348SRN",
// teamId: "RTNVR47W66"
// },
// production: false
// };

// console.log(' yeh chala hai 1')
// var apnProvider = new apn.Provider(options);


// // Sender Notification Logic
// const notification = new apn.Notification();

// const recepients = [];
// console.log(' yeh chala hai 2')
// // recepients.push(apn.token('dtohGl4Xek2fjxFn3p6FhY:APA91bGh9vaqpy1RoJrByuIF0Uvp0Yhdozz7Lutrejpxoy_ayiYFgePVMYCJBxdzV_QLsDphZE9AXKLlHJWwCv4oWvNXX_oT-xj6VwpVQItgr0OxM6qxKJhdSFichoQRXFSrhhgVb9om'));
// // recepients.push(apn.token('d4e2fF36FAA91b9a1BF00d7eaFeCBdDE9AC4606dFcFb9'));

// notification.topic = 'com.techni.velia.voip'; // you have to add the .voip here!!
// notification.payload = {
// "data": {
// mobileCreator: invitationCreator.mobile,
// profilePicCreator: invitationCreator.profilepic,
// emailCreator: invitationCreator.email,
// nameCreator: invitationCreator.name,
// mobileAcceptor: invitationAcceptor.mobile,
// profilePicAcceptor: invitationAcceptor.profilepic,
// emailAcceptor: invitationAcceptor.email,
// nameAcceptor: invitationAcceptor.name,
// token: token,
// channalName: channelName,
// },
// "callerName": "Idoh",
// "handle": "",
// "handleType": "generic",
// "hasVideo": false,
// "localizedCallerName": "Idoh",
// "headers": {
// "apns-expiration": "1604750400",
// "apns-push-type": "voip",
// "apns-priority": "10",
// "apns-topic": "com.techni.velia"
// }

// }

// console.log(' yeh chala hai 3')
// notification.rawPayload = {
// mobileCreator: invitationCreator.mobile,
// profilePicCreator: invitationCreator.profilepic,
// emailCreator: invitationCreator.email,
// nameCreator: invitationCreator.name,
// mobileAcceptor: invitationAcceptor.mobile,
// profilePicAcceptor: invitationAcceptor.profilepic,
// emailAcceptor: invitationAcceptor.email,
// nameAcceptor: invitationAcceptor.name,
// token: token,
// channalName: channelName,
// }
// notification.expiry = "1604750400"
// notification.alert = ""
// notification.aps = {
// "content-available": 1,
// }

// console.log(' yeh chala hai 4')

// // let tok = apn.token('f3084a642d2c1bf55db6182f7af451d531b8e7aef33b29e1f251d6f813768ad0')
// // Invitation Creator Notification
// console.log(' yeh chala hai 5')
// let creatortok = apn.token(invitationCreator.iosApn)
// apnProvider.send(notification, creatortok).then((reponse) => {
// if(reponse.failed.length){
// console.log(reponse.failed, 'its failed');  
// }
// console.log(reponse);
// });

// }else{
// // Invitation Creator  
// const payload = {
// token: invitationCreator.notificationToken,
// notification: {
// title: "There is a Call!",
// body: "There is a Call Coming to You!"
// },
// data: {
// mobileCreator: invitationCreator.mobile,
// profilePicCreator: invitationCreator.profilepic,
// emailCreator: invitationCreator.email,
// nameCreator: invitationCreator.name,
// mobileAcceptor: invitationAcceptor.mobile,
// profilePicAcceptor: invitationAcceptor.profilepic,
// emailAcceptor: invitationAcceptor.email,
// nameAcceptor: invitationAcceptor.name,
// token: token,
// channalName: channelName,
// },
// "apns": {
// payload: {
//   aps: {
//     "content-available": 1,
//     "alert": "",
//     "type": "voip",
//   }
// },
// "headers": {
//   "apns-expiration": "1604750400",

//   // "apns-priority":"10",
//   // "apns-topic":"com.barontech.appacn.voip"
// }
// },
// "android": {
// "ttl": 4500
// },
// };
// admin.messaging().send(payload).then(() => {
// // response.send({
// //   status: true
// // })
// })
// .catch((err) => {
// console.log('err',err)
// })
// }



// If creator phone is ios then send notification there else send on it's android
// if(invitationAcceptor.platform === "ios"){
// // Acceptor Notification Logic
// const acceptorNotification = new apn.Notification();

// const recepientss = [];

// // recepients.push(apn.token('dtohGl4Xek2fjxFn3p6FhY:APA91bGh9vaqpy1RoJrByuIF0Uvp0Yhdozz7Lutrejpxoy_ayiYFgePVMYCJBxdzV_QLsDphZE9AXKLlHJWwCv4oWvNXX_oT-xj6VwpVQItgr0OxM6qxKJhdSFichoQRXFSrhhgVb9om'));
// // recepients.push(apn.token('d4e2fF36FAA91b9a1BF00d7eaFeCBdDE9AC4606dFcFb9'));
// acceptorNotification.topic = 'com.techni.velia.voip'; // you have to add the .voip here!!
// acceptorNotification.payload = {
// "data": {
// mobileCreator: invitationCreator.mobile,
// profilePicCreator: invitationCreator.profilepic,
// emailCreator: invitationCreator.email,
// nameCreator: invitationCreator.name,
// mobileAcceptor: invitationAcceptor.mobile,
// profilePicAcceptor: invitationAcceptor.profilepic,
// emailAcceptor: invitationAcceptor.email,
// nameAcceptor: invitationAcceptor.name,
// token: token,
// channalName: channelName,
// },
// "callerName": "Idoh",
// "handle": "",
// "handleType": "generic",
// "hasVideo": false,
// "localizedCallerName": "Idoh",
// "headers": {
// "apns-expiration": "1604750400",
// "apns-push-type": "voip",
// "apns-priority": "10",
// "apns-topic": "com.techni.velia"
// }

// }

// acceptorNotification.rawPayload = {
// mobileCreator: invitationCreator.mobile,
// profilePicCreator: invitationCreator.profilepic,
// emailCreator: invitationCreator.email,
// nameCreator: invitationCreator.name,
// mobileAcceptor: invitationAcceptor.mobile,
// profilePicAcceptor: invitationAcceptor.profilepic,
// emailAcceptor: invitationAcceptor.email,
// nameAcceptor: invitationAcceptor.name,
// token: token,
// channalName: channelName,
// }
// acceptorNotification.expiry = "1604750400"
// acceptorNotification.alert = ""
// acceptorNotification.aps = {
// "content-available": 1,
// }


// // Invitation Acceptor Notification
// let acceptortok = apn.token(invitationAcceptor.iosApn)
// apnProvider.send(acceptorNotification, acceptortok).then((reponse) => {
// if(reponse.failed.length){
// console.log(reponse.failed, 'its failed');  
// }
// console.log(reponse);

// });

// }else{
// // Invitation Acceptor Notification
// const payloadAcceptor = {
// token: invitationAcceptor.notificationToken,
// notification: {
// title: "There is a Call!",
// body: "There is a Call Coming to You!"
// },
// data: {
// mobileCreator: invitationCreator.mobile,
// profilePicCreator: invitationCreator.profilepic,
// emailCreator: invitationCreator.email,
// nameCreator: invitationCreator.name,
// mobileAcceptor: invitationAcceptor.mobile,
// profilePicAcceptor: invitationAcceptor.profilepic,
// emailAcceptor: invitationAcceptor.email,
// nameAcceptor: invitationAcceptor.name,
// token: token,
// channalName: channelName,
// },
// "apns": {
// payload: {
//   aps: {
//     "content-available": 1,
//     "alert": "",
//     "type": "voip",
//   }
// },
// "headers": {
//   "apns-expiration": "1604750400",

//   // "apns-priority":"10",
//   // "apns-topic":"com.barontech.appacn.voip"
// }
// },
// "android": {
// "ttl": 4500
// },
// };
// admin.messaging().send(payloadAcceptor).then(() => {
// // response.send({
// //   status: true
// // })
// })
// .catch((err) => {
// console.log('err',err)
// })
// }


// }catch(error) {
//   res.status(500).send({
//       success: false, error, message:"Server Internal Error"
//   });
// }

// }







// Routes Imported 
var indexRouter 	= require('./routes/index')
var adminUserRouter 	= require('./routes/shopAdminUser')
var userAdminAuthSpecific 	= require('./routes/userAdminAuthSpecific')
var userCustomerAuthSpecific 	= require('./routes/customerUserAuthSpecific')
var groupRouter 	= require('./routes/groups');
// var chat = require('./routes/chat');
var invitationCard 	= require('./routes/invitationCard');
var virtualMeeting 	= require('./routes/virtualMeeting');
var addShopLocation 	= require('./routes/addShopLocation');
var shopCustomersWithoutAuth = require('./routes/shopCustomerPanelWithoutAuth');

//Routes Binding 
app.use('/', indexRouter)
app.use('/admin', adminUserRouter)
app.use('/adminuser', authenticationMiddleware, userAdminAuthSpecific)
app.use('/customeruser', authenticationMiddleware, userCustomerAuthSpecific)
app.use('/group', groupRouter)
app.use('/invitationcard', authenticationMiddleware, invitationCard)
// app.use('/chat', 		authenticationMiddleware, chat)
app.use('/virtualmeeting', authenticationMiddleware, virtualMeeting)
app.use('/shoplocation', authenticationMiddleware, addShopLocation)
app.use('/customer', shopCustomersWithoutAuth)
// app.use('/web', websiteRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404))
})

// Prevent from crashing
process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Node NOT Exiting...");
  });

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message
	res.locals.error = req.app.get('env') === 'development' ? err : {}

	// render the error page
	res.status(err.status || 500)
	res.render('error')
})

// app.listen(5000, console.log(`Server Started On Port 5000`))
module.exports = app
