const UserModel = require('../models/shopAdminSignup');
const bcrypt    = require("bcrypt")
const jwt 	    = require('jsonwebtoken');
const GroupModel = require("../models/groups");
const UserFreeTimeModel  = require('../models/userFreeTime');
const InitialOnbardingUsersMobileModel = require('../models/initialOnbardingUsersMobile')
const moment = require('moment-timezone');

function generateAccessToken(userObj) {
    const TOKEN_SECRET = process.env.TOKEN_SECRET
	return jwt.sign(userObj, TOKEN_SECRET, { expiresIn: '15d' });
}
exports.index = function (req, res) {
    res.json("Welcome to no-where void!");
};
exports.loginForAdminPanel = async (req, res) => {
    try{
    if (!req.body.email || !req.body.password) return res.status(400).send({success: false, message:"Invalid Request"});

    const user = await UserModel.findOne({
		email: req.body.email
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
            email   : user.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
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


// Verify Onbarding Screen OTP & create session
// exports.verificationForOnbardingPanel = async (req, res) => {
//     try{
//         if (!req.body.mobile || !req.body.otp) return res.status(400).send({success: false, message:"Invalid Request"});

//         const user = await InitialOnbardingUsersMobileModel.findOne({
//             mobile: req.body.mobile,
//             resetPasswordToken: req.body.otp
//         })
//         if (!user) return res.status(400).send({success: false, message:"User Not Found"});

//         if (user.resetPasswordExpires < Date.now()) return res.status(400).send({success: false, message:"Otp Expired"});

//         const token = generateAccessToken({
//             _id     : user._id,
//             mobile: req.body.mobile,
//         });

//         res.send({
//             success: true,
//             token
//         });
//     }catch (error) {
//         console.log('dd',error)
//         res.status(500).send({
//             success: false,error, message:"Server Internal Error"
//         });
//     }
// };

// Logout
exports.logout = async (req, res) => {
    try{

    if (!req.body.userId) return res.status(400).send({success: false, message:"Invalid Request"});
    const user = await UserModel.findOne({
		_id: req.body.userId
	});
    if (!user) return res.status(400).send({success: false, message:"User Not Found"});

        user.notificationToken = ""
        user.iosApn = ""
        await user.save(function (err, user) {

            user.password = undefined;
            delete user.password;
            res.send({
                success: true,
                user
            });
        })
    }catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
};
// exports.changePassword = function (req, res) {
    
// };
// exports.delete = function (req, res) {
    
// };
// exports.updatePassword = function (req, res) {
    
// };