const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;
const crypto = require('crypto');

// Notification
const NotificationSchema = new Schema({
    type: {
      type: String,
      required: true,
      enum: ['sms', 'email', 'pushnotification']
    },
    notitificationCriterias: {
        type: String,
        required: true,
        enum: ['birthday', 'rewardregulars', 'newclients', 'promotereviews', 'remindertobook', 'lastminuteopening', 'rescuelostclients', 'fillslowdays', 'manual']
      },
    title: {
      type: String,
      required: function () {
        return ['sms', 'email'].includes(this.type);
      }
    },
    message: {
      type: String,
      required: true
    },
    sentAt: {
      type: Date,
      required: true
    }
  });

const ShopCustomersSchema = new Schema({
    shopAdminAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopsadminaccount',
    },
    mobile: {
        type: String,
    },
    referralCode: {
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
    gender: {
        type: String,
        trim: true
    },
    dob: {
        type: String
    },
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
    stripeCustomerId:{       //CustomerID is unique for each customer for subscription or normal payment for shop
        type: String
    },
    stripeSavedCardIds:{
        type: Array
    },
    isCustomerOutOfTown:{
        type: Boolean,
        default: false
    },
    isCustomerNotificationIsOn:{
        type: Boolean,
        default: true
    },
    notifications: {
        type: [NotificationSchema],
        default: []
    },
    created_at      : { type: Date, default: Date.now },
})

// UserSchema.methods.isValidPassword = async function(password) {
//     const user      = this;
//     const compare   = await bcrypt.compare(password, user.password);
//     return compare;
// }

// Forget Passord Method
// UserSchema.methods.generatePasswordReset = function() {
//     this.resetPasswordToken = Math.floor(100000 + Math.random() * 900000);
//     this.resetPasswordExpires = Date.now() + 3600000; //expires in an hour
// };

const ShopCustomersModel = mongoose.model('shopcustomers', ShopCustomersSchema);

module.exports  = ShopCustomersModel;