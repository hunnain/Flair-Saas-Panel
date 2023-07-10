const ShopCustomersModel = require('../../models/shopCustomersSingup');
const BookingModel = require('../../models/createBooking');
const PredictedCustomersOfBookingReminderCampaignModel = require('../../models/BookingReminderPredictedCustomer');
const moment = require('moment');
const dayjs = require('dayjs');

// Predict Customer next booking Date ----- Booking Reminder Algo
const calculateNextBookingDate = async (customerId) => {
  try {
  const customer = await ShopCustomersModel.findById(customerId);

  if (!customer) {
    // Handle the case when the customer does not exist
    return null; // Return null or handle accordingly
  }

  // Retrieve the previous bookings of the customer, sorted by booking date in descending order
  const previousBookings = await BookingModel.find({ customer: customerId })
    .sort({ bookingDate: -1 });

  if (previousBookings.length < 1) {
    // No previous bookings available to predict the next booking date
    return null; // Return null or handle accordingly
  }

  const lastBookingDate = previousBookings[0].bookingDate;

  // Calculate the average time between consecutive bookings based on all previous bookings
  let totalBookingTime = 0;
  for (let i = 1; i < previousBookings.length; i++) {
    const previousBookingDate = previousBookings[i - 1].bookingDate;
    const currentBookingDate = previousBookings[i].bookingDate;
    const timeDifference = currentBookingDate.getTime() - previousBookingDate.getTime();
    totalBookingTime += timeDifference;
  }
  const averageBookingTime = totalBookingTime / (previousBookings.length - 1);

  // Get the current date and time
  const currentDate = new Date();

  // Calculate the next booking date by adding the average booking time to the last booking date
  const nextBookingDate = new Date(lastBookingDate.getTime() + averageBookingTime);

  // Check if the next booking date is in the past, adjust it to the future if necessary
  if (nextBookingDate < currentDate) {
    const timeDifference = currentDate.getTime() - nextBookingDate.getTime();
    const adjustedNextBookingDate = new Date(currentDate.getTime() + timeDifference);
    console.log('Adjusted Next Booking Date:', adjustedNextBookingDate);

    return adjustedNextBookingDate;
  }

  // console.log('Next Booking Date:', nextBookingDate);

} catch (error) {
  // Handle the error appropriately (e.g., logging, error response, etc.)
  console.error('Error calculating next booking date:', error);
  throw error;
}
};


module.exports = {
  calculateNextBookingDate
};