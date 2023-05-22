const moment = require('moment');
const ShopBranchesModel = require("../../models/shopLocation");
const BookingModel = require("../../models/createBooking");

const isBarberAvailableAtTime = async (selectedBarber, selectedShopBranch, shopLocationId, bookingDate ,bookingStartTime) => {
  try {

    if (!selectedBarber || !selectedShopBranch) {
      return false; // Barber or shop location not found
    }

    // const startTime = moment(bookingStartTime, "HH:mm").format("HH:mm");

    const bookingDateTime =  moment.utc({
      year: moment(bookingDate).year(),
      month: moment(bookingDate).month(),
      day: moment(bookingDate).date(),
      hour: moment(bookingStartTime, 'HH:mm').hours(),
      minute: moment(bookingStartTime, 'HH:mm').minutes(),
    });
    const isitdate = moment(bookingDateTime).format("dddd").toLowerCase()
    // console.log("333333333",isitdate, startTime, bookingDate)


    const shopLocation = await ShopBranchesModel.findById(shopLocationId);

    const isBarberAvailable = selectedBarber.workingHours.some((workingHour) => {
      if (
        workingHour.shopBranch.toString() === shopLocationId &&
        workingHour.dayOfWeek.toLowerCase() === moment(bookingDateTime).format("dddd").toLowerCase()
      ) {
        const bookingTime = moment.utc(bookingDateTime).format("HH:mm");
        const startTime = workingHour.startTime;
        const endTime = workingHour.endTime;
    
        return bookingTime >= startTime && bookingTime < endTime;
      }
    });
    
    // Check shop is open or not
    const isShopOpen = shopLocation.openingHours.some((openingHour) => {
      const startTime = openingHour.startTime;
      const endTime = openingHour.endTime;
    
      const isSameDayOfWeek = openingHour.dayOfWeek.toLowerCase() === moment(bookingDateTime).format("dddd").toLowerCase();
      const isOpen = !openingHour.closed;
    
      const bookingTime = moment.utc(bookingDateTime).format("HH:mm");
    
      return isSameDayOfWeek && isOpen && bookingTime >= startTime && bookingTime < endTime;
    });


    if (!isBarberAvailable || !isShopOpen) {
      // Barber is not available or shop branch is closed at the specified time
      console.log("isBarberAvailable:", isBarberAvailable);
      console.log("isShopOpen:", isShopOpen);
      return false;
    }

    // Both barber and shop branch are available at the specified time
    return true;

  } catch (error) {
    console.error("Error checking barber availability:", error);
    return false;
  }
};


// Check Existing Booking of Barber
const checkExistingBooking = async (bookingModel) => {
  try {
    const existingBooking = await BookingModel.findOne({
      bookingDate: bookingModel.bookingDate,
      'bookingTime.startTime': bookingModel.bookingTime.startTime,
      'bookingTime.endTime': bookingModel.bookingTime.endTime,
      selectedBarber: { $in: bookingModel.selectedBarber },
      bookingStatus: { $in: ['reserved', 'pending', 'inprogress'] }
    });


    if (existingBooking) {
      return { success: false, message: 'This time slot is already booked with the same barber in a different branch' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  isBarberAvailableAtTime,
  checkExistingBooking
};