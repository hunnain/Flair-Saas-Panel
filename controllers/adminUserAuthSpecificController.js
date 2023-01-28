const UserFreeTimeModel = require('../models/userFreeTime');
const InitialOnbardingUsersMobileModel = require('../models/initialOnbardingUsersMobile')
const UserModel = require('../models/shopAdminSignup')
const SubAdminModel = require('../models/adminPanelSubAdminAccount');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const bcrypt    = require('bcrypt');
const stripe    = require("stripe")(process.env.STRIPE_SECRET_KEY)
const jwt 	    = require('jsonwebtoken');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const moment = require('moment-timezone');

// Auto Genrate String Numbers Function
function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}


// Route for AUTH APIS only
// Update password only first time for user
exports.changeAdminPasswordForOnbarding = async function (req, res) {
    if (!req.body.password) return res.status(400).send({success: false, message:"Invalid Request"});

    try{
        const user = await UserModel.findOne({
            _id: req.user._id,
            isPasswordChange: false
        });
        if (!user) return res.status(400).send({success: false, message:"User Not Found or You cannot change password at this time."});

            const hash = await bcrypt.hash(req.body.password, 10);
            user.password   = hash
            user.isPasswordChange = true
        await user.save(function (err, user) {
            if (err) return res.status(400).send({success: false, message: err});
            
            user.password = undefined;
        delete user.password;
            res.json({
                success: true,
                message: "User Detail Updated!",
                data: user
            });
        })
    } catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }

};

// Update API For shop data which will use to add more data
exports.updateInitialShopDetails = async function (req, res) {
    try {
     
    const user = await UserModel.findOne({
        _id: req.user._id,
    });
    if (!user) return res.status(400).send({success: false, message:"User Not Found. Please contact Flair Support"});
    
    if(req.body.firstName){
        user.firstName  = req.body.firstName        
    }
    if(req.body.lastName){
        user.lastName   = req.body.lastName     
    }
    if(req.body.adminUserLogo){
        user.adminUserLogo =  req.body.adminUserLogo 
    }
    if(req.body.email){
        user.email =  req.body.email 
    }
    if(req.body.userCurrentPassword && req.body.userNewPassword){
        const passwordCompare = await bcrypt.compare(
            req.body.userCurrentPassword,
            user.password
        );
        if (!passwordCompare) return res.status(400).send({success: false, message:"Password Incorrect"})
        const hash = await bcrypt.hash(req.body.userNewPassword, 10);
        user.password   = hash
    }
    if(req.body.businessLogo){
        user.businessLogo = req.body.businessLogo
    }
    if(req.body.businessName){
        user.businessName = req.body.businessName
    }
    if(req.body.businessCountry){
        user.businessCountry = req.body.businessCountry
    }
    if(req.body.businessState){
        user.businessState = req.body.businessState
    }
    if(req.body.businessCity){
        user.businessCity = req.body.businessCity
    }
    if(req.body.businessAddress){
        user.businessAddress = req.body.businessAddress
    }
    if(req.body.businessStaffSize){
        user.businessStaffSize = req.body.businessStaffSize
    }
    if(req.body.businessWebsite){
        user.businessWebsite = req.body.businessWebsite
    }
    if(req.body.businessGoogleReviews){
        user.businessGoogleReviews = req.body.businessGoogleReviews
    }
    if(req.body.businessFacebookPage){
        user.businessFacebookPage = req.body.businessFacebookPage
    }
    if(req.body.businessInstagramPage){
        user.businessInstagramPage = req.body.businessInstagramPage
    }
    if(req.body.businessPricingPlan){
        user.businessPricingPlan = req.body.businessPricingPlan
    }
    if(req.body.businessContacts){
        user.businessContacts = req.body.businessContacts
    }
    if(req.body.businessAppLogo){
        user.businessAppLogo = req.body.businessAppLogo
    }
    if(req.body.businessContractAccepted){
        user.businessContractAccepted = req.body.businessContractAccepted
    }
    if(req.body.bookingPaymentWithCard){
        user.bookingPaymentWithCard = req.body.bookingPaymentWithCard
    }
    if(req.body.businessStartingTheme){
        user.businessStartingTheme = req.body.businessStartingTheme
    }
    if(req.body.businessSelectedTheme){
        user.businessSelectedTheme = req.body.businessSelectedTheme
    }
    
    
    // const customer = await stripe.customers.create({
    //     email:req.body.email.toLowerCase(),
    //     name: req.body.userName,

    // })
    // user.stripeCustomerId = customer.id
        await user.save(async function (err, user) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'User already exist!' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: err});
              }
            

            res.send({
                data: user._id,
                success: true,
                message: "Shop Data Updated!"
            });
        });        
    } catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }

};

