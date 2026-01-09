const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', '1 Month', '3 Months', '6 Months', '12 Months'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['bhim', 'paytm', 'googlepay', 'phonepe', 'upi'],
    required: function() {
      return this.plan !== 'free';
    }
  },
  upiId: {
    type: String,
    required: function() {
      return this.paymentMethod === 'upi';
    }
  },
  transactionId: {
    type: String,
    required: function() {
      return this.plan !== 'free';
    }
  },
  features: {
    fullCourseAccess: {
      type: Boolean,
      default: function() {
        return this.plan !== 'free';
      }
    },
    aiTools: {
      type: Boolean,
      default: function() {
        return this.plan !== 'free';
      }
    },
    notesAccess: {
      type: Boolean,
      default: function() {
        return this.plan !== 'free';
      }
    },
    progressTracking: {
      type: Boolean,
      default: true
    },
    videoLimit: {
      type: Number,
      default: function() {
        return this.plan === 'free' ? 3 : -1; // -1 means unlimited
      }
    },
    documentLimit: {
      type: Number,
      default: function() {
        return this.plan === 'free' ? 2 : -1; // -1 means unlimited
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && this.endDate > new Date();
};

// Method to check access to a specific feature
subscriptionSchema.methods.hasAccess = function(feature) {
  if (!this.isActive()) {
    return false;
  }
  
  return this.features[feature] === true;
};

// Method to check video access
subscriptionSchema.methods.canAccessVideo = function(videoIndex) {
  if (!this.isActive()) {
    return false;
  }
  
  if (this.features.videoLimit === -1) {
    return true; // Unlimited access
  }
  
  return videoIndex < this.features.videoLimit;
};

// Method to check document access
subscriptionSchema.methods.canAccessDocument = function(documentIndex) {
  if (!this.isActive()) {
    return false;
  }
  
  if (this.features.documentLimit === -1) {
    return true; // Unlimited access
  }
  
  return documentIndex < this.features.documentLimit;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
