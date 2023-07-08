const UserModel = require('../models/shopAdminSignup')
const SubAdminModel = require('../models/adminPanelSubAdminAccount');
const ShopServicesCategoryModel = require('../models/shopServicesCatgories');
const ShopServicesModel = require('../models/shopServices');
const AutomatedCampaigns = require('../models/automatedCmpaigns');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const bcrypt    = require('bcrypt');
const stripe    = require("stripe")(process.env.STRIPE_SECRET_KEY)
const jwt 	    = require('jsonwebtoken');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const moment = require('moment-timezone');


// AUTOMATED CAMPAIGNS

// Create Birthday Campaign -- Automated
exports.createAutomatedBirthdayCampaigns = async (req, res) => {
    try{
        if (!req.body.isContentHeaderImgEnable || !req.body.contentHeadline || !req.body.contentBody || !req.body.isContentBtnEnable || !req.body.contentStylingBackground || !req.body.contentStylingBtnColor || !req.body.contentStylingBtnTextColor || !req.body.contentStylingBodyText || !req.body.contentSylingHeadlineText
            || !req.body.discountIsInPercentage || !req.body.discount || !req.body.maxAppointmentBookedByUser || !req.body.offerValidDays || !req.body.BirthdaySendToClientNotificationPeriod || !req.body.selectedServices || !req.body.selectedBarbers || !req.body.selectedBranches || !req.body.isCampaignActive) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});

        // Check iscontentheaderimgenable
        if(req.body.isContentHeaderImgEnable){
            if(!req.body.contentHeaderImage) return res.status(400).send({success: false, message:"Please provide header image"});
        }

         // Check isContentBtnEnable
        if(req.body.isContentBtnEnable){
            if(!req.body.btnText) return res.status(400).send({success: false, message:"Please provide button text"});
            if(!req.body.btnLink) return res.status(400).send({success: false, message:"Please provide button link"});
        }   

        // Check that birthday campaign is already exist or not
        const automatedCampaignsChecking = await AutomatedCampaigns.findOne({
            shopAdminAccountId: req.user._id,
            campaignType: 'birthday'
        })
        if (automatedCampaignsChecking) return res.status(400).send({success: false, message:"Birthday campaign already exist. Please edit the current one or delete and restart it again"}); 
        
        const utcDate = moment.utc();

        var automatedCampaigns = new AutomatedCampaigns();
        automatedCampaigns.shopAdminAccountId =  req.user._id
        automatedCampaigns.campaignType =  'birthday'
        automatedCampaigns.contentHeaderImage =  req.body.contentHeaderImage
        automatedCampaigns.contentHeadline =  req.body.contentHeadline
        automatedCampaigns.contentBody =  req.body.contentBody
        automatedCampaigns.btnText =  req.body.btnText
        automatedCampaigns.btnLink =  req.body.btnLink
        automatedCampaigns.contentStylingBackground =  req.body.contentStylingBackground
        automatedCampaigns.contentStylingBtnColor =  req.body.contentStylingBtnColor
        automatedCampaigns.contentStylingBtnTextColor =  req.body.contentStylingBtnTextColor
        automatedCampaigns.contentStylingBodyText =  req.body.contentStylingBodyText
        automatedCampaigns.contentSylingHeadlineText =  req.body.contentSylingHeadlineText
        automatedCampaigns.discountIsInPercentage =  req.body.discountIsInPercentage
        automatedCampaigns.discount =  req.body.discount
        automatedCampaigns.maxAppointmentBookedByUser =  req.body.maxAppointmentBookedByUser
        automatedCampaigns.offerValidDays =  req.body.offerValidDays
        automatedCampaigns.BirthdaySendToClientNotificationPeriod =  req.body.BirthdaySendToClientNotificationPeriod
        automatedCampaigns.selectedServices =  req.body.selectedServices
        automatedCampaigns.selectedBarbers =  req.body.selectedBarbers
        automatedCampaigns.selectedBranches =  req.body.selectedBranches
        automatedCampaigns.isCampaignActive =  req.body.isCampaignActive
        automatedCampaigns.campaignCreatedDate =  utcDate.toDate();

        automatedCampaigns.save(async function (err, data) {
            if (err) {
              if (err.name === 'MongoError' && err.code === 11000) {
                // Duplicate username
                return res.status(400).send({ succes: false, message: 'Looks Like this campaign already exist!' });
              }
        
              // Some other error
              return res.status(400).send({success: false, err ,message:"Something Went Wrong!"});
            }
        
              res.json({
                  success: true,
                  message: "Sucessfully Added!",
                  data: data
              });
          });

        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Update Existing Birthday Campaign
