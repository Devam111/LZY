const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Verify UPI payment
const verifyPayment = async (req, res) => {
  try {
    const { upiId, amount, plan, transactionId, paymentMethod } = req.body;
    const userId = req.user?.id;

    // In a real implementation, you would:
    // 1. Check with your UPI payment gateway
    // 2. Verify the transaction with the bank
    // 3. Check if the payment was received on your UPI ID
    
    // For demo purposes, we'll simulate payment verification
    // In production, replace this with actual UPI payment verification
    
    const isPaymentVerified = await simulateUPIPaymentVerification({
      upiId,
      amount,
      plan,
      transactionId,
      paymentMethod
    });

    if (isPaymentVerified) {
      // Create or update subscription
      const subscription = await createOrUpdateSubscription({
        userId,
        plan,
        amount,
        paymentMethod,
        upiId,
        transactionId
      });

      res.json({
        success: true,
        message: 'Payment verified successfully',
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          endDate: subscription.endDate,
          features: subscription.features
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Simulate UPI payment verification
const simulateUPIPaymentVerification = async (paymentDetails) => {
  // In a real implementation, this would:
  // 1. Check your UPI ID: nevilkunbhani987@okicici
  // 2. Verify if a payment of the specified amount was received
  // 3. Check transaction details with the bank
  
  // For demo purposes, we'll simulate successful verification
  // In production, integrate with actual UPI payment gateway APIs
  
  const { upiId, amount, plan } = paymentDetails;
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate successful payment verification
  // In real app, this would check your actual UPI account
  return true;
};

// Create or update subscription after payment verification
const createOrUpdateSubscription = async (subscriptionData) => {
  const { userId, plan, amount, paymentMethod, upiId, transactionId } = subscriptionData;

  // Calculate end date based on plan
  const startDate = new Date();
  let endDate = new Date();
  
  switch (plan) {
    case '1 Month':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case '3 Months':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case '6 Months':
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case '12 Months':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1);
  }

  // Check if user already has an active subscription
  const existingSubscription = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'pending'] }
  });

  if (existingSubscription) {
    // Update existing subscription
    existingSubscription.plan = plan;
    existingSubscription.status = 'active';
    existingSubscription.endDate = endDate;
    existingSubscription.price = amount;
    existingSubscription.paymentMethod = paymentMethod;
    existingSubscription.upiId = upiId;
    existingSubscription.transactionId = transactionId;
    existingSubscription.features = {
      fullCourseAccess: true,
      aiTools: true,
      notesAccess: true,
      progressTracking: true,
      videoLimit: -1,
      documentLimit: -1
    };
    
    await existingSubscription.save();
    return existingSubscription;
  } else {
    // Create new subscription
    const subscription = new Subscription({
      userId,
      plan,
      status: 'active',
      startDate,
      endDate,
      price: amount,
      paymentMethod,
      upiId,
      transactionId,
      features: {
        fullCourseAccess: true,
        aiTools: true,
        notesAccess: true,
        progressTracking: true,
        videoLimit: -1,
        documentLimit: -1
      }
    });

    await subscription.save();
    return subscription;
  }
};

// Check payment status
const checkPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user?.id;

    // Find subscription by transaction ID
    const subscription = await Subscription.findOne({
      userId,
      transactionId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        status: subscription.status,
        endDate: subscription.endDate,
        features: subscription.features,
        isActive: subscription.isActive()
      }
    });

  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  verifyPayment,
  checkPaymentStatus
};
