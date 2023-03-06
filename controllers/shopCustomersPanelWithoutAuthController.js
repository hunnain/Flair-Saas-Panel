const UserModel = require('../models/shopAdminSignup');
const ShopBranchesModel = require("../models/shopLocation");
const ShopCustomersModel = require("../models/shopCustomersSingup");
const ShopBarbersModel = require("../models/shopBarberSignup");
const ShopServicesCategoryModel = require('../models/shopServicesCatgories');
const ShopServicesModel = require('../models/shopServices');
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


function generateAccessToken(userObj) {
    const TOKEN_SECRET = process.env.TOKEN_SECRET
	return jwt.sign(userObj, TOKEN_SECRET, { expiresIn: '15d' });
}

// Signup for the Customer of shop
exports.signupCustomerOfShop = async function (req, res) {
    try {
    if (!req.body.email || !req.body.shopAdminAccountId || !req.body.password || !req.body.mobile || !req.body.firstName || !req.body.lastName || !req.body.gender || !req.body.dob) return res.status(400).send({success: false, message:"Invalid Request"});
    
    const user = await ShopCustomersModel.findOne({
		email: req.body.email,
        shopAdminAccountId: req.body.shopAdminAccountId
	})
    if (user) return res.status(400).send({success: false, message:"Email already exist"});

    const userMobileChecking = await ShopCustomersModel.findOne({
		mobile: req.body.mobile,
        shopAdminAccountId: req.body.shopAdminAccountId
	})
    if (userMobileChecking) return res.status(400).send({success: false, message:"Mobile already exist"});  

        // Checking Shop ID
        const adminuser = await UserModel.findOne({
            _id: req.body.shopAdminAccountId
        })
        if (!adminuser) return res.status(400).send({success: false, message:"Shop Not Found"});
    
    var shopCustomersModel = new ShopCustomersModel();
    shopCustomersModel.shopAdminAccountId =  req.body.shopAdminAccountId
    shopCustomersModel.email =  req.body.email
    shopCustomersModel.isMobileVerified =  false
    shopCustomersModel.isEmailVerified =  false
    shopCustomersModel.isPasswordChange =  false
    shopCustomersModel.mobile =  req.body.mobile
    shopCustomersModel.firstName =  req.body.firstName
    shopCustomersModel.lastName =  req.body.lastName
    shopCustomersModel.gender =  req.body.gender
    shopCustomersModel.dob =  req.body.dob
    shopCustomersModel.userProfileLogo =  req.body.userProfileLogo
    const hash = await bcrypt.hash(req.body.password, 10);
    shopCustomersModel.password   = hash
    
    // Mobile Verification
    shopCustomersModel.mobileVerifyToken = Math.floor(1000 + Math.random() * 9000);
    
    let futuretimeForExpiry = Date.now() + 1000 * 60;  // Add 1 min later time from current time

    let momentConversionForDb = moment(futuretimeForExpiry).format('YYYY.MM.DD HH:mm')
    shopCustomersModel.mobileVerifyTokenExpires = momentConversionForDb;
    // const customer = await stripe.customers.create({
    //     email:req.body.email.toLowerCase(),
    //     name: req.body.userName,

    // })
    // user.stripeCustomerId = customer.id

        await shopCustomersModel.save(async function (err, shopCustomersModel) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'User already exist!' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: err});
              }
            //   Saving this user in admin main model so in every sense customer and admin will be connected with each other
              adminuser.businessAllCustomers.push(shopCustomersModel._id)
              adminuser.save();
             // Twillio Send Otp

            res.send({
                data: shopCustomersModel,
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

// Resend Otp
exports.resendMobileOtpForCustomerOfShop = async (req, res) => {
    try{
        if (!req.body.mobile || !req.body.email || !req.body.shopAdminAccountId) return res.status(400).send({success: false, message:"Invalid Request"});

        const shopCustomersModel = await ShopCustomersModel.findOne({
            mobile: req.body.mobile,
            shopAdminAccountId: req.body.shopAdminAccountId,
            email: req.body.email
        })
        if (!shopCustomersModel) return res.status(400).send({success: false, message:"Sorry information is incorrect"});

            // Mobile Verification
    shopCustomersModel.mobileVerifyToken = Math.floor(1000 + Math.random() * 9000);
    
    let futuretimeForExpiry = Date.now() + 1000 * 60;  // Add 1 min later time from current time

    let momentConversionForDb = moment(futuretimeForExpiry).format('YYYY.MM.DD HH:mm')
    shopCustomersModel.mobileVerifyTokenExpires = momentConversionForDb;

        await shopCustomersModel.save(async function (err, userData) {

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

// Verify Otp which was send on user profile when signup, It just verify
exports.verifyCustomerOfShopOtp = async (req, res) => {
    try{
        if (!req.body.mobile || !req.body.otp || !req.body.shopAdminAccountId) return res.status(400).send({success: false, message:"Invalid Request"});

        const user = await ShopCustomersModel.findOne({
            mobile: req.body.mobile,
            shopAdminAccountId: req.body.shopAdminAccountId,
            mobileVerifyToken: req.body.otp
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
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Google Singup
exports.googleCreate = async function (req, res) {
    try {
    if (!req.body.email  || !req.body.shopAdminAccountId || !req.body.socialId) return res.status(400).send({success: false, message:"Invalid Request"});
    const randomString = Math.random().toString(32).slice(2)
       // Login user if found Id
       const user = await ShopCustomersModel.findOne({
        shopAdminAccountId: req.body.shopAdminAccountId,
        socialId: req.body.socialId,
        social: "google"
    });
    if(user){
        const token = generateAccessToken({
            _id     : user._id,
            shopAdminAccountId: user.shopAdminAccountId,
            email   : user.email
        });
        res.send({
            success: true,
            message: "Login!",
            token: token,
            user: user
        });
    }else{
        const user = await ShopCustomersModel.findOne({
            email: req.body.email,
            shopAdminAccountId: req.body.shopAdminAccountId
        })
        if (user) return res.status(400).send({success: false, message:"Email already exist"});  

    const registerUser = new ShopCustomersModel();
    registerUser.shopAdminAccountId  = req.body.shopAdminAccountId
    registerUser.email      = req.body.email.toLowerCase()
    registerUser.mobile   = req.body.mobile
    registerUser.profilepic =  req.body.profilepic
    registerUser.social = "google"
    registerUser.socialId = req.body.socialId
    registerUser.notificationToken = req.body.notificationToken
    const hash = await bcrypt.hash(randomString, 10);
    registerUser.password   = hash
    // const customer = await stripe.customers.create({
    //     name: req.body.userName,

    // })
    // registerUser.stripeCustomerId = customer.id
        await registerUser.save(function (err, user) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'User already exist!' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: err});
              }
            const token = generateAccessToken({
                _id     : registerUser._id,
                shopAdminAccountId: registerUser.shopAdminAccountId,
                email   : registerUser.email
            });
            res.send({
                success: true,
                message: "New User Created!",
                token: token,
                user:registerUser
            });
        });        
    }
} catch (error) {
    res.status(500).send({
        success: false, message:"Server Internal Error"
    });
}

};


// Facebook SignUp
exports.facebookCreate = async function (req, res) {
    if (!req.body.shopAdminAccountId || !req.body.socialId || !req.body.email) return res.status(400).send({success: false, message:"Invalid Request"});
    // const randomString = Math.random().toString(36).slice(2)
    const randomPass = Math.random().toString(36).slice(2)
    // const finalEmail = randomString + "@gmail.com"
       // Login user if found Id
       const user = await ShopCustomersModel.findOne({
        shopAdminAccountId: req.body.shopAdminAccountId,
        socialId: req.body.socialId,
        social: "facebook"
    });
    if(user){
        const token = generateAccessToken({
            _id     : user._id,
            shopAdminAccountId: user.shopAdminAccountId,
            email   : user.email
        });
        res.send({
            success: true,
            message: "Login!",
            token: token,
            user: user
        });
    }else{
    
        const user = await ShopCustomersModel.findOne({
            email: req.body.email,
            shopAdminAccountId: req.body.shopAdminAccountId
        })
        if (user) return res.status(400).send({success: false, message:"Email already exist"});  

    const registerUser = new ShopCustomersModel();
    registerUser.shopAdminAccountId  = req.body.shopAdminAccountId
    registerUser.email      = req.body.email.toLowerCase()
    registerUser.mobile   = req.body.mobile
    registerUser.profilepic =  req.body.profilepic
    registerUser.social = "facebook"
    registerUser.socialId = req.body.socialId
    registerUser.fbUid = req.body.fbUid
    const hash = await bcrypt.hash(randomPass, 10);
    registerUser.password   = hash;
    const customer = await stripe.customers.create({
        name: req.body.userName,

    })
    registerUser.stripeCustomerId = customer.id
    try {
        await registerUser.save(function (err, user) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'User already exist!' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: err});
              }
            const token = generateAccessToken({
                _id     : registerUser._id,
                shopAdminAccountId: registerUser.shopAdminAccountId,
                email   : registerUser.email
            });
            res.send({
                success: true,
                message: "New User Created!",
                token: token,
                user:registerUser
            });
        });        
    } catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
}

};

// Apple Signup
exports.appleCreate = async function (req, res) {
    if (!req.body.shopAdminAccountId || !req.body.socialId || !req.body.email) return res.status(400).send({success: false, message:"Invalid Request"});
    // const randomString = Math.random().toString(36).slice(2)
    const randomPass = Math.random().toString(36).slice(2)
    // const finalEmail = randomString + "@gmail.com"
       // Login user if found Id
       const user = await ShopCustomersModel.findOne({
        shopAdminAccountId: req.body.shopAdminAccountId,
        socialId: req.body.socialId,
        social: "apple"
    });
    if(user){
        const token = generateAccessToken({
            _id     : user._id,
            shopAdminAccountId: user.shopAdminAccountId,
            email   : user.email
        });
        res.send({
            success: true,
            message: "Login!",
            token: token,
            user: user
        });
    }else{
    
        const user = await ShopCustomersModel.findOne({
            email: req.body.email,
            shopAdminAccountId: req.body.shopAdminAccountId
        })
        if (user) return res.status(400).send({success: false, message:"Email already exist"});  
        
    const registerUser = new ShopCustomersModel();
    registerUser.shopAdminAccountId  = req.body.shopAdminAccountId
    registerUser.email      = req.body.email.toLowerCase()
    registerUser.mobile   = req.body.mobile
    registerUser.profilepic =  req.body.profilepic
    registerUser.social = "apple"
    registerUser.socialId = req.body.socialId
    registerUser.fbUid = req.body.fbUid
    const hash = await bcrypt.hash(randomPass, 10);
    registerUser.password   = hash;
    const customer = await stripe.customers.create({
        name: req.body.userName,

    })
    registerUser.stripeCustomerId = customer.id
    try {
        await registerUser.save(function (err, user) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'User already exist!' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: err});
              }
            const token = generateAccessToken({
                _id     : registerUser._id,
                shopAdminAccountId: registerUser.shopAdminAccountId,
                email   : registerUser.email
            });
            res.send({
                success: true,
                message: "New User Created!",
                token: token,
                user:registerUser
            });
        });        
    } catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
}

};