exports.updateAutomatedBirthdayCampaigns = async (req, res) => {
    try{
        if (!req.body.birthdayCampaignId) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});

        // Check that birthday campaign is already exist or not
        const automatedCampaigns = await AutomatedCampaigns.findOne({
            shopAdminAccountId: req.user._id,
            campaignType: 'birthday',
            _id: req.body.birthdayCampaignId
        })
        if (!automatedCampaigns) return res.status(400).send({success: false, message:"Birthday campaign not found"}); 
        
        if(req.body.contentHeaderImage){
            automatedCampaigns.contentHeaderImage =  req.body.contentHeaderImage
        }
        if(req.body.contentHeadline){
            automatedCampaigns.contentHeadline =  req.body.contentHeadline
        }
        if(req.body.contentBody){
            automatedCampaigns.contentBody =  req.body.contentBody
        }
        if(req.body.btnText){
            automatedCampaigns.btnText =  req.body.btnText
        }
        if(req.body.btnLink){
            automatedCampaigns.btnLink =  req.body.btnLink
        }
        if(req.body.contentStylingBackground){
            automatedCampaigns.contentStylingBackground =  req.body.contentStylingBackground
        }
        if(req.body.contentStylingBtnColor){
            automatedCampaigns.contentStylingBtnColor =  req.body.contentStylingBtnColor
        }
        if(req.body.contentStylingBtnTextColor){
            automatedCampaigns.contentStylingBtnTextColor =  req.body.contentStylingBtnTextColor
        }
        if(req.body.contentStylingBodyText){
            automatedCampaigns.contentStylingBodyText =  req.body.contentStylingBodyText
        }
        if(req.body.contentSylingHeadlineText){
            automatedCampaigns.contentSylingHeadlineText =  req.body.contentSylingHeadlineText
        }
        if(req.body.discountIsInPercentage){
            automatedCampaigns.discountIsInPercentage =  req.body.discountIsInPercentage
        }
        if(req.body.discount){
            automatedCampaigns.discount =  req.body.discount
        }
        if(req.body.maxAppointmentBookedByUser){
            automatedCampaigns.maxAppointmentBookedByUser =  req.body.maxAppointmentBookedByUser
        }
        if(req.body.offerValidDays){
            automatedCampaigns.offerValidDays =  req.body.offerValidDays
        }
        if(req.body.BirthdaySendToClientNotificationPeriod){
            automatedCampaigns.BirthdaySendToClientNotificationPeriod =  req.body.BirthdaySendToClientNotificationPeriod
        }
        if(req.body.selectedServices){
            automatedCampaigns.selectedServices =  req.body.selectedServices
        }
        if(req.body.selectedBarbers){
            automatedCampaigns.selectedBarbers =  req.body.selectedBarbers
        }
        if(req.body.selectedBranches){
            automatedCampaigns.selectedBranches =  req.body.selectedBranches
        }
        if(req.body.isCampaignActive){
            automatedCampaigns.isCampaignActive =  req.body.isCampaignActive
        }

        automatedCampaigns.save(async function (err, data) {
            if (err) {
              if (err.name === 'MongoError' && err.code === 11000) {
                // Duplicate username
                return res.status(400).send({ succes: false, message: 'Looks Like this campaign already exist!' });
              }
        
              // Some other error
              return res.status(400).send({success: false, err ,message:"Something Went Wrong!"});
            }
        
              res.json({
                  success: true,
                  message: "Sucessfully Updated!",
                  data: data
              });
          });

        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Create Automated Campign for Promote Reviews
