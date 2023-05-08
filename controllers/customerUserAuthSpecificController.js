const UserModel = require('../models/shopAdminSignup');
const ShopBranchesModel = require("../models/shopLocation");
const ShopCustomersModel = require("../models/shopCustomersSingup");
const BookingModel = require("../models/createBooking");
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

// Update Customer Profile data
exports.updateCustomer = async function (req, res) {
    try {
    //  console.log('data',req.user)
    const user = await ShopCustomersModel.findOne({
        _id: req.user._id,
        shopAdminAccountId: req.user.shopAdminAccountId
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
        const emailChecking = await ShopCustomersModel.findOne({
            email: req.body.email,
            shopAdminAccountId: req.user.shopAdminAccountId
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
        const userMobileChecking = await ShopCustomersModel.findOne({
            mobile: req.body.mobile,
            shopAdminAccountId: req.user.shopAdminAccountId
        })
        if (userMobileChecking) return res.status(400).send({success: false, message:"Mobile already exist"});
        user.mobile = req.body.mobile
    }
    if(req.body.gender){
        user.gender = req.body.gender
    }
    if(req.body.dob){
        user.dob = req.body.dob
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

//  CHECKOUT SECTION
exports.checkout = async (req, res) => {
    try{
        if (!req.body.bookingTime || !req.body.bookingDate || !req.body.bookingBranch || !req.body.selectedBarberServices || !req.body.selectedBarber || !req.body.shopAdminAccountId) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "customer") return res.status(400).send({success: false, message:"You do not have excess"});
        
        var bookingModel = new BookingModel();
        bookingModel.shopAdminAccountId =  req.body.shopAdminAccountId
        bookingModel.bookingTime =  req.body.bookingTime
        bookingModel.bookingDate =  req.body.bookingDate
        bookingModel.bookingBranch =  req.body.bookingBranch
        bookingModel.selectedBarberServices =  req.body.selectedBarberServices
        bookingModel.selectedBarber =  req.body.selectedBarber
        bookingModel.isItWalkingCustomer =  false
        bookingModel.customer =  req.user._id
        bookingModel.totalDiscount =  req.body.totalDiscount
        bookingModel.availablePromotionsDiscount =  req.body.availablePromotionsDiscount
        // bookingModel.paymentStatus =  req.body.availablePromotionsDiscount
        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};