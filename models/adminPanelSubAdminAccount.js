const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;
const crypto = require('crypto');

const SubAdminSchema = new Schema({
    mainAdminShopAccount: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopsadminaccount',
    },
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

const SubAdminModel = mongoose.model('subadminaccounts', SubAdminSchema);

module.exports  = SubAdminModel;