exports.getAllShopLocations = async function (req, res) {
    try {
    if (!req.body.mainAdminAccountId) return res.status(400).send({success: false, message:"Invalid Request"});
    
    const shopBranchesModel = await ShopBranchesModel.find({
        shopAdminAccountId: req.body.mainAdminAccountId,
    }).populate('shopAdminAccountId')
    if (!shopBranchesModel) return res.status(400).send({success: false, message:"Sorry No branch found of this Shop."});

            res.send({
                data: shopBranchesModel,
                success: true,
                message: "All Branches"
            });       
    } catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }

};

// Get All shop based on user location
exports.getAllNearbyShopLocations = async function (req, res) {
    try {
    if (!req.body.mainAdminAccountId || !req.body.userLat || !req.body.userLong || !req.body.page) return res.status(400).send({success: false, message:"Invalid Request"});

    let maxDocument = 10;
    let pagesSkip = 10 * req.body.page;
    let id = mongoose.Types.ObjectId(req.body.mainAdminAccountId);
    
    // const shopBranchesModel = await ShopBranchesModel.find({
    //     shopAdminAccountId: req.body.mainAdminAccountId,
    // }).populate('shopAdminAccountId')
    let shopBranchesModel = await ShopBranchesModel.aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: [ req.body.userLong, req.body.userLat ] },
                spherical: true, 
                distanceField: "distance",
                maxDistance: 100000000000000
            }
        },
        { $match: {  shopAdminAccountId: id } },
        {$skip : parseFloat(pagesSkip)},
        {$limit : maxDocument}
      ])
    if (!shopBranchesModel.length) return res.status(400).send({success: false, message:"Sorry No branch found of this Shop."});

    await UserModel.populate(shopBranchesModel, {path: "shopAdminAccountId"});

            res.send({
                data: shopBranchesModel,
                success: true,
                message: "All Branches"
            });       
    } catch (error) {
        console.log('err',error)
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }

};

