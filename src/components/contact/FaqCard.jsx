// src/components/contact/FaqCard.jsx
import React from 'react';

const FaqCard = () => {
  return (
    <div className="bg-gray-50 p-8 rounded-lg shadow-2xl border border-gray-200 shadow-black">
      <h3 className="text-3xl font-bold text-purple-800 mb-6">Frequently Asked Questions</h3>
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-800">What is Learnsy?</h4>
          <p className="text-gray-600 mt-1">Learnsy is an online learning platform designed to provide students with high-quality resources, collaborative tools, and a supportive community to enhance their academic journey.</p>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-800">How can I report a technical issue?</h4>
          <p className="text-gray-600 mt-1">Please use the contact form on this page and describe the issue in detail. Our support team will investigate and get back to you as soon as possible.</p>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-800">Do you offer institutional partnerships?</h4>
          <p className="text-gray-600 mt-1">Yes, we partner with educational institutions to provide our platform to their students. Please reach out via the contact form to discuss partnership opportunities.</p>
        </div>
      </div>
    </div>
  );
};

export default FaqCard;