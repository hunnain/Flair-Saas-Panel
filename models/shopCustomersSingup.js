const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;
const crypto = require('crypto');

const ShopCustomersSchema = new Schema({
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