// Forgot Password
exports.forgotPasswordSendOTPForCustomers = async (req, res) => {
    try{
        if (!req.body.mobile || !req.body.shopAdminAccountId) return res.status(400).send({success: false, message:"Invalid Request"});

        const shopCustomersModel = await ShopCustomersModel.findOne({
            mobile: req.body.mobile,
            shopAdminAccountId: req.body.shopAdminAccountId
        })
        if (!shopCustomersModel) return res.status(400).send({success: false, message:"Sorry information is incorrect"});

            // Mobile Verification
    shopCustomersModel.resetPasswordToken = Math.floor(1000 + Math.random() * 9000);
    
    let futuretimeForExpiry = Date.now() + 1000 * 60;  // Add 1 min later time from current time

    let momentConversionForDb = moment(futuretimeForExpiry).format('YYYY.MM.DD HH:mm')
    shopCustomersModel.resetPasswordExpires = momentConversionForDb;

        await shopCustomersModel.save(async function (err, userData) {

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

// Verify Forgot password otp
exports.verifyForgotPasswordOtp = async (req, res) => {
    try{
        if (!req.body.mobile || !req.body.otp || !req.body.shopAdminAccountId) return res.status(400).send({success: false, message:"Invalid Request"});

        const user = await ShopCustomersModel.findOne({
            mobile: req.body.mobile,
            shopAdminAccountId: req.body.shopAdminAccountId,
            resetPasswordToken: req.body.otp
        })
        if (!user) return res.status(400).send({success: false, message:"OTP Incorrect"});

        if (user.resetPasswordExpires < Date.now()) return res.status(400).send({success: false, message:"Otp Expired"});

        let secretChangePasswordCode = Math.floor(100000 + Math.random() * 100000).toString()
        // secretChangePasswordCode.toString();
        console.log('eee',secretChangePasswordCode)
        const hash = await bcrypt.hash(secretChangePasswordCode, 5);
        user.secretChangePasswordCode   = hash

        let futuretimeForExpiry = Date.now() + 1000 * 60;  // Add 5 min later time from current time

        let momentConversionForDb = moment(futuretimeForExpiry).format('YYYY.MM.DD HH:mm')
        user.secretChangePasswordCodeExpires = momentConversionForDb;
        await user.save(async function (err, userData) {

            res.send({
                authCode: secretChangePasswordCode,
                success: true,
                message: "Otp Verified!"
            });
        })
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};


// Verify Secret Code & Change Password
exports.recoverPassword = async (req, res) => {
    try{
        if (!req.body.password || !req.body.secretChangePasswordCode || !req.body.shopAdminAccountId || !req.body.email) return res.status(400).send({success: false, message:"Invalid Request"});

        const user = await ShopCustomersModel.findOne({
            shopAdminAccountId: req.body.shopAdminAccountId,
            email: req.body.email,
        })
        if (!user) return res.status(400).send({success: false, message:"OTP Incorrect"});

        const secretCodeCompare = await bcrypt.compare(
            req.body.secretChangePasswordCode,
            user.secretChangePasswordCode
        );
        if (!secretCodeCompare) return res.status(400).send({success: false, message:"Your information is incorrect"})

        if (user.secretChangePasswordCodeExpires < Date.now()) return res.status(400).send({success: false, message:"Session Expired"});

        const hash = await bcrypt.hash(req.body.password, 10);
        user.password   = hash

        await user.save(async function (err, userData) {

            res.send({
                success: true,
                message: "Password Changed"
            });
        })
    }catch (error) {
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};



// Forget Password Same as above but send otp on email
exports.forgotPasswordSendOTPForCustomersEMAIL = async (req, res) => {
    try{
        if (!req.body.email || !req.body.shopAdminAccountId) return res.status(400).send({success: false, message:"Invalid Request"});

        const shopCustomersModel = await ShopCustomersModel.findOne({
            email: req.body.email,
            shopAdminAccountId: req.body.shopAdminAccountId
        })
        if (!shopCustomersModel) return res.status(400).send({success: false, message:"Sorry information is incorrect"});

            // Mobile Verification
    shopCustomersModel.resetPasswordToken = Math.floor(1000 + Math.random() * 9000);
    
    let futuretimeForExpiry = Date.now() + 1000 * 60;  // Add 1 min later time from current time

    let momentConversionForDb = moment(futuretimeForExpiry).format('YYYY.MM.DD HH:mm')
    shopCustomersModel.resetPasswordExpires = momentConversionForDb;

        await shopCustomersModel.save(async function (err, userData) {

            // Sendgrid Send Otp

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

// Verify OTP Sended to their email
exports.verifyForgotPasswordOtpEMAIL = async (req, res) => {
    try{
        if (!req.body.email || !req.body.otp || !req.body.shopAdminAccountId) return res.status(400).send({success: false, message:"Invalid Request"});

        const user = await ShopCustomersModel.findOne({
            email: req.body.email,
            shopAdminAccountId: req.body.shopAdminAccountId,
            resetPasswordToken: req.body.otp
        })
        if (!user) return res.status(400).send({success: false, message:"OTP Incorrect"});

        if (user.resetPasswordExpires < Date.now()) return res.status(400).send({success: false, message:"Otp Expired"});

        let secretChangePasswordCode = Math.floor(100000 + Math.random() * 100000).toString()
        // secretChangePasswordCode.toString();
        // console.log('eee',secretChangePasswordCode)
        const hash = await bcrypt.hash(secretChangePasswordCode, 5);
        user.secretChangePasswordCode   = hash

        let futuretimeForExpiry = Date.now() + 1000 * 60;  // Add 5 min later time from current time

        let momentConversionForDb = moment(futuretimeForExpiry).format('YYYY.MM.DD HH:mm')
        user.secretChangePasswordCodeExpires = momentConversionForDb;
        await user.save(async function (err, userData) {

            res.send({
                authCode: secretChangePasswordCode,
                success: true,
                message: "Otp Verified!"
            });
        })
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Get All Barber to this shop
exports.getAllBarberOfShop = async (req, res) => {
    try{
        if (!req.body.shopAdminAccountId || !req.body.page) return res.status(400).send({success: false, message:"Invalid Request"});
        let maxDocument = 8;
        let pagesSkip = 8 * req.body.page;

        const user = await ShopBarbersModel.find({
            shopAdminAccountId: req.body.shopAdminAccountId,
        }).skip(parseFloat(pagesSkip))
        .limit(maxDocument)
        if (!user.length) return res.status(400).send({success: false, message:"Barber's not found of this shop"});

            res.send({
                data: user,
                success: true,
                message: "Barber's list!"
            });
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};


// Search Barber of Shop
exports.searchBarberOfShop = async (req, res) => {
    try{
        if (!req.body.shopAdminAccountId || !req.body.page || !req.body.search) return res.status(400).send({success: false, message:"Invalid Request"});
        let maxDocument = 8;
        let pagesSkip = 8 * req.body.page;

        const user = await ShopBarbersModel.find({
            firstName: { $regex: new RegExp("^" + req.body.search, "i") },
            shopAdminAccountId: req.body.shopAdminAccountId
        }).skip(parseFloat(pagesSkip))
        .limit(maxDocument)
        if (!user.length) return res.status(400).send({success: false, message:"Barber's not found"});

            res.send({
                data: user,
                success: true,
                message: "Barber's list!"
            });
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Get All Services of this shop
exports.getAllServicesOfShop = async (req, res) => {
    try{
        if (!req.body.shopAdminAccountId || !req.body.page) return res.status(400).send({success: false, message:"Invalid Request"});
        let maxDocument = 8;
        let pagesSkip = 8 * req.body.page;

        const user = await ShopServicesModel.find({
            shopAdminAccountId: req.body.shopAdminAccountId,
        }).skip(parseFloat(pagesSkip))
        .limit(maxDocument)
        if (!user.length) return res.status(400).send({success: false, message:"Service not found of this shop"});

            res.send({
                data: user,
                success: true,
                message: "Service list!"
            });
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};