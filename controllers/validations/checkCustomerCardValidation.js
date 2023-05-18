const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

const checkCustomerHasCard = async (customerId) => {
  try {
    const sources = await stripe.customers.listSources(customerId, { object: 'card' });

    if (sources.data.length === 0) {
      return 'There is no saved cards. Please add one';
    }

    return true;
  } catch (error) {
    console.error('Error checking customer cards:', error);
    throw new Error('There was an error while checking customer cards');
  }
};

module.exports = {
    checkCustomerHasCard
  };