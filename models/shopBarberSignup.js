const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;
const crypto = require('crypto');

const ShopBarberSchema = new Schema({
    shopAdminAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopsadminaccount',
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
    barberPhotosGallery: {
        type: Array
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
    monday:{
        startAt:String,
        endAt:String
    },
    tuesday:{
        startAt:String,
        endAt:String
    },
    wednesday:{
        startAt:String,
        endAt:String
    },
    thursday:{
        startAt:String,
        endAt:String
    },
    friday:{
        startAt:String,
        endAt:String
    },
    saturday:{
        startAt:String,
        endAt:String
    },
    sunday:{
        startAt:String,
        endAt:String
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