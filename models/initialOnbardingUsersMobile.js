const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;

const initialOnbardingUsersMobileSchema = new Schema({
    mobile:{
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    resetPasswordToken: {
        type: String,
        default:null,
    },
    resetPasswordExpires: {
        type: Date,
    },
    created_at:{ type: Date, default: Date.now },
}, {versionKey: false}, {strict: false},)


const InitialOnbardingUsersMobileModel = mongoose.model('InitialOnbardingShopNumber', initialOnbardingUsersMobileSchema);

module.exports  = InitialOnbardingUsersMobileModel;