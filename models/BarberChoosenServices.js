const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;
const crypto = require('crypto');

const BarberChoosenServicesSchema = new Schema({
    shopAdminAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopsadminaccount',
    },
    barberAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopbarbers',
    },
    shopServiceId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopservices',
    },
    barberDescription: {
        type: String,
    },
    serviceTime: {
        type: Number,
        required: true
    },
    staticPricing: {
        type: Boolean,
        required: true
    },
    dynamicPricing: {
        type: Boolean,
        required: true
    },
    priceMayChange: {
        type: Boolean,
        default: false
    },
    mondayPrice: {
        type: Number,
        required: true
    },
    tuesdayPrice: {
        type: Number,
        required: true
    },
    wednesdayPrice: {
        type: Number,
        required: true
    },
    thursdayPrice: {
        type: Number,
        required: true
    },
    fridayPrice: {
        type: Number,
        required: true
    },
    saturdayPrice: {
        type: Number,
        required: true
    },
    sundayPrice: {
        type: Number,
        required: true
    },
    created_at      : { type: Date, default: Date.now },
})

const BarberChoosenServicesModel = mongoose.model('barberschoosenservice', BarberChoosenServicesSchema);

module.exports  = BarberChoosenServicesModel;