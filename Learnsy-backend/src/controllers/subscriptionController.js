const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Process payment and create subscription
const processPayment = async (req, res) => {
  try {
    const { userId, plan, price, duration, paymentMethod, upiId } = req.body;

    // Validate required fields
    if (!userId || !plan || !price || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate end date based on duration
    const startDate = new Date();
    let endDate = new Date();
    
    switch (duration) {
      case '1 month':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case '3 months':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case '6 months':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case '12 months':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid duration'
        });
    }

    // Generate transaction ID (in real app, this would come from payment gateway)
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create subscription
    const subscription = new Subscription({
      userId,
      plan,
      status: 'active',
      startDate,
      endDate,
      price,
      paymentMethod,
      upiId: paymentMethod === 'upi' ? upiId : undefined,
      transactionId
    });

    await subscription.save();

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        status: subscription.status,
        endDate: subscription.endDate,
        features: subscription.features
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get current subscription for user
const getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'pending'] }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      // Return free trial subscription
      const freeSubscription = {
        plan: 'free',
        status: 'active',
        features: {
          fullCourseAccess: false,
          aiTools: false,
          notesAccess: false,
          progressTracking: true,
          videoLimit: 3,
          documentLimit: 2
        }
      };
      
      return res.json({
        success: true,
        subscription: freeSubscription
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
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Check access to specific feature
const checkAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    const { feature } = req.params;

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'pending'] }
    }).sort({ createdAt: -1 });

    let hasAccess = false;

    if (!subscription) {
      // Free trial access
      if (feature === 'progressTracking') {
        hasAccess = true;
      } else if (feature === 'videoLimit') {
        hasAccess = true; // Can access first 3 videos
      } else if (feature === 'documentLimit') {
        hasAccess = true; // Can access first 2 documents
      }
    } else {
      hasAccess = subscription.hasAccess(feature);
    }

    res.json({
      success: true,
      hasAccess,
      feature
    });

  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Check video access
const checkVideoAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    const { videoIndex } = req.params;

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'pending'] }
    }).sort({ createdAt: -1 });

    let canAccess = false;

    if (!subscription) {
      // Free trial - can access first 3 videos
      canAccess = parseInt(videoIndex) < 3;
    } else {
      canAccess = subscription.canAccessVideo(parseInt(videoIndex));
    }

    res.json({
      success: true,
      canAccess,
      videoIndex: parseInt(videoIndex)
    });

  } catch (error) {
    console.error('Check video access error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Check document access
const checkDocumentAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentIndex } = req.params;

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'pending'] }
    }).sort({ createdAt: -1 });

    let canAccess = false;

    if (!subscription) {
      // Free trial - can access first 2 documents
      canAccess = parseInt(documentIndex) < 2;
    } else {
      canAccess = subscription.canAccessDocument(parseInt(documentIndex));
    }

    res.json({
      success: true,
      canAccess,
      documentIndex: parseInt(documentIndex)
    });

  } catch (error) {
    console.error('Check document access error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      userId,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get subscription plans
const getPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free Trial',
        price: 0,
        duration: 'Lifetime',
        features: {
          fullCourseAccess: false,
          aiTools: false,
          notesAccess: false,
          progressTracking: true,
          videoLimit: 3,
          documentLimit: 2
        }
      },
      {
        id: '1-month',
        name: '1 Month',
        price: 149,
        duration: '1 month',
        features: {
          fullCourseAccess: true,
          aiTools: true,
          notesAccess: true,
          progressTracking: true,
          videoLimit: -1,
          documentLimit: -1
        }
      },
      {
        id: '3-months',
        name: '3 Months',
        price: 349,
        duration: '3 months',
        features: {
          fullCourseAccess: true,
          aiTools: true,
          notesAccess: true,
          progressTracking: true,
          videoLimit: -1,
          documentLimit: -1
        }
      },
      {
        id: '6-months',
        name: '6 Months',
        price: 649,
        duration: '6 months',
        features: {
          fullCourseAccess: true,
          aiTools: true,
          notesAccess: true,
          progressTracking: true,
          videoLimit: -1,
          documentLimit: -1
        }
      },
      {
        id: '12-months',
        name: '12 Months',
        price: 1099,
        duration: '12 months',
        features: {
          fullCourseAccess: true,
          aiTools: true,
          notesAccess: true,
          progressTracking: true,
          videoLimit: -1,
          documentLimit: -1
        }
      }
    ];

    res.json({
      success: true,
      plans
    });

  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  processPayment,
  getCurrentSubscription,
  checkAccess,
  checkVideoAccess,
  checkDocumentAccess,
  cancelSubscription,
  getPlans
};
