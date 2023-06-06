const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;
const crypto = require('crypto');
const moment = require('moment-timezone');

const ShopBarberSchema = new Schema({
    shopAdminAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopsadminaccount',
    },
    isBarberLive:{
       type: Boolean,
       default: false
    },
    mobile: {
        type: String,
    },
    isMobileVerified:{
        type: Boolean,
        required: true,
        default: false
    },
    isEmailVerified:{
        type: Boolean,
        required: true,
        default: false
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    userProfileLogo:{
        type: String,  
        default:"https://static.vecteezy.com/system/resources/previews/002/640/730/original/default-avatar-placeholder-profile-icon-male-vector.jpg" 
    },
    email: {
       type: String,
       trim: true,
       required: true
    },
    password: {
        type: String,
        trim: true,
        required: true
    },
    role: {
        type: String,
        trim: true
    },
    workingLocation: [{ type : mongoose.Schema.Types.ObjectId, ref: 'shopbranches' }],
    barberBlockTime: [{ type : mongoose.Schema.Types.ObjectId, ref: 'BlockTime' }],
    customerRequiredToAddCardByBarber: [{ type : mongoose.Schema.Types.ObjectId, ref: 'shopcustomers' }],
    workingHours: [{
        shopBranch: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'shopbranches'
        },
        dayOfWeek: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        startTime: {
          type: String,
          validate: {
            validator: function(v) {
              return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
            },
            message: props => `${props.value} is not a valid time format.`
          }
        },
        endTime: {
          type: String,
          validate: {
            validator: function(v) {
              return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
            },
            message: props => `${props.value} is not a valid time format.`
          }
        }
      }],
    isOnCommission: {
        type: Boolean
    },
    isOnRent: {
        type: Boolean
    },
    commissionPayoutFrequency: {
        frequency: String,
        paymentDay: String
    },
    rentCollectionFrequency: {
        frequency: String
    },
    commisionPayStructure:{
        staffCommision: String,
        employeeStartDate: Date
    },
    rentPayStructure:{
        staffRentMoney: Number,
        effectiveDate: Date
    },
    dob: {
        type: String
    },
    gender: {
        type: String
    },
    about: {
        type: String
    },
    instagram: {
        type: String
    },
    barberPhotosGallery: [{
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: function () {
            return new mongoose.Types.ObjectId();
          }
        },
        imageUrl: {
          type: String,
          required: true
        }
      }],
    social:{
        type: String,
        default: null
    },
    socialId:{
        type: String,
        default: null
    },
    fbUid:{
        type: String,
        default: null
    },
    iosApn:{
      type: String,  
    },
    notificationToken: {
        type: Array
    },
    blockedUsers:[{
       isHeBlocked:{
        type: Boolean
       },
       user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
    }],
    resetPasswordToken: {
        type: String,
        default:null,
    },
    resetPasswordExpires: {
        type: Date,
    },
    mobileVerifyToken: {
        type: String,
        default:null,
    },
    mobileVerifyTokenExpires: {
        type: Date,
    },
    secretChangePasswordCode: {
        type: String,
        default:null,
    },
    secretChangePasswordCodeExpires: {
        type: Date,
    },
    appointmentRequest:{
        type: Boolean,
        default: false
    },
    noShowCharge:{
        type: Number,
    },
    cancellationPolicy:{
        type: Number,
    },
    cancellationWindowHour:{
        type: Number,
    },
    stripeCustomerId:{       //CustomerID is unique for each customer for subscription or normal payment for shop
        type: String
    },
    stripeSavedCardIds:{
        type: Array
    },
    bookingPaymentWithCard:{
        type: Boolean,
        default: true
    },
    choosenServices: [{ type : mongoose.Schema.Types.ObjectId, ref: 'barberschoosenservice' }],
    created_at      : { type: Date, default: Date.now },
})

const ShopBarbersModel = mongoose.model('shopbarbers', ShopBarberSchema);

module.exports  = ShopBarbersModel;