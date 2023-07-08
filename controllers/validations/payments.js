const stripe    = require("stripe")(process.env.STRIPE_SECRET_KEY)

// Stripe Card Charging
const chargeCustomerCardBarber = async (customerId, amount, paymentMethodToken, savedCardId) => {
    try {
      let paymentMethod;
  
      // If saved card ID is provided, retrieve the payment method details
      if (savedCardId) {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
        });
  
        // Find the saved card based on the ID
        const savedCard = paymentMethods.data.find(card => card.id === savedCardId);
  
        if (savedCard) {
          // Retrieve the payment method associated with the saved card
          paymentMethod = savedCard.id;
        } else {
          // Handle case when saved card is not found
          return {
            success: false,
            message: 'Saved card not found.'
          };
        }
      } else {
        // If saved card ID is not provided, use the payment method token
        paymentMethod = paymentMethodToken;
      }
  
      // Create a charge using the customer ID and payment method
      const charge = await stripe.charges.create({
        amount,
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethod,
        off_session: true,
        confirm: true,
      });
  
      // Handle the charge success or failure here
      if (charge.status === 'succeeded') {
        // Payment successful
        return {
          success: true,
          message: 'Payment successful.',
          chargeId: charge.id,
        };
      } else {
        // Payment failed
        return {
          success: false,
          message: 'Payment failed.'
        };
      }
    } catch (error) {
      // Handle any errors that occur during the payment process
      return {
        success: false,
        message: 'Payment error.',
        error: error.message,
      };
    }
  };

// Stripe POS Charging
async function capturePaymentStripePOS(paymentToken, amount, currency) {
  try {
    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      payment_method_types: ['card_present'],
      capture_method: 'manual',
      confirmation_method: 'manual',
    });

    // Create a PaymentIntent source using the payment token from the Stripe Terminal SDK
    const source = await stripe.paymentIntents.createSource(paymentIntent.id, {
      source: paymentToken,
    });

    // Confirm the PaymentIntent
    await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: source.id,
    });

    // Capture the PaymentIntent
    const capturedPayment = await stripe.paymentIntents.capture(paymentIntent.id);

    // Return the captured payment object
    return {success: true, capturedPayment};
  } catch (error) {
    // Handle any errors that occurred during the payment capture process
    console.error('Error capturing payment:', error);
    throw error;
  }
}

  module.exports = {
    chargeCustomerCardBarber,
    capturePaymentStripePOS
  };