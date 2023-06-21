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
    statesTaxesAndFees:{
        type: Number,
        default: 0
    },
    totalPrice:{
        type: Number,
    },
    tipPaid: {
        type: Boolean,
        default: false
    },
    tipAmount: {
        type: Number,
        default: 0
    },
    isConfirmedByBarber: {
        type: Boolean,
        default: false
      },
      isPermanentalyDeclinedByBarber:{
        type: Boolean,
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
    savedStripeDebitOrCreditCardId: {
      type: String
   },
    paymentMethodType:{
        type: [
            {
              method: {
                type: String,
                enum: ['stripe', 'cash', 'pos', 'other', 'points'],
              },
              amount: {
                type: Number,
              },
              paid: {
                type: Boolean,
                default: false,
              },
            },
          ],
          validate: {
            validator: function (value) {
              const uniquePaymentMethods = [...new Set(value.map((method) => method.method))]; // Remove duplicate payment methods
              const allowedPaymentMethods = ['stripe', 'cash', 'pos', 'other'];
        
              // Validate number of payment methods
              if (uniquePaymentMethods.length > 2) {
                return false;
              }
        
              // Validate combination of payment methods
              if (uniquePaymentMethods.includes('points')) {
                return uniquePaymentMethods.length === 1; // Only points are allowed as a single payment method
              } else {
                return uniquePaymentMethods.every((method) => allowedPaymentMethods.includes(method));
              }
            },
            message: 'Invalid combination of payment methods.',
          },
    },
    otherPaymentMethodname:{
        type: String,
        validate: {
            validator: function (value) {
              return this.paymentMethodType !== 'other' || (this.paymentMethodType === 'other' && value);
            },
            message: 'Other payment method name is required when payment method type is other.',
        },
    },
    isThisBookingReservedWithCard: {
        type: Boolean,
        required: true
     },
    paymentStatus:{
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'failed'],
    },
    checkoutDate:{
        type: Date
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