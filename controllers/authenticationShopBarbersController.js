const UserModel = require('../models/shopAdminSignup');
const ShopBarbersModel = require("../models/shopBarberSignup");
const bcrypt    = require("bcrypt")
const jwt 	    = require('jsonwebtoken');
const moment = require('moment');

function generateAccessToken(userObj) {
    const TOKEN_SECRET = process.env.TOKEN_SECRET
	return jwt.sign(userObj, TOKEN_SECRET, { expiresIn: '15d' });
}

exports.loginForShopBarbers = async (req, res) => {
    try{
    if (!req.body.email || !req.body.password || !req.body.shopAdminAccountId) return res.status(400).send({success: false, message:"Invalid Request"});

    const user = await ShopBarbersModel.findOne({
		email: req.body.email,
        shopAdminAccountId: req.body.shopAdminAccountId
	})
    if (!user) return res.status(400).send({success: false, message:"User Not Found"});
    
    const passwordCompare = await bcrypt.compare(
        req.body.password,
        user.password
    );
    if (!passwordCompare) return res.status(400).send({success: false, message:"Credentials Incorrect"})
        
    // user.resetPasswordExpires = Date.now() + 1000 * 60; //expires in an hour
        const token = generateAccessToken({
            _id     : user._id,
            shopAdminAccountId   : user.shopAdminAccountId,
            email: req.body.email,
            userType: "barber"
        });
        
        if(req.body.notificationToken){
            user.notificationToken.push(req.body.notificationToken)
        }
        // user.iosApn = req.body.iosApn
        // user.platform = req.body.platform
        await user.save(async function (err, userData) {

            user.password = undefined;
            delete user.password;
            res.send({
                success: true,
                userData,
                token
            });
        })
    }catch (error) {
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Forgot Password Barber
exports.forgotPasswordSendOTPForBarberEMAIL = async (req, res) => {
    try{
        if (!req.body.email || !req.body.shopAdminAccountId) return res.status(400).send({success: false, message:"Invalid Request"});

        const shopBarbersModel = await ShopBarbersModel.findOne({
            email: req.body.email,
            shopAdminAccountId: req.body.shopAdminAccountId
        })
        if (!shopBarbersModel) return res.status(400).send({success: false, message:"Sorry information is incorrect"});

            // Mobile Verification
            shopBarbersModel.resetPasswordToken = Math.floor(1000 + Math.random() * 9000);
    
    let futuretimeForExpiry = Date.now() + 1000 * 60;  // Add 1 min later time from current time

    let momentConversionForDb = moment(futuretimeForExpiry).format('YYYY.MM.DD HH:mm')
    shopBarbersModel.resetPasswordExpires = momentConversionForDb;

        await shopBarbersModel.save(async function (err, userData) {

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

        const user = await ShopBarbersModel.findOne({
            email: req.body.email,
            shopAdminAccountId: req.body.shopAdminAccountId,
            resetPasswordToken: req.body.otp
        })
        if (!user) return res.status(400).send({success: false, message:"OTP Incorrect"});

        const expirationDate = moment(user.resetPasswordExpires);
        if (expirationDate.isBefore(moment())) return res.status(400).send({success: false, message:"Otp Expired"});

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

// Verify Secret Code & Change Password
exports.recoverPassword = async (req, res) => {
    try{
        if (!req.body.password || !req.body.secretChangePasswordCode || !req.body.shopAdminAccountId || !req.body.email) return res.status(400).send({success: false, message:"Invalid Request"});

        const user = await ShopBarbersModel.findOne({
            shopAdminAccountId: req.body.shopAdminAccountId,
            email: req.body.email
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