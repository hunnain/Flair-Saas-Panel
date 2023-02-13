const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;
const crypto = require('crypto');

const ShopServicesSchema = new Schema({
    shopAdminAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopsadminaccount',
    },
    serviceCategoryId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopservicescategories',
    },
    serviceName: {
        type: String,
        required: true
    },
    serviceDescription: {
        type: String,
    },
    serviceTags: {
        type: Array,
    },
    workingLocation: [{ type : mongoose.Schema.Types.ObjectId, ref: 'shopbranches' }],
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

const ShopServicesModel = mongoose.model('shopservices', ShopServicesSchema);

module.exports  = ShopServicesModel;