// src/pages/TermsOfServicePage.jsx
import React from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const TermsOfService = () => {
  return (
    <div className="bg-white">
      <Header />

      <main className="bg-gray-50 py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-10 sm:p-12 rounded-lg shadow-2xl shadow-black border border-gray-200">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-purple-800">
              Terms of Service
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Last Updated: August 29, 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
            <h2 className="text-2xl font-bold text-purple-700 pt-6">1. Agreement to Terms</h2>
            <p>
              By accessing or using the Learnsy platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, then you may not access the Service.
            </p>

            <h2 className="text-2xl font-bold text-purple-700 pt-6">2. User Accounts</h2>
            <p>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
            </p>

            <h2 className="text-2xl font-bold text-purple-700 pt-6">3. Prohibited Activities</h2>
            <p>
              You may not access or use the Site for any purpose other than that for which we make the Site available. As a user of the Site, you agree not to:
            </p>
            <ul>
              <li>Systematically retrieve data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
              <li>Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.</li>
              <li>Interfere with, disrupt, or create an undue burden on the Site or the networks or services connected to the Site.</li>
            </ul>

            <h2 className="text-2xl font-bold text-purple-700 pt-6">4. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            
            <h2 className="text-2xl font-bold text-purple-700 pt-6">5. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
            </p>

            <h2 className="text-2xl font-bold text-purple-700 pt-6">6. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
              <br />
              <a href="mailto:support@learnsy.com" className="text-purple-600 hover:underline font-medium">
                support@learnsy.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;