exports.createAutomatedPromoteReviewCampaigns = async (req, res) => {
    try{
        if (!req.body.isContentHeaderImgEnable || !req.body.contentHeadline || !req.body.contentBody || !req.body.contentStylingBackground || !req.body.contentStylingBtnColor || !req.body.contentStylingBtnTextColor || !req.body.contentStylingBodyText || !req.body.contentSylingHeadlineText
             || !req.body.promoteReviewSendToClientNotificationPeriod || !req.body.selectedServices || !req.body.selectedBarbers || !req.body.selectedBranches || !req.body.isCampaignActive) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});

        // Check iscontentheaderimgenable
        if(req.body.isContentHeaderImgEnable){
            if(!req.body.contentHeaderImage) return res.status(400).send({success: false, message:"Please provide header image"});
        }

        // Check that birthday campaign is already exist or not
        const automatedCampaignsChecking = await AutomatedCampaigns.findOne({
            shopAdminAccountId: req.user._id,
            campaignType: 'promotereviews'
        })
        if (automatedCampaignsChecking) return res.status(400).send({success: false, message:"Promote reviews campaign already exist. Please edit the current one or delete and restart it again"}); 
        
        const utcDate = moment.utc();

        var automatedCampaigns = new AutomatedCampaigns();
        automatedCampaigns.shopAdminAccountId =  req.user._id
        automatedCampaigns.campaignType =  'promotereviews'
        automatedCampaigns.contentHeaderImage =  req.body.contentHeaderImage
        automatedCampaigns.contentHeadline =  req.body.contentHeadline
        automatedCampaigns.contentBody =  req.body.contentBody
        automatedCampaigns.googleLink =  req.body.googleLink
        automatedCampaigns.facebookLink =  req.body.facebookLink
        automatedCampaigns.yelpLink =  req.body.yelpLink
        automatedCampaigns.contentStylingBackground =  req.body.contentStylingBackground
        automatedCampaigns.contentStylingBtnColor =  req.body.contentStylingBtnColor
        automatedCampaigns.contentStylingBtnTextColor =  req.body.contentStylingBtnTextColor
        automatedCampaigns.contentStylingBodyText =  req.body.contentStylingBodyText
        automatedCampaigns.contentSylingHeadlineText =  req.body.contentSylingHeadlineText
        automatedCampaigns.promoteReviewSendToClientNotificationPeriod =  req.body.promoteReviewSendToClientNotificationPeriod  // We need top send notification based on appointments they have completed
        automatedCampaigns.selectedServices =  req.body.selectedServices
        automatedCampaigns.selectedBarbers =  req.body.selectedBarbers
        automatedCampaigns.selectedBranches =  req.body.selectedBranches
        automatedCampaigns.isCampaignActive =  req.body.isCampaignActive
        automatedCampaigns.campaignCreatedDate =  utcDate.toDate();

        automatedCampaigns.save(async function (err, data) {
            if (err) {
              if (err.name === 'MongoError' && err.code === 11000) {
                // Duplicate username
                return res.status(400).send({ succes: false, message: 'Looks Like this campaign already exist!' });
              }
        
              // Some other error
              return res.status(400).send({success: false, err ,message:"Something Went Wrong!"});
            }
        
              res.json({
                  success: true,
                  message: "Sucessfully Added!",
                  data: data
              });
          });

        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Update Autmated Campign for Promote Reviews
