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
    shopBarbersAttachWithThisService: [{ type : mongoose.Schema.Types.ObjectId, ref: 'shopbarbers' }],
    created_at      : { type: Date, default: Date.now },
})

const ShopServicesModel = mongoose.model('shopservices', ShopServicesSchema);

module.exports  = ShopServicesModel;