const cron = require('node-cron');
const ShopCustomersModel = require('../../models/shopCustomersSingup'); 
const BookingModel = require('../../models/createBooking'); 
const AutomatedCampaigns = require('../../models/automatedCmpaigns'); 
const moment = require('moment');

const startBirthdayNotificationCron = () => {
  // Schedule the cron job to run every day at 00:00 (midnight)
  cron.schedule('0 0 * * *', async () => {
    try {
      // Get all active birthday campaigns
      const birthdayCampaigns = await AutomatedCampaigns.find({
        isCampaignActive: true,
        campaignType: 'birthday'
      });

      // Iterate over each campaign
      for (const campaign of birthdayCampaigns) {
        const currentDate = moment().startOf('day'); // Get the current date without time
        const campaignStartDate = moment(campaign.campaignCreatedDate).startOf('day'); // Get the campaign start date without time

        // Calculate the campaign days (number of days since the campaign started)
        const campaignDays = currentDate.diff(campaignStartDate, 'days');

        if (campaignDays < campaign.offerValidDays) {
          // Iterate over each customer to check for birthdays
          const customers = await ShopCustomersModel.find();

          for (const customer of customers) {
            const customerBirthday = moment(customer.dob, 'MM/DD/YYYY').startOf('day'); // Get the customer's birthday without time

          
            if (customerBirthday.isSameOrAfter(campaignStartDate) && customerBirthday.isBefore(currentDate)) {
              const bookingCount = await BookingModel.countDocuments({
                customer: customer._id
              });

              if (bookingCount <= campaign.maxAppointmentBookedByUser) {
                const daysUntilBirthday = customerBirthday.diff(currentDate, 'days');

                // Check if it's the notification day based on the BirthdaySendToClientNotificationPeriod
                if (daysUntilBirthday === campaign.BirthdaySendToClientNotificationPeriod) {
                  // Send the birthday notification to the customer
                  sendBirthdayNotification(customer, campaign);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error running birthday notification cron job:', error);
    }
  });
};

// const sendBirthdayNotification = (customer, campaign) => {
//   console.log(`Sending birthday notification to ${customer.firstName} ${customer.lastName}`);
//   console.log('Notification content:', campaign.contentHeadline, campaign.contentBody);
// };

module.exports = { startBirthdayNotificationCron };