exports.updateAutomatedPromoteReviewCampaigns = async (req, res) => {
    try{
        if (!req.body.promoteReviewCampaignId) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});

        // Check that birthday campaign is already exist or not
        const automatedCampaigns = await AutomatedCampaigns.findOne({
            shopAdminAccountId: req.user._id,
            campaignType: 'promotereviews',
            _id: req.body.promoteReviewCampaignId
        })
        if (!automatedCampaigns) return res.status(400).send({success: false, message:"Promote reviews campaign not found"}); 
        
        if(req.body.contentHeaderImage){
            automatedCampaigns.contentHeaderImage =  req.body.contentHeaderImage
        }
        if(req.body.contentHeadline){
            automatedCampaigns.contentHeadline =  req.body.contentHeadline
        }
        if(req.body.contentBody){
            automatedCampaigns.contentBody =  req.body.contentBody
        }
        if(req.body.googleLink){
            automatedCampaigns.googleLink =  req.body.googleLink
        }
        if(req.body.facebookLink){
            automatedCampaigns.facebookLink =  req.body.facebookLink
        }
        if(req.body.yelpLink){
            automatedCampaigns.yelpLink =  req.body.yelpLink
        }
        if(req.body.contentStylingBackground){
            automatedCampaigns.contentStylingBackground =  req.body.contentStylingBackground
        }
        if(req.body.contentStylingBtnColor){
            automatedCampaigns.contentStylingBtnColor =  req.body.contentStylingBtnColor
        }
        if(req.body.contentStylingBtnTextColor){
            automatedCampaigns.contentStylingBtnTextColor =  req.body.contentStylingBtnTextColor
        }
        if(req.body.contentStylingBodyText){
            automatedCampaigns.contentStylingBodyText =  req.body.contentStylingBodyText
        }
        if(req.body.contentSylingHeadlineText){
            automatedCampaigns.contentSylingHeadlineText =  req.body.contentSylingHeadlineText
        }
        if(req.body.promoteReviewSendToClientNotificationPeriod){
            automatedCampaigns.promoteReviewSendToClientNotificationPeriod =  req.body.promoteReviewSendToClientNotificationPeriod
        }
        if(req.body.selectedServices){
            automatedCampaigns.selectedServices =  req.body.selectedServices
        }
        if(req.body.selectedBarbers){
            automatedCampaigns.selectedBarbers =  req.body.selectedBarbers
        }
        if(req.body.selectedBranches){
            automatedCampaigns.selectedBranches =  req.body.selectedBranches
        }
        if(req.body.isCampaignActive){
            automatedCampaigns.isCampaignActive =  req.body.isCampaignActive
        }

        automatedCampaigns.save(async function (err, data) {
            if (err) {
              if (err.name === 'MongoError' && err.code === 11000) {
                // Duplicate username
                return res.status(400).send({ succes: false, message: 'Looks Like this campaign already exist!' });
              }
        
              // Some other error
              return res.status(400).send({success: false, err ,message:"Something Went Wrong!"});
            }
        
              res.json({
                  success: true,
                  message: "Sucessfully Updated!",
                  data: data
              });
          });

        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Create Automated Campaign for New Clients
