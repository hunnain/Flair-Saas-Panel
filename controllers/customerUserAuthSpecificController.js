const UserModel = require('../models/shopAdminSignup');
const ShopBranchesModel = require("../models/shopLocation");
const ShopCustomersModel = require("../models/shopCustomersSingup");
const BookingModel = require("../models/createBooking");
const ShopBarbersModel = require("../models/shopBarberSignup");
const BarberChoosenServicesModel = require("../models/BarberChoosenServices");
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
const { isBarberAvailableAtTime, checkExistingBooking } = require('./validations/availability');
const { checkCustomerHasCard } = require('./validations/checkCustomerCardValidation');

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

        // Verify Card is Correct
        const currency = 'usd'; // replace with the currency you want to charge in

        const params = {
          amount: 0, // zero amount
          currency: currency,
          payment_method_types: ['card'],
          payment_method: cardToken,
          confirm: true,
          setup_future_usage: 'off_session',
        };
        
        stripe.paymentIntents.create(params, async function(err, paymentIntent) {
          if (err) {
              // Handle error
            if (!user) return res.status(400).send({success: false, err, message:"Error cannot verify your card. Please contact Flair Support"});
          } else {
            if (paymentIntent.status === 'succeeded') {
              // The card is valid
              console.log('Card is valid');
              // Do something here, e.g. save the payment method ID to the customer's account

                // Save Card in stripe
                const cardId = await saveCard(customerId, cardToken);

                // saving CardId in DB
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
                        success: true,
                        message: "Saved!"
                    });
                });

            } else {
              // The card is not valid
              console.log('Card is not valid');
              if (!user) return res.status(400).send({success: false, err, message:"Error cannot verify your card. Please try another card"});
            }
          }
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


