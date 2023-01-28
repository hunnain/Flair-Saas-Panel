const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;
const crypto = require('crypto');

const UserSchema = new Schema({
    mobile: {
        type: String
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
    isPasswordChange:{
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
    adminUserLogo:{
        type: String,  
        default:"https://cdn3.vectorstock.com/i/thumb-large/32/12/default-avatar-profile-icon-vector-39013212.jpg" 
    },
    email: {
       type: String,
       unique: true,
       trim: true,
       required: true
    },
    password: {
        type: String,
        trim: true,
        required: true
     },
    businessLogo:{
        type: String,  
        default:"https://cdn3.vectorstock.com/i/thumb-large/32/12/default-avatar-profile-icon-vector-39013212.jpg" 
    },
    businessName:{
        type: String
    },
    businessCountry:{
        type: String
    },
    businessState:{
        type: String
    },
    businessCity:{
        type: String
    },
    businessAddress:{
        type: String
    },
    businessStaffSize:{
        type: String
    },
    businessWebsite: {
        type: String
    },
    businessGoogleReviews: {
        type: String
    },
    businessFacebookPage:{
        type: String
    },
    businessInstagramPage:{
        type: String
    },
    businessContacts:{
        type: Array,
    },
    businessPricingPlan:{
        type: String,
    },
    businessAppLogo:{
        type: String,
    },
    businessContractAccepted:{
        type: Boolean,
        default: false
    },
    businessAllBranches: [{ type : mongoose.Schema.Types.ObjectId, ref: 'shopbranches' }],
    businessAllSubAdmin: [{ type : mongoose.Schema.Types.ObjectId, ref: 'subadminaccounts' }],
    bookingPaymentWithCard:{
        type: Boolean,
        default: true
    },
    stripeCustomerId:{       //CustomerID is unique for each customer for subscription or normal payment for shop
        type: String
    },
    stripeAccountId:{        //Stripe Merchant Account ID
        type: String,
        default: null,
    },
    stripeAccountConnected:{   // Will verify that Stripe Merchant is Connected or Not
        type: Boolean,
        default: false,
    },
    businessStartingTheme:{
        type: String
    },
    businessSelectedTheme:{
        theme:{
            logo: String,
            contentBacground: String,
            cardColor: String,
            buttonColor: String,
            AccentColor: String,
            primaryTextColor: String,
            SecondaryTextColor: String
        }
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

const UserModel = mongoose.model('shopsadminaccount', UserSchema);

module.exports  = UserModel;