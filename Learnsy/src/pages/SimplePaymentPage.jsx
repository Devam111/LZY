import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QRCode from 'qrcode';
import PaymentVerification from '../components/common/PaymentVerification';
import PaymentSuccess from '../components/common/PaymentSuccess';
import { useSubscription } from '../context/SimpleSubscriptionContext';

const SimplePaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, price, duration } = location.state || {};
  const { updateSubscription } = useSubscription();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [showPaymentVerification, setShowPaymentVerification] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [pendingPaymentDetails, setPendingPaymentDetails] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    holder: '',
    number: '',
    expiry: '',
    cvv: ''
  });
  const [payerUpiId, setPayerUpiId] = useState('');
  const [upiApp, setUpiApp] = useState('googlepay');
  const [netBankingBank, setNetBankingBank] = useState('');
  const [netBankingCustomerId, setNetBankingCustomerId] = useState('');
  const [netBankingPassword, setNetBankingPassword] = useState('');

  const merchantUpiId = 'nevilkunbhani987@okicici';

  // Function to generate QR code data URL
  const generateQRCode = async (upiId, amount, plan) => {
    try {
      // Create UPI payment string
      const upiString = `upi://pay?pa=${upiId}&pn=Learnsy&am=${amount}&cu=INR&tn=${plan} Subscription`;
      
      // Generate QR code using the qrcode library
      const qrCodeDataURL = await QRCode.toDataURL(upiString, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: '💳',
      description: 'Visa, Mastercard, RuPay & more'
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: '📱',
      description: 'Pay with any UPI app or UPI ID',
      upiId: merchantUpiId
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: '🏦',
      description: 'Pay directly from your bank account'
    }
  ];

  const netBankingOptions = useMemo(
    () => [
      'State Bank of India',
      'HDFC Bank',
      'ICICI Bank',
      'Axis Bank',
      'Kotak Mahindra Bank',
      'Punjab National Bank',
      'Bank of Baroda'
    ],
    []
  );

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (selectedPaymentMethod === 'card') {
      if (!cardDetails.holder || !cardDetails.number || !cardDetails.expiry || !cardDetails.cvv) {
        alert('Please fill in all card details');
        return;
      }
    }

    if (selectedPaymentMethod === 'upi') {
      if (!payerUpiId) {
        alert('Please enter your UPI ID');
        return;
      }
    }

    if (selectedPaymentMethod === 'netbanking') {
      if (!netBankingBank || !netBankingCustomerId || !netBankingPassword) {
        alert('Select a bank and enter your net banking credentials');
        return;
      }
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Simulate payment processing per method
      await new Promise(resolve => setTimeout(resolve, selectedPaymentMethod === 'card' ? 2500 : 2000));
      setPaymentStatus('success');

      setPendingPaymentDetails({
        plan,
        price,
        duration,
        paymentMethod: selectedPaymentMethod,
        merchantUpi: merchantUpiId,
        payerUpiId,
        upiApp,
        cardLast4: selectedPaymentMethod === 'card' ? cardDetails.number.slice(-4) : undefined,
        cardHolder: selectedPaymentMethod === 'card' ? cardDetails.holder : undefined,
        bankName: selectedPaymentMethod === 'netbanking' ? netBankingBank : undefined
      });

      // Show payment verification modal
      setShowPaymentVerification(true);
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentVerified = (paymentDetails) => {
    const subscription = {
      plan,
      price,
      duration,
      paymentMethod: paymentDetails.paymentMethod,
      merchantUpi: merchantUpiId,
      status: 'active',
      startDate: new Date().toISOString(),
      features: {
        fullCourseAccess: true,
        aiTools: true,
        notesAccess: true,
        progressTracking: true,
        videoLimit: -1,
        documentLimit: -1
      }
    };

    updateSubscription(subscription);
    setSubscriptionDetails(subscription);
    setShowPaymentVerification(false);
    setShowPaymentSuccess(true);
  };

  if (!plan || !price) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Payment Request</h2>
          <p className="text-gray-600 mb-6">Please select a plan first.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
            <p className="text-gray-600">Secure payment for your subscription</p>
          </div>

          {/* Plan Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Plan:</span>
              <span className="font-semibold">{plan}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Duration:</span>
              <span className="font-semibold">{duration}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
              <span>Total Amount:</span>
              <span className="text-purple-600">₹{price}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-1 gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === method.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={async () => {
                    setSelectedPaymentMethod(method.id);
                    if (method.id === 'upi') {
                      setLoadingQR(true);
                      try {
                        const qrCode = await generateQRCode(method.upiId, price, plan);
                        setQrCodeData({
                          qrCode,
                          upiId: method.upiId,
                          paymentMethod: method.name
                        });
                      } catch (error) {
                        console.error('Error generating QR code:', error);
                      } finally {
                        setLoadingQR(false);
                      }
                    } else {
                      setQrCodeData(null);
                      setLoadingQR(false);
                    }
                  }}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{method.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{method.name}</h4>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                    <div className="ml-auto">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedPaymentMethod === method.id}
                        onChange={() => setSelectedPaymentMethod(method.id)}
                        className="w-4 h-4 text-purple-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Payment Form */}
          {selectedPaymentMethod === 'card' && (
            <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Details</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Holder Name</label>
                  <input
                    type="text"
                    value={cardDetails.holder}
                    onChange={(e) => setCardDetails((prev) => ({ ...prev, holder: e.target.value }))}
                    placeholder="Name on the card"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    maxLength={19}
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails((prev) => ({ ...prev, number: e.target.value.replace(/[^0-9 ]/g, '') }))}
                    placeholder="XXXX XXXX XXXX XXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails((prev) => ({ ...prev, expiry: e.target.value }))}
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails((prev) => ({ ...prev, cvv: e.target.value.replace(/[^0-9]/g, '') }))}
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">We never store your card information. Your payment is processed securely.</p>
              </div>
            </div>
          )}

          {/* UPI Payment */}
          {selectedPaymentMethod === 'upi' && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Complete Payment with {qrCodeData?.paymentMethod || 'UPI'}
                </h3>
                
                <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                  {/* QR Code */}
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                      <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        {loadingQR ? (
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                            <p className="text-xs text-gray-500">Generating QR Code...</p>
                          </div>
                        ) : qrCodeData ? (
                          <img 
                            src={qrCodeData.qrCode} 
                            alt="QR Code" 
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="w-32 h-32 bg-black rounded-lg flex items-center justify-center mb-2">
                              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                                <span className="text-black text-xs font-bold">QR</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">QR Code</p>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Scan to pay with any UPI app</p>
                    </div>
                  </div>

                  {/* UPI ID */}
                  <div className="text-center">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">UPI ID</h4>
                      <div className="bg-white border rounded-lg p-3 mb-3 space-y-1">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Merchant UPI</p>
                          <p className="font-mono text-lg text-gray-800">
                            {merchantUpiId}
                          </p>
                        </div>
                        <div className="pt-3 border-t">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Your UPI ID</label>
                          <input
                            type="text"
                            value={payerUpiId}
                            onChange={(e) => setPayerUpiId(e.target.value)}
                            placeholder="yourname@upi"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder:text-gray-400"
                          />
                        </div>
                        <div className="pt-3 border-t">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Choose UPI App</label>
                          <select
                            value={upiApp}
                            onChange={(e) => setUpiApp(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
                          >
                            <option value="googlepay">Google Pay</option>
                            <option value="paytm">Paytm</option>
                            <option value="phonepe">PhonePe</option>
                            <option value="bhim">BHIM</option>
                            <option value="amazonpay">Amazon Pay</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(merchantUpiId);
                          alert('Merchant UPI ID copied to clipboard!');
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Copy UPI ID
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <div>
                      <h4 className="font-semibold text-yellow-800 text-sm">Payment Instructions</h4>
                      <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                        <li>• Scan the QR code with any UPI app</li>
                        <li>• Or manually enter the UPI ID in your payment app</li>
                        <li>• Enter the amount: ₹{price}</li>
                        <li>• Complete the payment in your UPI app</li>
                        <li>• Click "Confirm Payment" after completing the transaction</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Net Banking */}
          {selectedPaymentMethod === 'netbanking' && (
            <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Banking</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
                  <select
                    value={netBankingBank}
                    onChange={(e) => setNetBankingBank(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Choose your bank</option>
                    {netBankingOptions.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID / User ID</label>
                    <input
                      type="text"
                      value={netBankingCustomerId}
                      onChange={(e) => setNetBankingCustomerId(e.target.value)}
                      placeholder="Enter Customer ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Net Banking Password</label>
                    <input
                      type="password"
                      value={netBankingPassword}
                      onChange={(e) => setNetBankingPassword(e.target.value)}
                      placeholder="•••••••"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  You will be securely redirected to {netBankingBank || 'your bank'} to approve the payment of ₹{price}.
                </p>
              </div>
            </div>
          )}

          {/* Payment Status */}
          {paymentStatus === 'processing' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800">Processing your payment...</span>
              </div>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-green-800">Payment successful! Redirecting...</span>
              </div>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span className="text-red-800">Payment failed. Please try again.</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60"
              disabled={isProcessing}
            >
              Back
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing || !selectedPaymentMethod}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Secure Payment</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Verification Modal */}
      <PaymentVerification
        isOpen={showPaymentVerification}
        onClose={() => setShowPaymentVerification(false)}
        onPaymentVerified={handlePaymentVerified}
        paymentDetails={pendingPaymentDetails || {
          plan,
          price,
          duration,
          paymentMethod: selectedPaymentMethod,
          merchantUpi: merchantUpiId
        }}
      />

      {/* Payment Success Modal */}
      <PaymentSuccess
        isOpen={showPaymentSuccess}
        onClose={() => setShowPaymentSuccess(false)}
        subscriptionDetails={subscriptionDetails}
        onContinue={() => {
          setShowPaymentSuccess(false);
          navigate('/student-dashboard', {
            state: {
              message: 'Payment successful! You can now access all course content.',
              fromPayment: true
            }
          });
        }}
      />
    </div>
  );
};

export default SimplePaymentPage;