exports.createAutomatedNewClientsCampaigns = async (req, res) => {
    try{
        if (!req.body.isContentHeaderImgEnable || !req.body.contentHeadline || !req.body.contentBody || !req.body.isContentBtnEnable || !req.body.contentStylingBackground || !req.body.contentStylingBtnColor || !req.body.contentStylingBtnTextColor || !req.body.contentStylingBodyText || !req.body.contentSylingHeadlineText
             || !req.body.isDiscountEnable || !req.body.newClientSendToClientNotificationPeriod || !req.body.selectedServices || !req.body.selectedBarbers || !req.body.selectedBranches || !req.body.isCampaignActive) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});

        // Check iscontentheaderimgenable
        if(req.body.isContentHeaderImgEnable){
            if(!req.body.contentHeaderImage) return res.status(400).send({success: false, message:"Please provide header image"});
        }

         // Check isContentBtnEnable
        if(req.body.isContentBtnEnable){
            if(!req.body.btnText) return res.status(400).send({success: false, message:"Please provide button text"});
            if(!req.body.btnLink) return res.status(400).send({success: false, message:"Please provide button link"});
        }   

        // Is discount is true than other discount info is required
        if(req.body.isDiscountEnable){
            if(!req.body.discountIsInPercentage || !req.body.discount || !req.body.maxAppointmentBookedByUser || !req.body.offerValidDays) return res.status(400).send({success: false, message:"Please provide discount data"});
        }

        // Check that birthday campaign is already exist or not
        const automatedCampaignsChecking = await AutomatedCampaigns.findOne({
            shopAdminAccountId: req.user._id,
            campaignType: 'newclients'
        })
        if (automatedCampaignsChecking) return res.status(400).send({success: false, message:"New Clients campaign already exist. Please edit the current one or delete and restart it again"}); 
        
        const utcDate = moment.utc();

        var automatedCampaigns = new AutomatedCampaigns();
        automatedCampaigns.shopAdminAccountId =  req.user._id
        automatedCampaigns.campaignType =  'newclients'
        automatedCampaigns.contentHeaderImage =  req.body.contentHeaderImage
        automatedCampaigns.contentHeadline =  req.body.contentHeadline
        automatedCampaigns.contentBody =  req.body.contentBody
        automatedCampaigns.btnText =  req.body.btnText
        automatedCampaigns.btnLink =  req.body.btnLink
        automatedCampaigns.contentStylingBackground =  req.body.contentStylingBackground
        automatedCampaigns.contentStylingBtnColor =  req.body.contentStylingBtnColor
        automatedCampaigns.contentStylingBtnTextColor =  req.body.contentStylingBtnTextColor
        automatedCampaigns.contentStylingBodyText =  req.body.contentStylingBodyText
        automatedCampaigns.contentSylingHeadlineText =  req.body.contentSylingHeadlineText
        automatedCampaigns.isDiscountEnable =  req.body.isDiscountEnable
        automatedCampaigns.discountIsInPercentage =  req.body.discountIsInPercentage
        automatedCampaigns.discount =  req.body.discount
        automatedCampaigns.maxAppointmentBookedByUser =  req.body.maxAppointmentBookedByUser
        automatedCampaigns.offerValidDays =  req.body.offerValidDays
        automatedCampaigns.newClientSendToClientNotificationPeriod =  req.body.newClientSendToClientNotificationPeriod
        automatedCampaigns.selectedServices =  req.body.selectedServices
        automatedCampaigns.selectedBarbers =  req.body.selectedBarbers
        automatedCampaigns.selectedBranches =  req.body.selectedBranches
        automatedCampaigns.isCampaignActive =  req.body.isCampaignActive
        automatedCampaigns.campaignCreatedDate =  utcDate.toDate();

        automatedCampaigns.save(async function (err, data) {
            if (err) {
              if (err.name === 'MongoError' && err.code === 11000) {
                // Duplicate username
                return res.status(400).send({ succes: false, message: 'Looks Like this campaign already exist!' });
              }
        
              // Some other error
              return res.status(400).send({success: false, err ,message:"Something Went Wrong!"});
            }
        
              res.json({
                  success: true,
                  message: "Sucessfully Added!",
                  data: data
              });
          });

        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Update Automated New Client Campaign
