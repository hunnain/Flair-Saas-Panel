const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;
const crypto = require('crypto');

const BookingSchema = new Schema({
    shopAdminAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopsadminaccount',
    },
    bookingImg:{
        type: String,  
        default:"https://cdn3.vectorstock.com/i/thumb-large/32/12/default-avatar-profile-icon-vector-39013212.jpg" 
    },
    bookingTime:{
        startTime: String,
        endTime: String,
        required: true
    },
    bookingDate:{
        type: Date,
        required: true
    },
    bookingBranch: { type : mongoose.Schema.Types.ObjectId, ref: 'shopbranches', required: true },
    selectedBarberServices: [{ type : mongoose.Schema.Types.ObjectId, ref: 'barberschoosenservice', customPricingisON, customPrice, required: true }],
    selectedBarber: [{ type : mongoose.Schema.Types.ObjectId, ref: 'shopbarbers',required: true }],
    customer:{
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'shopbranches',
        required: function() {
            return this.isItWalkingCustomer !== true;
        }
    },
    isItWalkingCustomer:{
        type: Boolean,
        required: true
    },
    walkingCustomerName: {
        type: String,
        required: function() {
          return this.isItWalkingCustomer === true;
        }
    },
    walkingCustomerNumber: {
        type: String,
        required: function() {
          return this.isItWalkingCustomer === true;
        }
    },
    totalDiscount:{
        type: Number,
    },
    availablePromotionsDiscount:{
        type: Number,
    },
    totalPrice:{
        type: Number,
    },
    paymentMethodType:{
        type: String,
        enum: ['stripe', 'cash', 'pos', 'points'],
    },
    paymentStatus:{
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
    },
    bookingStatus:{
        type: String,
        enum: ['pending', 'inprogress', 'completed', 'cancelled'],
    },
    stripeCustomerId:{      
        type: String
    },
    stripePaymentId:{      
        type: String
    },
    created_at      : { type: Date, default: Date.now },
})

const BookingModel = mongoose.model('booking', BookingSchema);

module.exports  = BookingModel;