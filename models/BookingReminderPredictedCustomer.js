const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;

const predictedCustomersOfBookingReminderCampaignSchema = new mongoose.Schema({
    shopAdminAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopsadminaccount',
    },
    customerAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopcustomers',
    },
    campaignType: {
        type: String,
        required: true,
        enum: ['remindertobook'],
    },
    predictedDate: {
        type: Date,
        required: true
    },
    createdDate: {
        type: Date,
        required: true
    },
    notificationCount: {
        type: Number,
        default: 0
    }

  });
  
  const PredictedCustomersOfBookingReminderCampaignModel = mongoose.model('predictedbookingremindercustomer', predictedCustomersOfBookingReminderCampaignSchema);
  
  module.exports = PredictedCustomersOfBookingReminderCampaignModel;