exports.updateAutomatednewClientsCampaigns = async (req, res) => {
    try{
        if (!req.body.newClientsCampaignId) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});

        // Check that birthday campaign is already exist or not
        const automatedCampaigns = await AutomatedCampaigns.findOne({
            shopAdminAccountId: req.user._id,
            campaignType: 'newclients',
            _id: req.body.newClientsCampaignId
        })
        if (!automatedCampaigns) return res.status(400).send({success: false, message:"New clients campaign not found"}); 
        
        if(req.body.contentHeaderImage){
            automatedCampaigns.contentHeaderImage =  req.body.contentHeaderImage
        }
        if(req.body.contentHeadline){
            automatedCampaigns.contentHeadline =  req.body.contentHeadline
        }
        if(req.body.contentBody){
            automatedCampaigns.contentBody =  req.body.contentBody
        }
        if(req.body.btnText){
            automatedCampaigns.btnText =  req.body.btnText
        }
        if(req.body.btnLink){
            automatedCampaigns.btnLink =  req.body.btnLink
        }
        if(req.body.contentStylingBackground){
            automatedCampaigns.contentStylingBackground =  req.body.contentStylingBackground
        }
        if(req.body.contentStylingBtnColor){
            automatedCampaigns.contentStylingBtnColor =  req.body.contentStylingBtnColor
        }
        if(req.body.contentStylingBtnTextColor){
            automatedCampaigns.contentStylingBtnTextColor =  req.body.contentStylingBtnTextColor
        }
        if(req.body.contentStylingBodyText){
            automatedCampaigns.contentStylingBodyText =  req.body.contentStylingBodyText
        }
        if(req.body.contentSylingHeadlineText){
            automatedCampaigns.contentSylingHeadlineText =  req.body.contentSylingHeadlineText
        }
        if(req.body.isDiscountEnable){
            automatedCampaigns.isDiscountEnable =  req.body.isDiscountEnable
        }
        if(req.body.discountIsInPercentage){
            automatedCampaigns.discountIsInPercentage =  req.body.discountIsInPercentage
        }
        if(req.body.discount){
            automatedCampaigns.discount =  req.body.discount
        }
        if(req.body.maxAppointmentBookedByUser){
            automatedCampaigns.maxAppointmentBookedByUser =  req.body.maxAppointmentBookedByUser
        }
        if(req.body.offerValidDays){
            automatedCampaigns.offerValidDays =  req.body.offerValidDays
        }
        if(req.body.newClientSendToClientNotificationPeriod){
            automatedCampaigns.newClientSendToClientNotificationPeriod =  req.body.newClientSendToClientNotificationPeriod
        }
        if(req.body.selectedServices){
            automatedCampaigns.selectedServices =  req.body.selectedServices
        }
        if(req.body.selectedBarbers){
            automatedCampaigns.selectedBarbers =  req.body.selectedBarbers
        }
        if(req.body.selectedBranches){
            automatedCampaigns.selectedBranches =  req.body.selectedBranches
        }
        if(req.body.isCampaignActive){
            automatedCampaigns.isCampaignActive =  req.body.isCampaignActive
        }

        automatedCampaigns.save(async function (err, data) {
            if (err) {
              if (err.name === 'MongoError' && err.code === 11000) {
                // Duplicate username
                return res.status(400).send({ succes: false, message: 'Looks Like this campaign already exist!' });
              }
        
              // Some other error
              return res.status(400).send({success: false, err ,message:"Something Went Wrong!"});
            }
        
              res.json({
                  success: true,
                  message: "Sucessfully Updated!",
                  data: data
              });
          });

        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Create Automated Reward Regular Campaign
