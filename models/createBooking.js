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
    bookingId:{
        type: String,
        required: true
    },
    bookingImg:{
        type: String,  
        default:"https://cdn3.vectorstock.com/i/thumb-large/32/12/default-avatar-profile-icon-vector-39013212.jpg" 
    },
    bookingTime:{
        startTime: {
            type: String,
                    required: true,
                    validate: {
                        validator: function(v) {
                            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                        },
                        message: props => `${props.value} is not a valid time format.`
            },
        },
        endTime: {
            type: String,
                    required: true,
                    validate: {
                        validator: function(v) {
                            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                        },
                        message: props => `${props.value} is not a valid time format.`
            },
        }
    },
    bookingDate:{
        type: Date,
        required: true
    },
    bookingBranch: { type : mongoose.Schema.Types.ObjectId, ref: 'shopbranches', required: true },
    selectedBarberServices: [{
        service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'barberschoosenservice',
          required: true
        },
        customPricing: {
          isOn: {
            type: Boolean,
            default: false
          },
          price: {
            type: Number
          }
        },
        quantity: {
          type: Number,
          default: 1
        }
      }],
    selectedBarber: [{ type : mongoose.Schema.Types.ObjectId, ref: 'shopbarbers',required: true }],
    customer:{
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'shopcustomers',
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
    tipPaid: {
        type: Boolean,
        default: false
    },
    tipAmount: {
        type: Number
    },
    isConfirmedByBarber: {
        type: Boolean,
        default: false
      },
      confirmationDate: {
        type: Date
      },
      calendarEventId: {
        type: String
      },
      voucherCode: {
        type: String
      },
    isExpressBooking: {
       type: Boolean,
       default: false
    },
    paymentMethodType:{
        type: String,
        enum: ['stripe', 'cash', 'pos', 'points'],
    },
    isThisBookingReservedWithCard: {
        type: Boolean,
        required: true
     },
    paymentStatus:{
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'failed'],
    },
    bookingStatus:{
        type: String,
        enum: ['pending', 'reserved' ,'inprogress', 'completed', 'cancelled'],
    },
    stripeCustomerId:{      
        type: String
    },
    stripePaymentId:{      
        type: String
    },
    completedDate: {
        type: Date
      },
    created_at      : { type: Date, default: Date.now },
})

const BookingModel = mongoose.model('booking', BookingSchema);

module.exports  = BookingModel;