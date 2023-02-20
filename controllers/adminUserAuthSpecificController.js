const InitialOnbardingUsersMobileModel = require('../models/initialOnbardingUsersMobile')
const UserModel = require('../models/shopAdminSignup')
const SubAdminModel = require('../models/adminPanelSubAdminAccount');
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

// Update Email only for Main Admin & Sub Admin
exports.checkingPasswordForEmailUpdateAdmin = async function (req, res) {
    try {
        if (!req.body.password) return res.status(400).send({success: false, message:"Invalid Request"});
        const user = await UserModel.findOne({
            email: req.user.email,
        });
        if(!user){
            // Sub Admin
            const subUser = await SubAdminModel.findOne({
                email: req.user.email
            })
            if (!subUser) return res.status(400).send({success: false, message:"User Not Found"});   //Subadmin Also not Found here

            const passwordCompare = await bcrypt.compare(
                req.body.password,
                subUser.password
            );
            if (!passwordCompare) return res.status(400).send({success: false, message:"Credentials Incorrect"})
    
            res.json({
                success: true,
                message: "Password is Correct!"
            });
        }

        if(user){

        const passwordCompare = await bcrypt.compare(
            req.body.password,
            user.password
        );
        if (!passwordCompare) return res.status(400).send({success: false, message:"Credentials Incorrect"})

        res.json({
            success: true,
            message: "Password is Correct!"
        });
    }

    }catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
}

// Update Email for Admin and Sub Admin
exports.updateEmail = async function (req, res) {
    try {
        if (!req.body.newEmail) return res.status(400).send({success: false, message:"Invalid Request"});
        const user = await UserModel.findOne({
            email: req.user.email,
        });
        if(!user){
            // Sub Admin
            const subUser = await SubAdminModel.findOne({
                email: req.user.email
            })
            if (!subUser) return res.status(400).send({success: false, message:"User Not Found"});   //Subadmin Also not Found here
             
            const userEmailChecking = await UserModel.findOne({
                email: req.body.newEmail,
            });
            if (userEmailChecking) return res.status(400).send({success: false, message:"This Email is already Exist!"});           

            subUser.email = req.body.newEmail
        
            await subUser.save(async function (err, subUser) {
                if (err) {
                    if (err.name === 'MongoError' && err.code === 11000) {
                      // Duplicate username
                      return res.status(400).send({ succes: false, message: 'Some Data is Wrong or Email is already Exist' });
                    }
              
                    // Some other error
                    return res.status(400).send({success: false, message: err});
                  }
        
                res.send({
                    success: true,
                    message: "Email Updated!"
                });
            });
            
        }


        if(user){
        // Checking in Sub Admin that this emaill exist or not
        const subAdminEmailChecking = await SubAdminModel.findOne({
            email: req.body.newEmail
        })
        if (subAdminEmailChecking) return res.status(400).send({success: false, message:"This Email is already Exist!"});
         
        user.email = req.body.newEmail
        
        await user.save(async function (err, user) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'Some Data is Wrong or Email is already Exist' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: err});
              }
    
            res.send({
                success: true,
                message: "Email Updated!"
            });
        });
    }

    }catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
}