exports.createAutomatedRewardRegularCampaigns = async (req, res) => {
    try{
        if (!req.body.isContentHeaderImgEnable || !req.body.contentHeadline || !req.body.contentBody || !req.body.isContentBtnEnable || !req.body.contentStylingBackground || !req.body.contentStylingBtnColor || !req.body.contentStylingBtnTextColor || !req.body.contentStylingBodyText || !req.body.contentSylingHeadlineText
             || !req.body.isDiscountEnable || !req.body.minimumRewardAmountSpentByClientSendToClientNotificationPeriod || !req.body.minimumRewardAmountSpentTimeframeSendToClientNotificationPeriod || !req.body.selectedServices || !req.body.selectedBarbers || !req.body.selectedBranches || !req.body.isCampaignActive) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});

        // Check iscontentheaderimgenable
        if(req.body.isContentHeaderImgEnable){
            if(!req.body.contentHeaderImage) return res.status(400).send({success: false, message:"Please provide header image"});
        }

         // Check isContentBtnEnable
        if(req.body.isContentBtnEnable){
            if(!req.body.btnText) return res.status(400).send({success: false, message:"Please provide button text"});
            if(!req.body.btnLink) return res.status(400).send({success: false, message:"Please provide button link"});
        }   

        // Is discount is true than other discount info is required
        if(req.body.isDiscountEnable){
            if(!req.body.discountIsInPercentage || !req.body.discount || !req.body.maxAppointmentBookedByUser || !req.body.offerValidDays) return res.status(400).send({success: false, message:"Please provide discount data"});
        }

        // Check that birthday campaign is already exist or not
        const automatedCampaignsChecking = await AutomatedCampaigns.findOne({
            shopAdminAccountId: req.user._id,
            campaignType: 'rewardregulars'
        })
        if (automatedCampaignsChecking) return res.status(400).send({success: false, message:"Reward Regular campaign already exist. Please edit the current one or delete and restart it again"}); 
        
        const utcDate = moment.utc();

        var automatedCampaigns = new AutomatedCampaigns();
        automatedCampaigns.shopAdminAccountId =  req.user._id
        automatedCampaigns.campaignType =  'rewardregulars'
        automatedCampaigns.contentHeaderImage =  req.body.contentHeaderImage
        automatedCampaigns.contentHeadline =  req.body.contentHeadline
        automatedCampaigns.contentBody =  req.body.contentBody
        automatedCampaigns.btnText =  req.body.btnText
        automatedCampaigns.btnLink =  req.body.btnLink
        automatedCampaigns.contentStylingBackground =  req.body.contentStylingBackground
        automatedCampaigns.contentStylingBtnColor =  req.body.contentStylingBtnColor
        automatedCampaigns.contentStylingBtnTextColor =  req.body.contentStylingBtnTextColor
        automatedCampaigns.contentStylingBodyText =  req.body.contentStylingBodyText
        automatedCampaigns.contentSylingHeadlineText =  req.body.contentSylingHeadlineText
        automatedCampaigns.isDiscountEnable =  req.body.isDiscountEnable
        automatedCampaigns.discountIsInPercentage =  req.body.discountIsInPercentage
        automatedCampaigns.discount =  req.body.discount
        automatedCampaigns.maxAppointmentBookedByUser =  req.body.maxAppointmentBookedByUser
        automatedCampaigns.offerValidDays =  req.body.offerValidDays
        automatedCampaigns.minimumRewardAmountSpentByClientSendToClientNotificationPeriod =  req.body.minimumRewardAmountSpentByClientSendToClientNotificationPeriod
        automatedCampaigns.minimumRewardAmountSpentTimeframeSendToClientNotificationPeriod =  req.body.minimumRewardAmountSpentTimeframeSendToClientNotificationPeriod
        automatedCampaigns.selectedServices =  req.body.selectedServices
        automatedCampaigns.selectedBarbers =  req.body.selectedBarbers
        automatedCampaigns.selectedBranches =  req.body.selectedBranches
        automatedCampaigns.isCampaignActive =  req.body.isCampaignActive
        automatedCampaigns.campaignCreatedDate =  utcDate.toDate();

        automatedCampaigns.save(async function (err, data) {
            if (err) {
              if (err.name === 'MongoError' && err.code === 11000) {
                // Duplicate username
                return res.status(400).send({ succes: false, message: 'Looks Like this campaign already exist!' });
              }
        
              // Some other error
              return res.status(400).send({success: false, err ,message:"Something Went Wrong!"});
            }
        
              res.json({
                  success: true,
                  message: "Sucessfully Added!",
                  data: data
              });
          });

        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};