//  CHECKOUT SECTION   ---  Loyalty handling
exports.createCustomerBooking = async (req, res) => {
    try{
        if (!req.body.bookingTime || !req.body.bookingDate || !req.body.bookingBranch || !req.body.selectedBarberServices || !req.body.selectedBarber || !req.body.isReserverWithCard === undefined) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "customer") return res.status(400).send({success: false, message:"You do not have excess"});

        // Check is there any duplication in services like same service with two objects
        const selectedServices = req.body.selectedBarberServices;
        // Create a set to track selected service IDs
        const selectedServiceIds = new Set();
        // Iterate over the selected services and check for duplicates
        for (const service of selectedServices) {
        const serviceId = service.service.toString();

        // If the service ID is already in the set, it is a duplicate
        if (selectedServiceIds.has(serviceId)) {
            return res.status(400).json({ success: false, message: 'Duplicate service found' });
        }
        // Add the service ID to the set
        selectedServiceIds.add(serviceId);
        }

        const user = await UserModel.findOne({
            _id: req.user.shopAdminAccountId
        });
        if (!user) return res.status(400).send({success: false, message:"Sorry wrong info, You cannot create booking. Contact with Support"});

        // Also getting barber data
        const barber = await ShopBarbersModel.findOne({
            shopAdminAccountId: req.user.shopAdminAccountId,
            _id: req.body.selectedBarber
        });
        if (!barber) return res.status(400).send({success: false, message:"Sorry wrong info, You cannot create booking. Contact with Support"});
        // checking that barber is live or not
        if(barber.isBarberLive === false) return res.status(400).send({success: false, message:"Sorry this barber is inactive. Contact with Support"});

        const shopBranch = await ShopBranchesModel.findOne({
            shopAdminAccountId: req.user.shopAdminAccountId,
            _id: req.body.bookingBranch
        });
        if (!shopBranch) return res.status(400).send({success: false, message:"Sorry wrong info branch, You cannot create booking. Contact with Support"});

        // Check that booking time match with barber working hour Also check that it match with shop branch opened time
        const bookingDate = moment.utc(req.body.bookingDate, "YYYY-MM-DD").toDate();
        const isBarberAvailable = await isBarberAvailableAtTime(barber, shopBranch, req.body.bookingBranch, bookingDate ,req.body.bookingTime.startTime);
        if (!isBarberAvailable) {
        return res.status(400).send({ success: false, message: "Barber is not available at the specified time Or Branch is closed" });
        }

        // check that barber has selected this service, Like if he provide this service or not. BARBER CHOSEN SERVICES
        const serviceIds = req.body.selectedBarberServices.map(service => service.service);
        const barberChosenServices = await BarberChoosenServicesModel.findOne({
            shopAdminAccountId: req.user.shopAdminAccountId,
            barberAccountId: req.body.selectedBarber,
            _id: { $in: serviceIds }
        });

        if (!barberChosenServices) {
            return res.status(400).send({ success: false, message: "Sorry, one or more services are not available for this barber. Please contact support." });
        }

        
        
        let uniqueString = await generateUniqueString();
        
        var bookingModel = new BookingModel();
        bookingModel.shopAdminAccountId =  req.user.shopAdminAccountId
        bookingModel.bookingTime =  req.body.bookingTime
        bookingModel.bookingDate =  moment.utc(req.body.bookingDate).toDate();
        bookingModel.bookingBranch =  req.body.bookingBranch
        bookingModel.selectedBarberServices =  req.body.selectedBarberServices
        bookingModel.selectedBarber =  req.body.selectedBarber
        bookingModel.isItWalkingCustomer =  false
        bookingModel.customer =  req.user._id
        bookingModel.totalDiscount =  req.body.totalDiscount
        bookingModel.availablePromotionsDiscount =  req.body.availablePromotionsDiscount
        bookingModel.bookingId = uniqueString
        bookingModel.isConfirmedByBarber =  true
        bookingModel.confirmationDate =  moment.utc().toDate();
        bookingModel.isThisBookingReservedWithCard =  false;
        bookingModel.paymentStatus =  "pending";
        bookingModel.bookingStatus =  "reserved";        
        
        // Checking barber has auto allow for booking request or it is manually done by barber
        if(barber.appointmentRequest === true){
            bookingModel.isConfirmedByBarber =  false
            bookingModel.confirmationDate =  undefined;
            bookingModel.bookingStatus =  "pending";  
        }
        
        console.log('bookingModel:', bookingModel);
        // Check that if this barber has already exisitng booking at the same time and same date so give error
        const bookingValidationResult = await checkExistingBooking(bookingModel);
        console.log('sssss', bookingValidationResult)
        if (!bookingValidationResult.success) {
        return res.status(400).send({ success: false, message: "This time slot is already booked with the same barber in a different branch" });
        }
        
        // if(user.bookingPaymentWithCard === true){
            //     // This Shop request to every customer to add card & pay via card But if admin has selected any person to not add card so we can allow them here so we not check that it has saved any card

        //     if (!user.customerNotRequiredToAddCardByAdmin.includes(req.user._id)) {
        //         // req.user._id is not found in customerNotRequiredToAddCardByAdmin array
        //         const hasCard = await checkCustomerHasCard(req.user.stripeCustomerId);
        //         if (typeof hasCard === 'string') {
        //         console.log(`Error: ${hasCard}`);
        //         return res.status(400).send({ success: false, message: hasCard });
        //         }           
        //         bookingModel.isThisBookingReservedWithCard =  true
        //       }

        // }

        // we check that is admin & barber both has required to add card for this specific customer only
        // const userRequiresCard = user.customerRequiredToAddCardByAdmin.concat(barber.customerRequiredToAddCardByBarber);
        // if (userRequiresCard.includes(req.user._id)) {
            
        //         const hasCard = await checkCustomerHasCard(req.user.stripeCustomerId);
        //         if (typeof hasCard === 'string') {
        //           console.log(`Error: ${hasCard}`);
        //           return res.status(400).send({ success: false, message: hasCard });
        //         }
        //         bookingModel.isThisBookingReservedWithCard =  true
        //   }

        // Over here there is not required card from barber and admin, Now it depend on user if he wanna reserve with card or not
        // if(isReserverWithCard === true){
        //     // This Shop request to every customer to add card & pay via card
        //     const hasCard = await checkCustomerHasCard(req.user.stripeCustomerId);
        //     if (typeof hasCard === 'string') {
        //     console.log(`Error: ${hasCard}`);
        //     return res.status(400).send({ success: false, message: hasCard });
        //     }
        //     bookingModel.isThisBookingReservedWithCard =  true
        // }


            // Reserver Spot Wihtout Card will by default run, If custome rrequired to add card so above condition will do that to check that this customer has any saved card 

            await bookingModel.save(async function (err, user) {
                if (err) {
                    if (err.name === 'MongoError' && err.code === 11000) {
                    // Duplicate username
                    return res.status(400).send({ succes: false, message: 'Something Wrong Contact Support' });
                    }
            
                    // Some other error
                    return res.status(400).send({success: false, message: "Something Went Wrongss", err});
                }
            

                res.send({
                    data: user,
                    success: true,
                    message: "Booking Created!"
                });
            }); 
            
        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Customer Save card details
exports.customerAllSavedCards = async (req, res) => {
    try{
        if(req.user.userType !== "customer") return res.status(400).send({success: false, message:"You do not have excess"});
        
        const user = await ShopCustomersModel.findOne({
            _id: req.user._id,
            shopAdminAccountId: req.user.shopAdminAccountId
        });
        if (!user) return res.status(400).send({success: false, message:"User Not Found. Please contact Flair Support"});

        const paymentMethods = await stripe.paymentMethods.list({
            customer: user.stripeCustomerId,
            type: 'card',
          });
      
          const formattedCards = paymentMethods.data.map((paymentMethod) => {
            return {
              lastFourDigits: paymentMethod.card.last4,
              brand: paymentMethod.card.brand,
              expMonth: paymentMethod.card.exp_month,
              expYear: paymentMethod.card.exp_year,
            };
          });

          res.send({
            data: formattedCards,
            success: true,
            message: "Customer Details"
        });
        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Customer Single Booking Detail
exports.customerSingleBookingDetail = async (req, res) => {
    try{
        if (!req.body.bookingId) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "customer") return res.status(400).send({success: false, message:"You do not have excess"});
        
        const booking = await BookingModel.findOne({
            _id: req.body.bookingId,
            customer: req.user._id,
            shopAdminAccountId: req.user.shopAdminAccountId
        });
        if (!booking) return res.status(400).send({success: false, message:"Booking Not Found. Please contact Flair Support"});


          res.send({
            data: booking,
            success: true,
            message: "Booking Details"
        });
        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Single Customer All Upcoming Bookings
exports.getUpcomingBookingsForCustomer = async (req, res) => {
    try {
        if (!req.body.page) return res.status(400).send({success: false, message:"Invalid Request"});
        
        const pageSize = 10; // Set the number of bookings per page
        const page = req.body.page || 1; // Get the current page from the query parameter

        const currentDate = moment().toDate();
        const upcomingBookings = await BookingModel.find({
        customer: req.user._id,
        $or: [
            { bookingDate: { $gt: currentDate } },
            {
            bookingDate: currentDate,
            'bookingTime.startTime': { $gte: moment().format('HH:mm') },
            },
        ],
        bookingStatus: { $in: ['pending', 'reserved'] },
        }).sort({ 'bookingTime.startTime': 1 }).skip((page - 1) * pageSize)
        .limit(pageSize);

      if (!upcomingBookings.length) return res.status(400).send({success: false, message:"There is no upcoming bookings"});

      res.send({
        data: upcomingBookings,
        success: true,
        message: "Upcoming Booking"
    });
    } catch (error) {
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
  };

//   Get Past Booking Of Single Customer
  exports.getPastBookingsForCustomer = async (req, res) => {
    try {
        if (!req.body.page) return res.status(400).send({success: false, message:"Invalid Request"});
        
        const pageSize = 10; // Set the number of bookings per page
        const page = req.body.page || 1; // Get the current page from the query parameter

      const currentDate = moment().toDate();

      const totalBookings = await BookingModel.countDocuments({
        customer: req.user._id,
        bookingDate: { $lt: currentDate },
        bookingStatus: { $in: ['completed', 'cancelled'] },
      });
  
      const pastBookings = await BookingModel.find({
        customer: req.user._id,
        bookingDate: { $lte: currentDate },
        bookingStatus: { $in: ['completed', 'cancelled'] }
      })
        .sort({ bookingDate: -1, 'bookingTime.startTime': -1 }).skip((page - 1) * pageSize)
        .limit(pageSize); // Sort by booking date and start time in descending order

        if (!pastBookings.length) return res.status(400).send({success: false, message:"There is no past bookings"});
  
      res.send({
        data: pastBookings,
        currentPage: page,
        totalPages: Math.ceil(totalBookings / pageSize),
        success: true,
        message: 'Past Bookings'
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        error,
        message: 'Server Internal Error'
      });
    }
  };