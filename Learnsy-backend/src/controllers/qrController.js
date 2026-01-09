const QRCode = require('qrcode');

// Generate QR code for UPI payment
const generateQRCode = async (req, res) => {
  try {
    const { paymentMethod } = req.params;
    const { amount, plan } = req.query;
    
    // UPI ID for all payment methods
    const upiId = 'nevilkunbhani987@okicici';
    
    // Create UPI payment string
    const upiString = `upi://pay?pa=${upiId}&pn=Learnsy&am=${amount}&cu=INR&tn=${plan} Subscription`;
    
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(upiString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    res.json({
      success: true,
      qrCode: qrCodeDataURL,
      upiId: upiId,
      upiString: upiString,
      paymentMethod: paymentMethod
    });
    
  } catch (error) {
    console.error('QR Code generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: error.message
    });
  }
};

// Get UPI payment details
const getUPIDetails = async (req, res) => {
  try {
    const { amount, plan } = req.query;
    const upiId = 'nevilkunbhani987@okicici';
    
    res.json({
      success: true,
      upiId: upiId,
      amount: amount,
      plan: plan,
      merchantName: 'Learnsy',
      currency: 'INR'
    });
    
  } catch (error) {
    console.error('UPI details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get UPI details',
      error: error.message
    });
  }
};

module.exports = {
  generateQRCode,
  getUPIDetails
};
