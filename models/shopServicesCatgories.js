const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;
const crypto = require('crypto');

const ShopServicesCategorySchema = new Schema({
    shopAdminAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopsadminaccount',
    },
    category: {
        type: String,
        required: true
    },
    categoryDescription: {
        type: String,
    },
    shopServicesAttachWithThisCategory: [{ type : mongoose.Schema.Types.ObjectId, ref: 'shopservices' }],
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

const ShopServicesCategoryModel = mongoose.model('shopservicescategories', ShopServicesCategorySchema);

module.exports  = ShopServicesCategoryModel;