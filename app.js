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


// Routes Imported 
var indexRouter 	= require('./routes/index')
var adminUserRouter 	= require('./routes/shopAdminUser')
var userAdminAuthSpecific 	= require('./routes/userAdminAuthSpecific')
var userCustomerAuthSpecific 	= require('./routes/customerUserAuthSpecific')
var groupRouter 	= require('./routes/groups');
// var chat = require('./routes/chat');
var invitationCard 	= require('./routes/invitationCard');
var addShopLocation 	= require('./routes/addShopLocation');
var shopCustomersWithoutAuth = require('./routes/shopCustomerPanelWithoutAuth');
var shopBarbers = require('./routes/shopBarberPanel');
var shopBarbersWithoutAuth = require('./routes/shopbarberWithoutAuth');
var adminAutomatedCampaigns = require('./routes/adminAutomatedCampaigns');

//Routes Binding 
app.use('/', indexRouter)
app.use('/admin', adminUserRouter)
app.use('/adminuser', authenticationMiddleware, userAdminAuthSpecific)
app.use('/automated', authenticationMiddleware, adminAutomatedCampaigns)
app.use('/customeruser', authenticationMiddleware, userCustomerAuthSpecific)
app.use('/group', groupRouter)
app.use('/invitationcard', authenticationMiddleware, invitationCard)
// app.use('/chat', 		authenticationMiddleware, chat)
app.use('/shoplocation', authenticationMiddleware, addShopLocation)
app.use('/customer', shopCustomersWithoutAuth)
app.use('/barber', authenticationMiddleware, shopBarbers)
app.use('/barberauth', shopBarbersWithoutAuth)
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
