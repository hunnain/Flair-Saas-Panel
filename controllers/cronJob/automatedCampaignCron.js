const cron = require('node-cron');
const { calculateNextBookingDate } = require('../validations/automatedCampaignsAlgorightm');
const PredictedCustomersOfBookingReminderCampaignModel = require('../../models/BookingReminderPredictedCustomer');
const ShopCustomersModel = require("../../models/shopCustomersSingup");
const BookingModel = require('../../models/createBooking');
const moment = require('moment');

// Booking Reminder Prediction Algo
const performBookingReminderPredictionEveryWeek = async () => {
  // Schedule the cron job to run every week on Sunday at 00:00 (midnight)
  cron.schedule('0 0 * * 0', async () => {
    try {
      // Get all shop customers
      const shopCustomers = await ShopCustomersModel.find();

      // Iterate over each shop customer and calculate the next booking date
      for (const customer of shopCustomers) {
        // Check if a future prediction already exists for the customer
        const existingPrediction = await PredictedCustomersOfBookingReminderCampaignModel.findOne({
          customerAccountId: customer._id,
          campaignType: 'remindertobook',
          predictedDate: { $gt: new Date() }
        });

        if (!existingPrediction) {
          // Calculate the next booking date
          const nextBookingDate = await calculateNextBookingDate(customer._id);

          if (nextBookingDate) {
            // Save the prediction in the database
            const utcDate = moment.utc();
            const predictedCustomer = new PredictedCustomersOfBookingReminderCampaignModel({
              shopAdminAccountId: customer.shopAdminAccountId,
              campaignType: 'remindertobook',
              customerAccountId: customer._id,
              predictedDate: nextBookingDate,
              createdDate: utcDate.toDate()
            });

            await predictedCustomer.save();
          }
        }
      }
    } catch (error) {
      console.error('Error running cron job:', error);
    }
  });
};

// Booking Reminder Notification Validator
const validateNotificationBookingReminder = async (customerId) => {
  try {
    const customer = await ShopCustomersModel.findById(customerId);
    
    if (!customer) {
      // Handle the case when the customer does not exist
      return false;
    }

    // Check if the customer has any active bookings from today till the future
    const today = new Date();
    const bookings = await BookingModel.find({
      customer: customerId,
      bookingDate: { $gte: today },
    });

    if (bookings.length > 0) {
      // Customer has active bookings
      return false;
    }

    if (customer.isCustomerOutOfTown === true) {
      // Customer is out of town
      return false;
    }

    if (customer.isCustomerNotificationIsOn === false) {
      // Customer has disabled notifications
      return false;
    }

    // Get the notifications sent to the customer
    const notifications = customer.notifications;

    // Check if the customer has received too many notifications recently
    const maxNotificationsPerDay = 2; // Maximum number of notifications per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const notificationsToday = notifications.filter(notification =>
      notification.sentAt >= todayStart && notification.sentAt <= todayEnd
    );

    if (notificationsToday.length >= maxNotificationsPerDay) {
      // Customer has received too many notifications today
      return false;
    }

    // All conditions are met, notification can be sent
    return true;
  } catch (error) {
    // Handle the error appropriately (e.g., logging, error response, etc.)
    console.error('Error validating notification:', error);
    throw error;
  }
};

module.exports = 
{ 
  performBookingReminderPredictionEveryWeek, 
  validateNotificationBookingReminder 
};