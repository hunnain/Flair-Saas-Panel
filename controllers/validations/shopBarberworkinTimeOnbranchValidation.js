const moment = require('moment');
const ShopBarber = require('../../models/shopBarberSignup');
const ShopBranch = require('../../models/shopLocation');

// function to validate barber's working hours
async function validateBarberWorkingHours(barberId, branchId, dayOfWeek, start, end) {
  try{
    const barber = await ShopBarber.findById(barberId);
    if (!barber) {
      // throw new Error('Barber not found');
      return {
        success: false,
        message: 'Barber not found'
      };
    }
  
    // // check if the barber is assigned to the selected branch
    // if (!barber.workingLocation.includes(branchId)) {
    //   throw new Error('Barber is not assigned to the selected branch');
    // }
  
    // check if the proposed working hours fall within the operating hours of the selected branch
    const branch = await ShopBranch.findById(branchId);
    if (!branch) {
      // throw new Error('Branch not found');
      return {
        success: false,
        message: 'Branch not found'
      };
    }
  
    const openingHours = branch.openingHours.find(oh => oh.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase());

  if (!openingHours) {
    // throw new Error(`No opening hours found for ${dayOfWeek}`);
    return {
      success: false,
      message: `No opening hours found for ${dayOfWeek}`
    };
  }

  const openingTime = moment(openingHours.startTime, 'HH:mm');
  const closingTime = moment(openingHours.endTime, 'HH:mm');
  const startDateTime = moment(start, 'HH:mm');
  const endDateTime = moment(end, 'HH:mm');

  if (startDateTime.isBefore(openingTime) || endDateTime.isAfter(closingTime)) {
    // throw new Error(`Selected branch is closed on ${dayOfWeek} at that time`);
    return {
      success: false,
      message: `Selected branch is closed on ${dayOfWeek} at that time`
    };
  }
  
    // check for overlaps with existing working hours of the barber
    const overlappingWorkingHours = barber.workingHours.filter(workingHours => {
      const workingDayOfWeek = workingHours.dayOfWeek;
      const workingStartTime = moment(workingHours.startTime, 'HH:mm');
      const workingEndTime = moment(workingHours.endTime, 'HH:mm');
  
      if (workingDayOfWeek !== dayOfWeek) {
        return false;
      }
  
      return startDateTime.isBetween(workingStartTime, workingEndTime, null, '[]') ||
        endDateTime.isBetween(workingStartTime, workingEndTime, null, '[]') ||
        workingStartTime.isBetween(startDateTime, endDateTime, null, '[]') ||
        workingEndTime.isBetween(startDateTime, endDateTime, null, '[]');
    });
  
    if (overlappingWorkingHours.length > 0) {
      // throw new Error('Proposed working hours overlap with existing working hours');
      return {
        success: false,
        message: 'Proposed working hours overlap with existing working hours'
      };
    }

    return{
      success: true
    }
  }catch (error) {
    console.error('Error ', error);
    throw new Error('Server Internal Error');
  }
  }
  
  module.exports = validateBarberWorkingHours;