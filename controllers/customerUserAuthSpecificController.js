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
const crypto = require('crypto');

// Generate Unique ID
async function generateUniqueString() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Save Customer Debit/Credit Card on stripe
async function saveCard(customerId, cardToken) {
  const card = await stripe.customers.createSource(customerId, {
    source: cardToken,
  });
  return card.id;
}

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

// Save New Customer Card   ----> Testing
exports.saveCard = async (req, res) => {
    try{
        if (!req.body.cardToken) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "customer") return res.status(400).send({success: false, message:"You do not have excess"});
        
        const user = await ShopCustomersModel.findOne({
            _id: req.user._id,
            shopAdminAccountId: req.user.shopAdminAccountId
        });
        if (!user) return res.status(400).send({success: false, message:"User Not Found. Please contact Flair Support"});

        const customerId = req.user.stripeCustomerId;
        const cardToken = req.body.cardToken;
        const cardId = await saveCard(customerId, cardToken);


        user.stripeSavedCardIds.push(cardId);

        await user.save(async function (err, user) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'User already exist!' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: "Something Went Wrong"});
              }
            

            res.send({
                data: user._id,
                success: true,
                message: "Updated!"
            });
        });  
        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Delete Customer Card   ----> Testing
exports.deleteCard = async (req, res) => {
    try{
        if (!req.body.cardId) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "customer") return res.status(400).send({success: false, message:"You do not have excess"});
        
        const user = await ShopCustomersModel.findOne({
            _id: req.user._id,
            shopAdminAccountId: req.user.shopAdminAccountId
        });
        if (!user) return res.status(400).send({success: false, message:"User Not Found. Please contact Flair Support"});

        // Call the Stripe API to delete the card from the customer's payment methods
        stripe.paymentMethods.detach(req.body.cardId, function(err, paymentMethod) {
        if (err) {
            // Handle the error
            return res.status(400).send({ succes: false, message: 'Error deleting payment method' });
        }
        });

        const index = user.stripeSavedCardIds.indexOf(req.body.cardId);

        if (index > -1) {
            user.stripeSavedCardIds.splice(index, 1);
        }

        await user.save(async function (err, user) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'User already exist!' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: "Something Went Wrong"});
              }
            

            res.send({
                data: user,
                success: true,
                message: "Payment Method Deleted"
            });
        });  
        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};


//  CHECKOUT SECTION   --- Stripe Card charge & Loyalty
exports.checkoutCustomerPanel = async (req, res) => {
    try{
        if (!req.body.bookingTime || !req.body.bookingDate || !req.body.bookingBranch || !req.body.selectedBarberServices || !req.body.selectedBarber || !req.body.isReserverWithCard || !req.body.bookingStartTime || !req.body.bookingEndTime) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "customer") return res.status(400).send({success: false, message:"You do not have excess"});
        
        const user = await UserModel.findOne({
            shopAdminAccountId: req.user.shopAdminAccountId
        });
        if (!user) return res.status(400).send({success: false, message:"Sorry wrong info, You cannot create booking. Contact with Support"});

        let uniqueString = generateUniqueString();

        if(user.bookingPaymentWithCard === true){
            // This Shop request to every customer to add card & pay via card

            var bookingModel = new BookingModel();
            bookingModel.shopAdminAccountId =  req.user.shopAdminAccountId
            bookingModel.bookingTime.startTime =  req.body.bookingStartTime
            booking.bookingTime.endTime = req.body.bookingEndTime
            bookingModel.bookingDate =  req.body.bookingDate
            bookingModel.bookingBranch =  req.body.bookingBranch
            bookingModel.selectedBarberServices =  req.body.selectedBarberServices
            bookingModel.selectedBarber =  req.body.selectedBarber
            bookingModel.isItWalkingCustomer =  false
            bookingModel.customer =  req.user._id
            bookingModel.totalDiscount =  req.body.totalDiscount
            bookingModel.availablePromotionsDiscount =  req.body.availablePromotionsDiscount
            // bookingModel.paymentStatus =  req.body.availablePromotionsDiscount
            bookingModel.bookingId = uniqueString
        }

        // Checking Each user in Admin that admin has enable any user to must add card or not
        if (user.customerAccountMustRequiredCardOnBooking && user.customerAccountMustRequiredCardOnBooking.length > 0) {
            // check if the array is not empty
          
            const loggedInUserId = req.user._id.toString(); // convert the ObjectId to a string
          
            if (user.customerAccountMustRequiredCardOnBooking.indexOf(loggedInUserId) !== -1) {
              // check if the array contains the logged-in user's ObjectId
          
              // the logged-in user's ObjectId is in the array
              // you can perform any actions you want here
              console.log('The logged-in user is required to have a card on booking.');
              var bookingModel = new BookingModel();
              bookingModel.shopAdminAccountId =  req.user.shopAdminAccountId
              bookingModel.bookingTime =  req.body.bookingTime
              bookingModel.bookingDate =  req.body.bookingDate
              bookingModel.bookingBranch =  req.body.bookingBranch
              bookingModel.selectedBarberServices =  req.body.selectedBarberServices
              bookingModel.selectedBarber =  req.body.selectedBarber
              bookingModel.isItWalkingCustomer =  false
              bookingModel.customer =  req.user._id
              bookingModel.totalDiscount =  req.body.totalDiscount
              bookingModel.availablePromotionsDiscount =  req.body.availablePromotionsDiscount
            //   bookingModel.paymentStatus =  req.body.availablePromotionsDiscount
            bookingModel.bookingId = uniqueString
            }
          }

        // Over here there is not required card from barber and admin, Now it depend on user if he wanna reserve with card or not
        if(isReserverWithCard === true){
            
        }else{
            // Reserver Spot Wihtout Payment Card

            var bookingModel = new BookingModel();
            bookingModel.shopAdminAccountId =  req.user.shopAdminAccountId
            bookingModel.bookingTime =  req.body.bookingTime
            bookingModel.bookingDate =  req.body.bookingDate
            bookingModel.bookingBranch =  req.body.bookingBranch
            bookingModel.selectedBarberServices =  req.body.selectedBarberServices
            bookingModel.selectedBarber =  req.body.selectedBarber
            bookingModel.isItWalkingCustomer =  false
            bookingModel.customer =  req.user._id
            bookingModel.totalDiscount =  req.body.totalDiscount
            bookingModel.availablePromotionsDiscount =  req.body.availablePromotionsDiscount
            bookingModel.paymentStatus =  "pending"
            bookingModel.bookingStatus =  "pending"
            bookingModel.bookingId = uniqueString

            await bookingModel.save(async function (err, user) {
                if (err) {
                    if (err.name === 'MongoError' && err.code === 11000) {
                    // Duplicate username
                    return res.status(400).send({ succes: false, message: 'Something Wrong Contact Support' });
                    }
            
                    // Some other error
                    return res.status(400).send({success: false, message: "Something Went Wrong"});
                }
            

                res.send({
                    data: user._id,
                    success: true,
                    message: "Updated!"
                });
            }); 
            }
        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};