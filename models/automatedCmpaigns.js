const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;

const automatedCampaignsSchema = new mongoose.Schema({
    shopAdminAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopsadminaccount',
    },
    campaignType: {
        type: String,
        required: true,
        enum: ['birthday', 'rewardregulars', 'newclients', 'promotereviews', 'remindertobook', 'lastminuteopening', 'rescuelostclients', 'fillslowdays'],
    },
    isCampaignActive:{
        type: Boolean,
        required: true,
    },
    contentHeaderImage: {
      type: String
    },
    contentHeadline: {
      type: String,
      required: true
    },
    contentBody: {
      type: String,
      required: true
    },
    btnText: {
        type: String
    },
    btnLink: {
        type: String
    },
    contentStylingBackground: {
        type: String,
        required: true
    },
    contentStylingBtnColor: {
        type: String,
        required: true
    },
    contentStylingBtnTextColor: {
        type: String,
        required: true
    },
    contentStylingBodyText: {
        type: String,
        required: true
    },
    contentSylingHeadlineText: {
        type: String,
        required: true
    },
    discountIsInPercentage: {
        type: Boolean,
        required: function () {
            return this.campaignType === 'birthday' || this.isDiscountEnable === true;
        },
    },
    isDiscountEnable:{
        type: Boolean,
        required: function () {
            return this.campaignType === 'rewardregulars' || this.campaignType === 'newclients';
        },
    },
    discount: {
        type: Number,
        required: function () {
            return this.campaignType === 'birthday' || this.isDiscountEnable === true;
        },
    },
    maxAppointmentBookedByUser: {
        type: Number,
        required: function () {
            return this.campaignType === 'birthday' || this.isDiscountEnable === true;
        },
    },
    offerValidDays: {
        type: Number,
        required: function () {
            return this.campaignType === 'birthday' || this.isDiscountEnable === true;
        },
    },
    BirthdaySendToClientNotificationPeriod: {                           // -- Birthday Campaign
        type: Number,
        required: function () {
            return this.campaignType === 'birthday';
        },
    },
    selectedServices: {
        type: Array,
        required: true
    },
    selectedBarbers: {
        type: Array,
        required: true
    },
    selectedBranches: {
        type: Array,
        required: true
    },
    googleLink: {
        type: String
    },
    facebookLink: {
        type: String
    },
    yelpLink: {
        type: String
    },
    promoteReviewSendToClientNotificationPeriod:{                    // -- Promote Review Campaign
        type: Number,
        required: function () {
            return this.campaignType === 'promotereviews';
        },
    },
    newClientSendToClientNotificationPeriod:{                         // -- New Client Campaign
        type: Number,
        required: function () {
            return this.campaignType === 'newclients';
        },
    },
    minimumRewardAmountSpentByClientSendToClientNotificationPeriod:{
        type: Number,                                                       //Total amount spend on appointment in the timeframe, So send notification to those only -- Reward Regular Campaign
        required: function () {
            return this.campaignType === 'rewardregulars';
        },
    },
    minimumRewardAmountSpentTimeframeSendToClientNotificationPeriod:{
        type: Number,                                                         //We need days value  -- Reward Regular Campaign
        required: function () {
            return this.campaignType === 'rewardregulars';
        },
    },
    campaignCreatedDate: {
        type: Date,
        require: true
    },

  });
  
  const AutomatedCampaigns = mongoose.model('automatedcampaigns', automatedCampaignsSchema);
  
  module.exports = AutomatedCampaigns;