// Update Mobile & Send OTP
exports.updateMobileandSendOtpToAdminUser = async (req, res) => {
    try{
        if (!req.body.mobile || !req.body.email) return res.status(400).send({success: false, message:"Invalid Request"});
        
        // Check Mobile is exist or not
        const userMobileChecking = await UserModel.findOne({
            mobile: req.body.mobile,
            shopAdminAccountId: req.body.shopAdminAccountId
        })
        if (userMobileChecking) return res.status(400).send({success: false, message:"Mobile already exist"});

        const user = await UserModel.findOne({
            _id: req.user._id,
            email: req.body.email
        })
        if (!user) return res.status(400).send({success: false, message:"Sorry information is incorrect"});

            // Mobile Verification
            user.mobileVerifyToken = Math.floor(1000 + Math.random() * 9000);
    
    let futuretimeForExpiry = Date.now() + 1000 * 60;  // Add 1 min later time from current time

    let momentConversionForDb = moment(futuretimeForExpiry).format('YYYY.MM.DD HH:mm')
    user.mobileVerifyTokenExpires = momentConversionForDb;

    user.mobile = req.body.mobile
        await user.save(async function (err, userData) {

            // Twillio Send Otp

            res.send({
                success: true,
                message: "Otp Send"
            });
        })
    }catch (error) {
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
}

// Resend Otp
exports.resendMobileOtpForAdminUser = async (req, res) => {
    try{
        if (!req.body.mobile || !req.body.email) return res.status(400).send({success: false, message:"Invalid Request"});

        const user = await UserModel.findOne({
            mobile: req.body.mobile,
            _id: req.user._id,
            email: req.body.email
        })
        if (!user) return res.status(400).send({success: false, message:"Sorry information is incorrect"});

            // Mobile Verification
            user.mobileVerifyToken = Math.floor(1000 + Math.random() * 9000);
    
    let futuretimeForExpiry = Date.now() + 1000 * 60;  // Add 1 min later time from current time

    let momentConversionForDb = moment(futuretimeForExpiry).format('YYYY.MM.DD HH:mm')
    user.mobileVerifyTokenExpires = momentConversionForDb;

        await user.save(async function (err, userData) {

            // Twillio Send Otp

            res.send({
                success: true,
                message: "Otp Send"
            });
        })
    }catch (error) {
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
}

// Verify Admin Otp
exports.verifyOtpForAdminUser = async (req, res) => {
    try{
        if (!req.body.mobile || !req.body.otp || !req.body.email) return res.status(400).send({success: false, message:"Invalid Request"});

        const user = await UserModel.findOne({
            mobile: req.body.mobile,
            _id: req.user._id,
            mobileVerifyToken: req.body.otp,
            email: req.body.email
        })
        if (!user) return res.status(400).send({success: false, message:"OTP Incorrect"});

        if (user.mobileVerifyTokenExpires < Date.now()) return res.status(400).send({success: false, message:"Otp Expired"});

        user.isMobileVerified = true
        await user.save(async function (err, userData) {

            res.send({
                success: true,
                message: "Otp Verified!"
            });
        })
    }catch (error) {
        console.log('err',error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Create Sub Admins for admin panel
exports.subAdminSignupOfShop = async function (req, res) {
    try {
    if (!req.body.email || !req.body.firstName || !req.body.lastName || !req.body.mobile) return res.status(400).send({success: false, message:"Invalid Request"});

    const userChecking = await UserModel.findOne({
		email: req.body.email
	})
    if (userChecking) return res.status(400).send({success: false, message:"Email already exist"});

    // Admin Account
    const adminAccount = await UserModel.findOne({
		_id: req.user._id
	})
    if (!adminAccount) return res.status(400).send({success: false, message:"Admin Account Not Found. Contact Flair Support"});
    
    var user = new SubAdminModel();
    user.mainAdminShopAccount = req.user._id
    user.email =  req.body.email
    user.firstName =  req.body.firstName
    user.lastName =  req.body.lastName
    user.mobile =  req.body.mobile
    user.isMobileVerified =  false
    user.isEmailVerified =  false
    user.isPasswordChange =  false
        // Auto Generate Password
        if(req.body.password){
            // Converting into Hash
            const hash = await bcrypt.hash(req.body.password, 10);
            user.password   = hash
        }else{
            let autoGeneratedPassword = makeid(8);
            const hash = await bcrypt.hash(autoGeneratedPassword, 10);
            user.password   = hash
        }
    
    // const customer = await stripe.customers.create({
    //     email:req.body.email.toLowerCase(),
    //     name: req.body.userName,

    // })
    // user.stripeCustomerId = customer.id

        await user.save(async function (err, user) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'User already exist!' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: err});
              }
              adminAccount.businessAllSubAdmin.push(user._id)
              adminAccount.save()

            res.send({
                success: true,
                message: "Signup Sucessfully!"
            });
        });        
    } catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
    
};