// Send OTP on Admin or Sub Admin phone Number in order to change mobile number
exports.sendOTPOnNumberForMobileNumberChange = async function (req, res) {
    try {
        const user = await UserModel.findOne({
            email: req.user.email,
        });
        if(!user){
            // Sub Admin
            const subUser = await SubAdminModel.findOne({
                email: req.user.email
            })
            if (!subUser) return res.status(400).send({success: false, message:"User Not Found"});   //Subadmin Also not Found here

            // Mobile Verification
            subUser.mobileVerifyToken = Math.floor(1000 + Math.random() * 9000);
                
            let futuretimeForExpiry = Date.now() + 1000 * 60;  // Add 1 min later time from current time

            let momentConversionForDb = moment(futuretimeForExpiry).format('YYYY.MM.DD HH:mm')
            subUser.mobileVerifyTokenExpires = momentConversionForDb;

            await subUser.save(async function (err, subUser) {
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
        }


        if(user){
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
    }

    }catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
}

// Verify Otp For Mobile Number Change
exports.verifyOtpForMobileNumberChange = async function (req, res) {
    try {
        if (!req.body.otp) return res.status(400).send({success: false, message:"Invalid Request"});
        const user = await UserModel.findOne({
            email: req.user.email,
            mobileVerifyToken: req.body.otp
        });
        if(!user){
            // Sub Admin
            const subUser = await SubAdminModel.findOne({
                email: req.user.email,
                mobileVerifyToken: req.body.otp
            })
            if (!subUser) return res.status(400).send({success: false, message:"User Not Found"});   //Subadmin Also not Found here
             
            if (subUser.mobileVerifyTokenExpires < Date.now()) return res.status(400).send({success: false, message:"Otp Expired"});

            res.send({
                success: true,
                message: "OTP Correct!"
            });
            
        }

        if(user){

        if (user.mobileVerifyTokenExpires < Date.now()) return res.status(400).send({success: false, message:"Otp Expired"});

        res.send({
            success: true,
            message: "OTP Correct!"
        });
    }

    }catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
}

// Update API For shop data which will use to add more data
exports.updateInitialShopDetails = async function (req, res) {
    try {
     
    const user = await UserModel.findOne({
        email: req.user.email,
    });
    // if (!user) return res.status(400).send({success: false, message:"User Not Found. Please contact Flair Support"});
    if(!user){
    // Sub Admin Updating Details
    const subUser = await SubAdminModel.findOne({
        email: req.user.email
    })
    if (!subUser) return res.status(400).send({success: false, message:"User Not Found"});   //Subadmin Also not Found here

    // Sub Admin Business Main account for bussiness update
    const businessUpdates = await UserModel.findOne({
        _id: subUser.mainAdminShopAccount,
    });
    
    if(req.body.firstName){
        subUser.firstName  = req.body.firstName        
    }
    if(req.body.lastName){
        subUser.lastName   = req.body.lastName     
    }
    if(req.body.mobile){
        const mobileCheckingSubAdmin = await SubAdminModel.findOne({
            mobile: req.body.mobile
        })
        if (mobileCheckingSubAdmin) return res.status(400).send({success: false, message:"Mobile already exist"});
        const mobileCheckingMainAdmin = await UserModel.findOne({
            mobile: req.body.mobile
        })
        if (mobileCheckingMainAdmin) return res.status(400).send({success: false, message:"Mobile already exist"}); 
        subUser.mobile   = req.body.mobile
    }
    if(req.body.adminUserLogo){
        subUser.adminUserLogo =  req.body.adminUserLogo 
    }
    if(req.body.userCurrentPassword && req.body.userNewPassword){
        const passwordCompare = await bcrypt.compare(
            req.body.userCurrentPassword,
            subUser.password
        );
        if (!passwordCompare) return res.status(400).send({success: false, message:"Password Incorrect"})
        const hash = await bcrypt.hash(req.body.userNewPassword, 10);
        subUser.password   = hash
    }

    // Bussiness Update Here
    if(req.body.businessLogo){
        businessUpdates.businessLogo = req.body.businessLogo
    }
    if(req.body.businessName){
        businessUpdates.businessName = req.body.businessName
    }
    if(req.body.businessCountry){
        businessUpdates.businessCountry = req.body.businessCountry
    }
    if(req.body.businessState){
        businessUpdates.businessState = req.body.businessState
    }
    if(req.body.businessCity){
        businessUpdates.businessCity = req.body.businessCity
    }
    if(req.body.businessAddress){
        businessUpdates.businessAddress = req.body.businessAddress
    }
    if(req.body.businessStaffSize){
        businessUpdates.businessStaffSize = req.body.businessStaffSize
    }
    if(req.body.businessWebsite){
        businessUpdates.businessWebsite = req.body.businessWebsite
    }
    if(req.body.businessGoogleReviews){
        businessUpdates.businessGoogleReviews = req.body.businessGoogleReviews
    }
    if(req.body.businessFacebookPage){
        businessUpdates.businessFacebookPage = req.body.businessFacebookPage
    }
    if(req.body.businessInstagramPage){
        businessUpdates.businessInstagramPage = req.body.businessInstagramPage
    }
    if(req.body.businessPricingPlan){
        businessUpdates.businessPricingPlan = req.body.businessPricingPlan
    }
    if(req.body.businessContacts){
        businessUpdates.businessContacts = req.body.businessContacts
    }
    if(req.body.businessAppLogo){
        businessUpdates.businessAppLogo = req.body.businessAppLogo
    }
    if(req.body.businessContractAccepted){
        businessUpdates.businessContractAccepted = req.body.businessContractAccepted
    }
    if(req.body.bookingPaymentWithCard){
        businessUpdates.bookingPaymentWithCard = req.body.bookingPaymentWithCard
    }
    if(req.body.businessStartingTheme){
        businessUpdates.businessStartingTheme = req.body.businessStartingTheme
    }
    if(req.body.businessSelectedTheme){
        businessUpdates.businessSelectedTheme = req.body.businessSelectedTheme
    }
    await subUser.save(async function (err, user) {
        if (err) {
            if (err.name === 'MongoError' && err.code === 11000) {
              // Duplicate username
              return res.status(400).send({ succes: false, message: 'Some Data is Wrong!' });
            }
      
            // Some other error
            return res.status(400).send({success: false, message: err});
          }

        businessUpdates.save();

        res.send({
            success: true,
            message: "Data Updated!"
        });
    });


    }


    if(user){
        
    if(req.body.firstName){
        user.firstName  = req.body.firstName        
    }
    if(req.body.lastName){
        user.lastName   = req.body.lastName     
    }
    if(req.body.mobile){
        const mobileCheckingSubAdmin = await SubAdminModel.findOne({
            mobile: req.body.mobile
        })
        if (mobileCheckingSubAdmin) return res.status(400).send({success: false, message:"Mobile already exist"});
        const mobileCheckingMainAdmin = await UserModel.findOne({
            mobile: req.body.mobile
        })
        if (mobileCheckingMainAdmin) return res.status(400).send({success: false, message:"Mobile already exist"}); 
        user.mobile   = req.body.mobile
    }
    if(req.body.adminUserLogo){
        user.adminUserLogo =  req.body.adminUserLogo 
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
    }  
    } catch (error) {
        console.log("errr",error)
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
            mobile: req.body.mobile
        })
        if (userMobileChecking) return res.status(400).send({success: false, message:"Mobile already exist"});
        // Sub Admin Checking as well
        const userSubAdminMobileChecking = await SubAdminModel.findOne({
            mobile: req.body.mobile
        })
        if (userSubAdminMobileChecking) return res.status(400).send({success: false, message:"Mobile already exist"});

        const user = await UserModel.findOne({
            _id: req.user._id,
            email: req.body.email
        })
        if (!user){
            const subUser = await SubAdminModel.findOne({
                mainAdminShopAccount: req.user._id,
                email: req.body.email
            })  
            if (!subUser) return res.status(400).send({success: false, message:"User Not Found"});
            
            // Mobile Verification
            subUser.mobileVerifyToken = Math.floor(1000 + Math.random() * 9000);
                
            let futuretimeForExpiry = Date.now() + 1000 * 60;  // Add 1 min later time from current time

            let momentConversionForDb = moment(futuretimeForExpiry).format('YYYY.MM.DD HH:mm')
            subUser.mobileVerifyTokenExpires = momentConversionForDb;

            subUser.mobile = req.body.mobile
                await subUser.save(async function (err, userData) {

                    // Twillio Send Otp

                    res.send({
                        success: true,
                        message: "Otp Send"
                    });
                })
        };

        if(user){
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
    }
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
        // if (!user) return res.status(400).send({success: false, message:"Sorry information is incorrect"});
        if (!user){
            // Sub User
            const subUser = await SubAdminModel.findOne({
                mobile: req.body.mobile,
                mainAdminShopAccount: req.user._id,
                email: req.body.email
            })  
            if (!subUser) return res.status(400).send({success: false, message:"Sorry information is incorrect"});

            // Mobile Verification
            subUser.mobileVerifyToken = Math.floor(1000 + Math.random() * 9000);
    
            let futuretimeForExpiry = Date.now() + 1000 * 60;  // Add 1 min later time from current time

            let momentConversionForDb = moment(futuretimeForExpiry).format('YYYY.MM.DD HH:mm')
            subUser.mobileVerifyTokenExpires = momentConversionForDb;

        await subUser.save(async function (err, userData) {

            // Twillio Send Otp

            res.send({
                success: true,
                message: "Otp Send"
            });
        })
        }

        if(user){
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
    }
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
        // if (!user) return res.status(400).send({success: false, message:"OTP Incorrect"});
        if (!user){
            // Sub Admin
            const subUser = await SubAdminModel.findOne({
                mobile: req.body.mobile,
                mainAdminShopAccount: req.user._id,
                mobileVerifyToken: req.body.otp,
                email: req.body.email
            })
            if (!subUser) return res.status(400).send({success: false, message:"OTP Incorrect"});

            if (subUser.mobileVerifyTokenExpires < Date.now()) return res.status(400).send({success: false, message:"Otp Expired"});

            subUser.isMobileVerified = true
            await subUser.save(async function (err, userData) {
    
                res.send({
                    success: true,
                    message: "Otp Verified!"
                });
            })            
        }

        if(user){
        if (user.mobileVerifyTokenExpires < Date.now()) return res.status(400).send({success: false, message:"Otp Expired"});

        user.isMobileVerified = true
        await user.save(async function (err, userData) {

            res.send({
                success: true,
                message: "Otp Verified!"
            });
        })
    }
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


    // Mobile Checking
    const userSubAdminMobileChecking = await SubAdminModel.findOne({
		mobile: req.body.mobile
	})
    if (userSubAdminMobileChecking) return res.status(400).send({success: false, message:"Mobile already exist"});

    const userAdminMobileChecking = await UserModel.findOne({
		mobile: req.body.mobile
	})
    if (userAdminMobileChecking) return res.status(400).send({success: false, message:"Mobile already exist"});

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

// Add Service Category
exports.addShopServiceCategory = async (req, res) => {
    try{
        if (!req.body.category) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});
       
        var shopServicesCategoryModel = new ShopServicesCategoryModel();
        shopServicesCategoryModel.shopAdminAccountId =  req.user._id
        shopServicesCategoryModel.category =  req.body.category
        shopServicesCategoryModel.categoryDescription =  req.body.categoryDescription

        await shopServicesCategoryModel.save(async function (err, shopServicesCategoryModel) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'Something Went Wrong. Contact Admin' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: err});
              }
            res.send({
                data: shopServicesCategoryModel,
                success: true,
                message: "Cateorgy Added!"
            });
        });
    }catch (error) {
        console.log('err',error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Add Services of the Shop
exports.addShopServices = async (req, res) => {
    try{
        if (!req.body.serviceCategoryId || !req.body.serviceName || !req.body.workingLocation.length) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});
       
        const shopServicesCategoryChecking = await ShopServicesCategoryModel.findOne({
            _id: req.body.serviceCategoryId,
            shopAdminAccountId: req.user._id
        })
        if (!shopServicesCategoryChecking) return res.status(400).send({success: false, message:"This Category Not Exist"}); 

        var shopServicesModel = new ShopServicesModel();
        shopServicesModel.shopAdminAccountId =  req.user._id
        shopServicesModel.serviceCategoryId =  req.body.serviceCategoryId
        shopServicesModel.serviceName =  req.body.serviceName
        shopServicesModel.serviceDescription =  req.body.serviceDescription
        shopServicesModel.serviceTags =  req.body.serviceTags
        shopServicesModel.workingLocation =  req.body.workingLocation

        await shopServicesModel.save(async function (err, shopServicesModel) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'Something Went Wrong. Contact Admin' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: err});
              }

              shopServicesCategoryChecking.shopServicesAttachWithThisCategory.push(shopServicesModel._id)
              shopServicesCategoryChecking.save();

            res.send({
                data: shopServicesModel,
                success: true,
                message: "Service Added!"
            });
        });
    }catch (error) {
        console.log('err',error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Update Shop Category
exports.updateShopServiceCategory = async (req, res) => {
    try{
        if (!req.body.categoryId) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});
       
        const shopServicesCategoryModel = await ShopServicesCategoryModel.findOne({
            _id: req.body.categoryId,
            shopAdminAccountId: req.user._id
        })
        if (!shopServicesCategoryModel) return res.status(400).send({success: false, message:"Category Not Found"}); 
        
        if(req.body.category){
            shopServicesCategoryModel.category = req.body.category
        }
        if(req.body.categoryDescription){
            shopServicesCategoryModel.categoryDescription = req.body.categoryDescription
        }

        await shopServicesCategoryModel.save(async function (err, shopServicesCategoryModel) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'Something Went Wrong. Contact Admin' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: err});
              }
            res.send({
                data: shopServicesCategoryModel,
                success: true,
                message: "Cateorgy Updated!"
            });
        });
    }catch (error) {
        console.log('err',error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Update Shop Services
exports.updateShopServices = async (req, res) => {
    try{
        if (!req.body.serviceId) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});
       
        const shopServicesModel = await ShopServicesModel.findOne({
            _id: req.body.serviceId,
            shopAdminAccountId: req.user._id
        })
        if (!shopServicesModel) return res.status(400).send({success: false, message:"Service Not Found"}); 
        
        if(req.body.serviceName){
            shopServicesModel.serviceName = req.body.serviceName
        }
        if(req.body.serviceDescription){
            shopServicesModel.serviceDescription = req.body.serviceDescription
        }
        if(req.body.serviceTags.length){
            shopServicesModel.serviceTags = req.body.serviceTags
        }
        if(req.body.workingLocation.length){
            shopServicesModel.workingLocation.push(serviceId)
        }

        await shopServicesModel.save(async function (err, shopServicesModel) {
            if (err) {
                if (err.name === 'MongoError' && err.code === 11000) {
                  // Duplicate username
                  return res.status(400).send({ succes: false, message: 'Something Went Wrong. Contact Admin' });
                }
          
                // Some other error
                return res.status(400).send({success: false, message: err});
              }
            res.send({
                data: shopServicesModel,
                success: true,
                message: "Service Updated!"
            });
        });
    }catch (error) {
        console.log('err',error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Get All single shops categories with it service included
exports.getAllCategoriesOfShopWithServices = async (req, res) => {
    try{
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});
       
        const shopServicesModel = await ShopServicesModel.find({
            shopAdminAccountId: req.user._id
        }).populate("serviceCategoryId").populate("workingLocation")
        if (!shopServicesModel.length) return res.status(400).send({success: false, message:"Categories and services Not Found"}); 
        

            res.send({
                data: shopServicesModel,
                success: true,
                message: "Services!"
            });
    }catch (error) {
        console.log('err',error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Get Single Services Based on Id
exports.getSingleServicesBasedOnId = async (req, res) => {
    try{
        if (!req.body.serviceId) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});
       
        const shopServicesModel = await ShopServicesModel.findOne({
            _id: req.body.serviceId
        }).populate("serviceCategoryId").populate("workingLocation")
        if (!shopServicesModel) return res.status(400).send({success: false, message:"Service Not Found"}); 
        

            res.send({
                data: shopServicesModel,
                success: true,
                message: "Service!"
            });
    }catch (error) {
        console.log('err',error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Get Single Category Based On Id
exports.getSingleCategoryBasedOnId = async (req, res) => {
    try{
        if (!req.body.categoryId) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});
       
        const shopServicesCategoryModel = await ShopServicesCategoryModel.findOne({
            _id: req.body.categoryId
        }).populate("shopServicesAttachWithThisCategory")
        if (!shopServicesCategoryModel) return res.status(400).send({success: false, message:"Category Not Found"}); 
        

            res.send({
                data: shopServicesCategoryModel,
                success: true,
                message: "Category!"
            });
    }catch (error) {
        console.log('err',error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Get All Ctegories of Shop List
exports.getAllCategoriesOfShopList = async (req, res) => {
    try{
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});
       
        const shopServicesCategoryModel = await ShopServicesCategoryModel.find({
            shopAdminAccountId: req.user._id
        }).populate("shopServicesAttachWithThisCategory")
        if (!shopServicesCategoryModel.length) return res.status(400).send({success: false, message:"Categories and services Not Found"}); 
        

            res.send({
                data: shopServicesCategoryModel,
                success: true,
                message: "Categories!"
            });
    }catch (error) {
        console.log('err',error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Delete Single Services of Shop
// Get All Ctegories of Shop List
exports.deleteSingleServiceOfShop = async (req, res) => {
    try{
        if (!req.body.serviceId) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});
       
        ShopServicesModel.findByIdAndDelete({_id: req.body.serviceId}, function(err, result) {
            if (err) {
                console.log("Error deleting document: ", err);
                res.send({
                    success: false,
                    message: "Error deleting document!"
                });
                
            } else {
                if (result) {
                    res.send({
                        data: result,
                        success: false,
                        message: "Error deleting document!"
                    });
                } else {
                    console.log("Document with ID " + serviceId + " not found");
                    res.send({
                        success: false,
                        message: "Document not found"
                    });
                }
            }
        });
    }catch (error) {
        console.log('err',error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};