const UserModel = require('../models/shopAdminSignup');
const UserFreeTimeModel = require('../models/userFreeTime');
const InitialOnbardingUsersMobileModel = require('../models/initialOnbardingUsersMobile')
const SubAdminModel = require('../models/adminPanelSubAdminAccount');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const bcrypt    = require('bcrypt');
const stripe    = require("stripe")(process.env.STRIPE_SECRET_KEY)
const jwt 	    = require('jsonwebtoken');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

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

// Signup for the Admin of shop
exports.signupAdminOfShop = async function (req, res) {
    try {
    if (!req.body.email) return res.status(400).send({success: false, message:"Invalid Request"});
    
    var user = new UserModel();
    user.email =  req.body.email
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
            

            res.send({
                data: user,
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


// Update User
exports.updateAdminUser = async function (req, res) {
    if (!req.body.userId) return res.status(400).send({success: false, message:"Invalid Request"});

    try{
        const user = await UserModel.findOne({
            _id: req.body.userId,
        });
        if (!user) return res.status(400).send({success: false, message:"User Not Found"});
        if(req.body.profilepic){
            user.profilepic =  req.body.profilepic
        }
        if(req.body.notificationToken){
            user.notificationToken =  req.body.notificationToken
        }
        if(req.body.dob){
            user.dob =  req.body.dob
        }
        if(req.body.email){
            user.email =  req.body.email
        }
        if(req.body.iosApn){
            user.iosApn =  req.body.iosApn
        }
        if(req.body.gender){
            user.gender =  req.body.gender
        }
        if(req.body.name){
            user.name =  req.body.name
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

// Get Single User detail
exports.getSingleUserProfileDetail = async function (req, res) {
    try{
        if (!req.body.userId) return res.status(400).send({success: false, message:"Invalid Request"});
    
    let user = await User.findOne({_id: req.body.userId}).lean()
    if (!user) return res.status(400).send({success: false, message:"Not Found"});
        
    delete user.password
    delete user.resetPasswordToken
    delete user.resetPasswordExpires
        res.json({
            success: true,
            message: "User Detail",
            data: user
        });
    }catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
}

// V1 API IT WILL GET ALL USERS DATA IN THE APP TO MAKE FRIEND IN V1
exports.getAllUsers = async function (req, res) {
    try{
        if (!req.body.page) return res.status(400).send({success: false, message:"Invalid Request"});
        let maxDocument = 10;
        let pagesSkip = 10 * req.body.page;

    let user = await User.find({}).skip(parseFloat(pagesSkip))
    .limit(maxDocument)
    if (!user) return res.status(400).send({success: false, message:"Not Found"});
        
    
        res.json({
            success: true,
            message: "User Detail",
            data: user
        });
    }catch (error) {
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }
}

// Forget Password
exports.recover = async function (req, res) {
    if (!req.body.mobile) return res.status(400).send({success: false, message:"Invalid Request"});

    const user = await User.findOne({
		mobile: req.body.mobile
	});
    if (!user) return res.status(400).send({success: false, message:"Mobile Not Found"});
   //Generate and set password reset token
   user.resetPasswordToken = Math.floor(100000 + Math.random() * 900000);
   user.resetPasswordExpires = Date.now() + 3600000; //expires in an hour
   try{
     await user.save(async function (err, user){
         
        // let link = "http://" + req.headers.host + "/api/auth/reset/" + user.resetPasswordToken;
        // const mailOptions = {
        //     to: user.email,
        //     from: process.env.FROM_EMAIL,
        //     subject: "Password change request",
        //     text: `Hi ${user.userName} \n 
        // Here is your OTP Code  ${user.resetPasswordToken} to reset your password. \n\n 
        // If you did not request this, please ignore this text and your password will remain unchanged.\n`,
        // };
        // sgMail.send(mailOptions, (error, result) => {
        //     if (error) return res.status(500).json({message: error.message});

        //     res.status(200).json({success: true, message: 'A reset text has been sent to ' + user.email + '.'});
        // });
    
    //   console.log("USERRRR", user, err)

    //   Sms Sending
    let smsSending = await client.messages
  .create({
    body: `Here is your OTP Code  ${user.resetPasswordToken} to reset your password.If you did not request this, please ignore this text and your password will remain unchanged`,
    to: user.mobile, // Text this number
    from: '+12512603505', // From a valid Twilio number
  })
// console.log("Logs", smsSending.logs)
res.status(200).json({success: true, data:'Code will be sent only if the number is exist in our records'});

     })
   }catch (error) {
       console.log("eee",error)
    res.send({
        success: false, message:"Server Internal Error"
    });
    }

};

// Check OTP Code & Change password
exports.resetPassword = async function (req, res) {
    if (!req.body.mobile || !req.body.token || !req.body.password) return res.status(400).send({success: false, message:"Invalid Request"});

    const user = await User.findOne({
        mobile: req.body.mobile,
		resetPasswordToken: req.body.token, 
        resetPasswordExpires: {$gt: Date.now()}
	});
    if (!user) return res.status(400).send({success: false, message:"Password reset token is invalid or has expired."});

     //Set the new password
     const hash = await bcrypt.hash(req.body.password, 10);
     user.password   = hash
     user.resetPasswordToken = undefined;
     user.resetPasswordExpires = undefined;

     try {
        await user.save(async function (err, user) {
            if (err) return res.status(400).send({success: false, message: err});

            // send email
            // const mailOptions = {
            //     to: user.email,
            //     from: process.env.FROM_EMAIL,
            //     subject: "Your password has been changed",
            //     text: `Hi ${user.userName} \n 
            //     This is a confirmation that the password for your account ${user.email} has just been changed.\n`
            // };

            // sgMail.send(mailOptions, (error, result) => {
            //     if (error) return res.status(500).json({message: error.message});

            // Sms
            let smsSending = await client.messages
            .create({
              body: `Hey your password has been changed of ${user.mobile} in the velia. If you didn't changed this then contact support`,
              to: user.mobile, // Text this number
              from: '+12512603505', // From a valid Twilio number
            })
            
            res.send({
                success: true,
                message: "Password Changed"
            // });

        })
        });        
    } catch (error) {
        res.send({
            success: false, message:"Server Internal Error"
        });
    }
}

// User FeedBack API
exports.appFeedback = async function (req, res) {
    if (!req.body.userId || !req.body.name || !req.body.userEmail || !req.body.userFeedback) return res.status(400).send({success: false, message:"Invalid Request"});

    try{
    const user = await User.findOne({
		_id: req.body.userId
	});
    if (!user) return res.status(400).send({success: false, message:"User Not Found"});
      let userSubjectName = `${req.body.name} Provided his Feedback!`
        const mailOptions = {
            to: "bgantt.mylearn@gmail.com",
            from: process.env.FROM_EMAIL,
            subject: userSubjectName,
            text: `Hi  \n 
            ${req.body.name} send us Feedback \n\n\n 
            ${req.body.userFeedback}
        Here is user Email  ${req.body.userEmail} . \n\n 
        Regards.\n
        Save a Plate
        `,
        };
        sgMail.send(mailOptions, (error, result) => {
            if (error) return res.status(500).json({message: error.message, error:error});

            res.status(200).json({success: true, message: 'A Feedback email has been sent'});
        });
   }catch (error) {
    res.status(500).send({
        success: false, message:"Server Internal Error"
    });
}

};


// APP PLATE REPORT 
exports.reportPlate = async function (req, res) {
    if (!req.body.userId || !req.body.name || !req.body.userEmail || !req.body.dishName || !req.body.plateId || !req.body.kitchenId) return res.status(400).send({success: false, message:"Invalid Request"});

    try{
    const user = await User.findOne({
		_id: req.body.userId
	});
    if (!user) return res.status(400).send({success: false, message:"User Not Found"});
      let userSubjectName = `${req.body.name} has reported ${req.body.dishName} Plate`
        const mailOptions = {
            to: "bgantt.mylearn@gmail.com",
            from: process.env.FROM_EMAIL,
            subject: userSubjectName,
            text: `Hi  \n 
            ${req.body.name} has reported for the ${req.body.dishName} plate with his Id ${req.body.plateId} , His kitchen Id is ${req.body.kitchenId} \n\n\n 
            ${req.body.userFeedback? req.body.userFeedback : "User has not provided any detail report feedback"}
        Here is user Email  ${req.body.userEmail} . \n\n 
        Regards.\n
        Save a Plate
        `,
        };
        sgMail.send(mailOptions, (error, result) => {
            if (error) return res.status(500).json({message: error.message, error:error});

            res.status(200).json({success: true, message: 'Report email has been sent'});
        });
   }catch (error) {
    res.status(500).send({
        success: false, message:"Server Internal Error"
    });
}

};

// Report Chat
exports.reportChat = async function (req, res) {
    if (!req.body.userId || !req.body.name || !req.body.userEmail || !req.body.channel) return res.status(400).send({success: false, message:"Invalid Request"});

    try{
    const user = await User.findOne({
		_id: req.body.userId
	});
    if (!user) return res.status(400).send({success: false, message:"User Not Found"});
      let userSubjectName = `${req.body.name} has reported his chat`
        const mailOptions = {
            to: "bgantt.mylearn@gmail.com",
            from: process.env.FROM_EMAIL,
            subject: userSubjectName,
            text: `Hi  \n 
            ${req.body.name} has reported for the chat, Their Channel Id is ${req.body.channel} \n\n\n 
            ${req.body.userFeedback? req.body.userFeedback : "User has not provided any detail report feedback"}
        Here is user Email  ${req.body.userEmail} . \n\n 
        Regards.\n
        Save a Plate
        `,
        };
        sgMail.send(mailOptions, (error, result) => {
            if (error) return res.status(500).json({message: error.message, error:error});

            res.status(200).json({success: true, message: 'Report email has been sent'});
        });
   }catch (error) {
    res.status(500).send({
        success: false, message:"Server Internal Error"
    });
}

};


// Apple Signup
exports.userLogout = async function (req, res) {
    if (!req.body.userId) return res.status(400).send({success: false, message:"Invalid Request"});
    try{
    const user = await User.findOne({
        _id: req.body.userId,
    });
    if (!user) return res.status(400).send({success: false, message:"User Not Found"});
    user.notificationToken =  ""
    await user.save(function (err, user) {
        if (err) return res.status(400).send({success: false, message: err});
        
        res.json({
            success: true,
            message: "Token Deleted!",
        });
    })
    }catch (error) {
        console.log(error)
        res.status(500).send({
            success: false, message:"Server Internal Error"
        });
    }

}