// Update Automated Reward Regular Campaign
exports.updateAutomatedRewardRegularCampaigns = async (req, res) => {
    try{
        if (!req.body.rewardRegularCampaignId) return res.status(400).send({success: false, message:"Invalid Request"});
        if(req.user.userType !== "admin") return res.status(400).send({success: false, message:"You do not have excess"});

        // Check that birthday campaign is already exist or not
        const automatedCampaigns = await AutomatedCampaigns.findOne({
            shopAdminAccountId: req.user._id,
            campaignType: 'rewardregulars',
            _id: req.body.rewardRegularCampaignId
        })
        if (!automatedCampaigns) return res.status(400).send({success: false, message:"Reward Regular campaign not found"}); 
        
        if(req.body.contentHeaderImage){
            automatedCampaigns.contentHeaderImage =  req.body.contentHeaderImage
        }
        if(req.body.contentHeadline){
            automatedCampaigns.contentHeadline =  req.body.contentHeadline
        }
        if(req.body.contentBody){
            automatedCampaigns.contentBody =  req.body.contentBody
        }
        if(req.body.btnText){
            automatedCampaigns.btnText =  req.body.btnText
        }
        if(req.body.btnLink){
            automatedCampaigns.btnLink =  req.body.btnLink
        }
        if(req.body.contentStylingBackground){
            automatedCampaigns.contentStylingBackground =  req.body.contentStylingBackground
        }
        if(req.body.contentStylingBtnColor){
            automatedCampaigns.contentStylingBtnColor =  req.body.contentStylingBtnColor
        }
        if(req.body.contentStylingBtnTextColor){
            automatedCampaigns.contentStylingBtnTextColor =  req.body.contentStylingBtnTextColor
        }
        if(req.body.contentStylingBodyText){
            automatedCampaigns.contentStylingBodyText =  req.body.contentStylingBodyText
        }
        if(req.body.contentSylingHeadlineText){
            automatedCampaigns.contentSylingHeadlineText =  req.body.contentSylingHeadlineText
        }
        if(req.body.isDiscountEnable){
            automatedCampaigns.isDiscountEnable =  req.body.isDiscountEnable
        }
        if(req.body.discountIsInPercentage){
            automatedCampaigns.discountIsInPercentage =  req.body.discountIsInPercentage
        }
        if(req.body.discount){
            automatedCampaigns.discount =  req.body.discount
        }
        if(req.body.maxAppointmentBookedByUser){
            automatedCampaigns.maxAppointmentBookedByUser =  req.body.maxAppointmentBookedByUser
        }
        if(req.body.offerValidDays){
            automatedCampaigns.offerValidDays =  req.body.offerValidDays
        }
        if(req.body.minimumRewardAmountSpentByClientSendToClientNotificationPeriod){
            automatedCampaigns.minimumRewardAmountSpentByClientSendToClientNotificationPeriod =  req.body.minimumRewardAmountSpentByClientSendToClientNotificationPeriod
        }
        if(req.body.minimumRewardAmountSpentTimeframeSendToClientNotificationPeriod){
            automatedCampaigns.minimumRewardAmountSpentTimeframeSendToClientNotificationPeriod =  req.body.minimumRewardAmountSpentTimeframeSendToClientNotificationPeriod
        }
        if(req.body.selectedServices){
            automatedCampaigns.selectedServices =  req.body.selectedServices
        }
        if(req.body.selectedBarbers){
            automatedCampaigns.selectedBarbers =  req.body.selectedBarbers
        }
        if(req.body.selectedBranches){
            automatedCampaigns.selectedBranches =  req.body.selectedBranches
        }
        if(req.body.isCampaignActive){
            automatedCampaigns.isCampaignActive =  req.body.isCampaignActive
        }

        automatedCampaigns.save(async function (err, data) {
            if (err) {
              if (err.name === 'MongoError' && err.code === 11000) {
                // Duplicate username
                return res.status(400).send({ succes: false, message: 'Looks Like this campaign already exist!' });
              }
        
              // Some other error
              return res.status(400).send({success: false, err ,message:"Something Went Wrong!"});
            }
        
              res.json({
                  success: true,
                  message: "Sucessfully Updated!",
                  data: data
              });
          });

        
    }catch (error) {
        console.log("err",error)
        res.status(500).send({
            success: false,error, message:"Server Internal Error"
        });
    }
};