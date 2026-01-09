import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { updateSubscription } = useSubscription();
  const { plan, price, duration } = location.state || {};

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);

  const paymentMethods = [
    {
      id: 'bhim',
      name: 'BHIM UPI',
      icon: '🏦',
      description: 'Pay using BHIM UPI',
      upiId: 'nevilkunbhani987@okicici',
      qrCode: '/api/qr/bhim'
    },
    {
      id: 'paytm',
      name: 'Paytm',
      icon: '💳',
      description: 'Pay using Paytm Wallet',
      upiId: 'nevilkunbhani987@okicici',
      qrCode: '/api/qr/paytm'
    },
    {
      id: 'googlepay',
      name: 'Google Pay',
      icon: '📱',
      description: 'Pay using Google Pay',
      upiId: 'nevilkunbhani987@okicici',
      qrCode: '/api/qr/googlepay'
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      icon: '📲',
      description: 'Pay using PhonePe',
      upiId: 'nevilkunbhani987@okicici',
      qrCode: '/api/qr/phonepe'
    },
    {
      id: 'upi',
      name: 'UPI ID',
      icon: '🔗',
      description: 'Pay using UPI ID',
      upiId: 'nevilkunbhani987@okicici',
      qrCode: '/api/qr/upi'
    }
  ];

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (selectedPaymentMethod === 'upi' && !upiId) {
      alert('Please enter your UPI ID');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Here you would integrate with actual payment gateway
      const paymentData = {
        userId: user?.id,
        plan: plan,
        price: price,
        duration: duration,
        paymentMethod: selectedPaymentMethod,
        upiId: selectedPaymentMethod === 'upi' ? upiId : null,
        status: 'success'
      };

      // Call backend API to process payment
      const response = await fetch('/api/subscriptions/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const result = await response.json();
        setPaymentStatus('success');
        
        // Update subscription context
        updateSubscription(result.subscription);
        
        setTimeout(() => {
          navigate('/student-dashboard', { 
            state: { 
              message: 'Payment successful! Your subscription is now active.',
              subscription: result.subscription
            }
          });
        }, 2000);
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
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
                    setShowQRCode(true);
                    setLoadingQR(true);
                    
                    try {
                      const response = await fetch(`/api/qr/${method.id}?amount=${price}&plan=${plan}`);
                      const data = await response.json();
                      if (data.success) {
                        setQrCodeData(data);
                      }
                    } catch (error) {
                      console.error('Error generating QR code:', error);
                    } finally {
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

          {/* QR Code and UPI ID Display */}
          {selectedPaymentMethod && showQRCode && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Complete Payment
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
                            className="w-full h-full object-contain"
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
                      <div className="bg-white border rounded-lg p-3 mb-3">
                        <p className="font-mono text-lg text-gray-800">
                          {qrCodeData?.upiId || paymentMethods.find(m => m.id === selectedPaymentMethod)?.upiId}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const upiId = qrCodeData?.upiId || paymentMethods.find(m => m.id === selectedPaymentMethod)?.upiId;
                          navigator.clipboard.writeText(upiId || '');
                          alert('UPI ID copied to clipboard!');
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

          {/* UPI ID Input */}
          {selectedPaymentMethod === 'upi' && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="example@paytm or 9876543210@upi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your UPI ID (e.g., yourname@paytm, yourname@ybl, etc.)
              </p>
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
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
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
    </div>
  );
};

export default PaymentPage;
