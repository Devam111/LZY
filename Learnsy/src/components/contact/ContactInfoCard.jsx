// src/components/contact/ContactInfoCard.jsx
import React from 'react';

const ContactInfoCard = () => {
  return (
    <div className="bg-gray-50 p-8 rounded-lg shadow-2xl border border-gray-200 shadow-black">
      <h3 className="text-3xl font-bold text-purple-800 mb-6">Contact Information</h3>
      <div className="space-y-5">
        {/* Phone Number */}
        <div className="flex items-start space-x-4">
          <div className="mt-1">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-800">Phone Number</h4>
            <p className="text-gray-600">+91 123 456 7890</p>
          </div>
        </div>

        {/* Team Emails */}
        <div className="flex items-start space-x-4">
          <div className="mt-1">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-800">Team Emails</h4>
            <p className="text-gray-600">devambikhadiya@gmail.com</p>
            <p className="text-gray-600">dhruvambarvaliya@gmail.com</p>
            <p className="text-gray-600">kumbhaninevil111@gmail.com</p>
            <p className="text-gray-600">mitanshumakwana@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoCard;