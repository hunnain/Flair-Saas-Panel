const UserModel = require('../models/shopAdminSignup');
const ShopBranchesModel = require("../models/shopLocation");
const ShopCustomersModel = require("../models/shopCustomersSingup");
const ShopBarbersModel = require("../models/shopBarberSignup");
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const bcrypt    = require('bcrypt');
const stripe    = require("stripe")(process.env.STRIPE_SECRET_KEY)
const jwt 	    = require('jsonwebtoken');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const mongoose  = require('mongoose');
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

function generateAccessToken(userObj) {
    const TOKEN_SECRET = process.env.TOKEN_SECRET
	return jwt.sign(userObj, TOKEN_SECRET, { expiresIn: '15d' });
}

// Signup for the Barber of shop
exports.signupBarberOfShop = async function (req, res) {
    try {
    if (!req.body.email || !req.body.mobile || !req.body.firstName || !req.body.lastName || !req.body.role) return res.status(400).send({success: false, message:"Invalid Request"});
    const barberEmailChecking = await ShopBarbersModel.findOne({
		email: req.body.email,
        shopAdminAccountId: req.user._id
	})
    if (barberEmailChecking) return res.status(400).send({success: false, message:"Email already exist"});

    const barberMobileChecking = await ShopBarbersModel.findOne({
		mobile: req.body.mobile,
        shopAdminAccountId: req.user._id
	})
    if (barberMobileChecking) return res.status(400).send({success: false, message:"Mobile already exist"});  

    // Checking Shop ID
    const adminuser = await UserModel.findOne({
        _id: req.user._id
	})
    if (!adminuser) return res.status(400).send({success: false, message:"Shop Not Found"});

    var shopBarbersModel = new ShopBarbersModel();
    shopBarbersModel.shopAdminAccountId =  req.user._id
    shopBarbersModel.email =  req.body.email
    shopBarbersModel.isMobileVerified =  false
    shopBarbersModel.isEmailVerified =  false
    shopBarbersModel.isPasswordChange =  false
    shopBarbersModel.mobile =  req.body.mobile
    shopBarbersModel.firstName =  req.body.firstName
    shopBarbersModel.lastName =  req.body.lastName
    shopBarbersModel.role =  req.body.role
    if(req.body.workingLocation){
        shopBarbersModel.workingLocation.push(req.body.workingLocation)
    }
    if(req.body.isOnCommission){
    shopBarbersModel.isOnCommission =  req.body.isOnCommission
    }
    if(req.body.isOnRent){
    shopBarbersModel.isOnRent =  req.body.isOnRent
    }
    if(req.body.commissionPayoutFrequency){
    shopBarbersModel.commissionPayoutFrequency =  req.body.commissionPayoutFrequency
    }
    if(req.body.rentCollectionFrequency){
    shopBarbersModel.rentCollectionFrequency =  req.body.rentCollectionFrequency
    }
    if(req.body.commisionPayStructure){
    shopBarbersModel.commisionPayStructure =  req.body.commisionPayStructure
    }
    if(req.body.rentPayStructure){
    shopBarbersModel.rentPayStructure =  req.body.rentPayStructure
    }
    // Auto Generate Password
    if(req.body.password){
        // Converting into Hash
        const hash = await bcrypt.hash(req.body.password, 10);
        shopBarbersModel.password   = hash
    }else{
        let autoGeneratedPassword = makeid(8);
        const hash = await bcrypt.hash(autoGeneratedPassword, 10);
        shopBarbersModel.password   = hash
    }
    
    // const customer = await stripe.customers.create({
    //     email:req.body.email.toLowerCase(),
    //     name: req.body.userName,

    // })
    // user.stripeCustomerId = customer.id

        await shopBarbersModel.save(async function (err, shopBarbersModel) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'User already exist!' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: err});
              }
            //   Saving this user in admin main model so in every sense barber and admin will be connected with each other
              adminuser.businessAllBarbers.push(shopBarbersModel._id)
              adminuser.save();
             // Twillio Send Otp

            res.send({
                data: shopBarbersModel,
                success: true,
                message: "Signup Sucessfully & Code has been sent to the number!"
            });
        });        
    } catch (error) {
        console.log('errr', error)
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }

};

// Update Barber Profile data
exports.updateBarber = async function (req, res) {
    try {
        if (!req.body.barberId || !req.body.shopAdminAccountId) return res.status(400).send({success: false, message:"Invalid Request"});
    const user = await ShopBarbersModel.findOne({
        _id: req.body.barberId,
        shopAdminAccountId: req.body.shopAdminAccountId
    });
    if (!user) return res.status(400).send({success: false, message:"User Not Found. Please contact Flair Support"});
    
    if(req.body.firstName){
        user.firstName  = req.body.firstName        
    }
    if(req.body.lastName){
        user.lastName   = req.body.lastName     
    }
    if(req.body.userProfileLogo){
        user.userProfileLogo =  req.body.userProfileLogo 
    }
    if(req.body.email){
        const emailChecking = await ShopBarbersModel.findOne({
            email: req.body.email,
            shopAdminAccountId: req.body.shopAdminAccountId
        })
        if (emailChecking) return res.status(400).send({success: false, message:"Email already exist"}); 
        user.email = req.body.email
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
    if(req.body.mobile){
        const userMobileChecking = await ShopBarbersModel.findOne({
            mobile: req.body.mobile,
            shopAdminAccountId: req.body.shopAdminAccountId
        })
        if (userMobileChecking) return res.status(400).send({success: false, message:"Mobile already exist"});
        user.mobile = req.body.mobile
    }
    if(req.body.isOnCommission){
        user.isOnCommission = req.body.isOnCommission
    }
    if(req.body.role){
        user.role = req.body.role
    }
    if(req.body.isOnRent){
        user.isOnRent = req.body.isOnRent
    } 
    if(req.body.commissionPayoutFrequency){
        user.commissionPayoutFrequency = req.body.commissionPayoutFrequency
    }
    if(req.body.rentCollectionFrequency){
        user.rentCollectionFrequency = req.body.rentCollectionFrequency
    }
    if(req.body.commisionPayStructure){
        user.commisionPayStructure = req.body.commisionPayStructure
    }
    if(req.body.rentPayStructure){
        user.rentPayStructure = req.body.rentPayStructure
    } 
    if(req.body.dob){
        user.dob = req.body.dob
    }
    if(req.body.gender){
        user.gender = req.body.gender
    }
    if(req.body.about){
        user.about = req.body.about
    }
    if(req.body.instagram){
        user.instagram = req.body.instagram
    }
    if(req.body.workingLocation){
        user.workingLocation.push(req.body.workingLocation)
    }
    if(req.body.barberPhotosGallery){
        user.barberPhotosGallery.push(req.body.barberPhotosGallery)
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
                message: "Updated!"
            });
        });        
    } catch (error) {
        console.log('err',error)
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }

};

// Send OTP Barber phone Number in order to change mobile number
exports.sendOTPOnNumberForMobileNumberChange = async function (req, res) {
    try {
        if (!req.body.barberId || !req.body.shopAdminAccountId) return res.status(400).send({success: false, message:"Invalid Request"});
        const user = await ShopBarbersModel.findOne({
            _id: req.body.barberId,
            shopAdminAccountId: req.body.shopAdminAccountId
        });
        if(!user) return res.status(400).send({success: false, message:"Sorry Information was not correct"});

            // Mobile Verification
        user.mobileVerifyToken = Math.floor(1000 + Math.random() * 9000);
    
        let futuretimeForExpiry = Date.now() + 1000 * 60;  // Add 1 min later time from current time

        let momentConversionForDb = moment(futuretimeForExpiry).format('YYYY.MM.DD HH:mm')
        user.mobileVerifyTokenExpires = momentConversionForDb;

        await user.save(async function (err, user) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'Some Data is Wrong!' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: err});
              }
    
            // Twillio Comes here
    
            res.send({
                success: true,
                message: "OTP Send"
            });
        });

    }catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
}

// Verify Otp For Mobile Number Change
exports.verifyOtpForMobileNumberChange = async function (req, res) {
    try {
        if (!req.body.otp || !req.body.barberId || !req.body.shopAdminAccountId) return res.status(400).send({success: false, message:"Invalid Request"});
        const user = await ShopBarbersModel.findOne({
            _id: req.body.barberId,
            mobileVerifyToken: req.body.otp,
            shopAdminAccountId: req.body.shopAdminAccountId
        });
        if(!user)  return res.status(400).send({success: false, message:"Otp Incorrect"});

        // if (user.mobileVerifyTokenExpires < Date.now()) return res.status(400).send({success: false, message:"Otp Expired"});
                // if (user.mobileVerifyTokenExpires > Date.now()){
                //       console.log("if kai andr wala chl raha hai")
                // }else{
                //       console.log("if kai bahar wala chl raha hai")
                // }
                function checkExpiry(otpExpTime) {
                    const now = new Date();
                    
                    if (now > otpExpTime) {
                      console.log("OTP code has expired");
                    } else {
                      console.log("OTP code is valid");
                    }
                  }
                  
                  const otpExpTime = new Date();
                  otpExpTime.setMinutes(otpExpTime.getMinutes() + 1);
                  checkExpiry(otpExpTime);

        res.send({
            success: true,
            message: "OTP Correct!"
        });
    }catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
}