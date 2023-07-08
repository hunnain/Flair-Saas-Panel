const UserModel = require("../models/shopAdminSignup");
const ShopBranchesModel = require("../models/shopLocation");
const moment = require('moment-timezone');
const jwt = require("jsonwebtoken");
const Push = require("../helper/pushNotifications");
const NotificationModel = require("../models/notification");
// const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
var apn = require('apn');
const fs = require('fs')


// Firebase Setups
// const serviceAccount = require('../firbaseVeliaServiceAccount.json');

// initializeApp({
//   credential: cert(serviceAccount)
// });

const db = getFirestore();

exports.addShopLocations = async function (req, res) {
  try{

  if (!req.body.locationName || !req.body.locationCountry || !req.body.locationCity || !req.body.locationStreet || !req.body.locationPostalCode || !req.body.lat || !req.body.long || !req.body.openingHours) return res.status(400).send({success: false, message:"Invalid Request"});

//   Checking that invitation card should exist in the db then proceed further
  let user = await UserModel.findOne({_id: req.user._id})
      if (!user) return res.status(400).send({success: false ,message:"Shop Not Found. Please Contact Flair Support"});

      req.body.location = {
        type : "Point",
        address : req.body.locationStreet,
        coordinates : [ parseFloat(req.body.long), parseFloat(req.body.lat)]
      }

  let shopBranchesModel = new ShopBranchesModel();
  shopBranchesModel.shopAdminAccountId        = req.user._id
  shopBranchesModel.locationBanner     = req.body.locationBanner
  shopBranchesModel.locationName     = req.body.locationName
  shopBranchesModel.locationCountry     = req.body.locationCountry
  shopBranchesModel.locationCity = req.body.locationCity
  shopBranchesModel.locationStreet = req.body.locationStreet
  shopBranchesModel.locationPostalCode = req.body.locationPostalCode
  shopBranchesModel.monday = req.body.monday
  shopBranchesModel.tuesday = req.body.tuesday
  shopBranchesModel.wednesday = req.body.wednesday
  shopBranchesModel.thursday = req.body.thursday
  shopBranchesModel.friday = req.body.friday
  shopBranchesModel.saturday = req.body.saturday
  shopBranchesModel.sunday = req.body.sunday
  shopBranchesModel.location = req.body.location
  shopBranchesModel.openingHours = req.body.openingHours; // Assuming openingHours data is provided in the request body
  

  shopBranchesModel.save(async function (err, data) {
    if (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        // Duplicate username
        return res.status(400).send({ succes: false, message: 'Looks Like this meeting already exist!' });
      }

      // Some other error
      return res.status(400).send({success: false, err ,message:"Virtual Meeting Not Created, Something Went Wrong!"});
    }

    user.businessAllBranches.push(data._id)
    await user.save()

      res.json({
          success: true,
          message: "Sucessfully Added!",
          data: data
      });
  });
  }catch (error) {
      res.status(500).send({
          success: false, message:"Server Internal Error. Contact Support"
      });
  }
}

// Get All Shop Location
exports.getAllShopLocations = async (req, res) => {
  try {
    if(!req.body.shopAdminAccountId) return res.status(400).send({success: false, message:"Invalid Request"});
    const { shopAdminAccountId } = req.body;

    const shopLocations = await ShopBranchesModel.find({
      shopAdminAccountId: shopAdminAccountId
    });

    res.send({
      data: shopLocations,
      success: true,
      message: "Shop locations found!"
    });
  } catch (error) {
    console.log("Error", error);
    res.status(500).send({
      success: false,
      error,
      message: "Server Internal Error"
    });
  }
};