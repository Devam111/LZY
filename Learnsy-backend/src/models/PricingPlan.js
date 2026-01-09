const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema(
  {
    planName: { type: String, required: true },
    price: { type: Number, required: true },
    features: [{ type: String }],
    duration: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PricingPlan', pricingPlanSchema);


