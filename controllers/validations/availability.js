const moment = require('moment');

const isBarberAvailableAtTime = async (selectedBarber, selectedShopBranch, shopLocationId, bookingDate ,bookingStartTime) => {
  try {

    if (!selectedBarber || !selectedShopBranch) {
      return false; // Barber or shop location not found
    }

    const bookingDateTime = moment.utc(`${bookingDate} ${bookingStartTime}`, "YYYY-MM-DD HH:mm");

    // Check if the booking time falls within the working hours of the barber
    const isBarberAvailable = selectedBarber.workingHours.some((workingHour) => {
      if (
        workingHour.shopBranch.toString() === shopLocationId &&
        workingHour.dayOfWeek.toLowerCase() === moment(bookingDateTime).format("dddd").toLowerCase()
      ) {
        const startTime = moment.utc(workingHour.startTime, "HH:mm");
        const endTime = moment.utc(workingHour.endTime, "HH:mm");

        return bookingDateTime.isSameOrAfter(startTime) && bookingDateTime.isBefore(endTime);
      }
    });

    const shopLocation = await ShopBranchesModel.findById(shopLocationId);

    const isShopOpen = shopLocation.openingHours.some((openingHour) => {
      return (
        openingHour.dayOfWeek.toLowerCase() === moment(bookingDateTime).format("dddd").toLowerCase() &&
        !openingHour.closed &&
        bookingDateTime.isSameOrAfter(moment.utc(openingHour.startTime, "HH:mm")) &&
        bookingDateTime.isBefore(moment.utc(openingHour.endTime, "HH:mm"))
      );
    });

    if (!isBarberAvailable || !isShopOpen) {
      // Barber is not available or shop branch is closed at the specified time
      return false;
    }

    // Both barber and shop branch are available at the specified time
    return true;
  } catch (error) {
    console.error("Error checking barber availability:", error);
    return false;
  }
};

module.exports = {
  isBarberAvailableAtTime
};