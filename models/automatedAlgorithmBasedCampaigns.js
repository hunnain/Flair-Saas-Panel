const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;

const automatedAlgorithmBasedCampaignsSchema = new mongoose.Schema({
    shopAdminAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopsadminaccount',
    },
    campaignType: {
        type: String,
        required: true,
        enum: ['remindertobook', 'lastminuteopening', 'rescuelostclients', 'fillslowdays'],
    },
    isCampaignActive:{
        type: Boolean,
        required: true,
    },
    selectedServices: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'shopservices' 
          }],
        required: true
    },
    selectedBarbers: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'shopbarbers' 
          }],
        required: true
    },
    selectedBranches: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'shopbranches' 
          }],
        required: true
    },
    selectedCustomers: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'shopcustomers' 
          }],
        required: true
    },
    campaignCreatedDate: {
        type: Date,
        required: true
    },

  });
  
  const AutomatedAlgorithmCampaigns = mongoose.model('automatedalgorthimcampaigns', automatedAlgorithmBasedCampaignsSchema);
  
  module.exports = AutomatedAlgorithmCampaigns;