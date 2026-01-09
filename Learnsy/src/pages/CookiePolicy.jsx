// src/pages/CookiePolicyPage.jsx
import React from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const CookiePolicyPage = () => {
  return (
    <div className="bg-white">
      <Header />

      <main className="bg-gray-50 py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-10 sm:p-12 rounded-lg shadow-2xl shadow-black border border-gray-200">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-purple-800">
              Cookie Policy
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Last Updated: August 29, 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
            <h2 className="text-2xl font-bold text-purple-700 pt-6">What Are Cookies?</h2>
            <p>
              As is common practice with almost all professional websites, this site uses cookies, which are tiny files that are downloaded to your computer, to improve your experience. This page describes what information they gather, how we use it, and why we sometimes need to store these cookies.
            </p>

            <h2 className="text-2xl font-bold text-purple-700 pt-6">How We Use Cookies</h2>
            <p>
              We use cookies for a variety of reasons detailed below. Unfortunately, in most cases, there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site.
            </p>
            <ul>
              <li>
                <strong>Account related cookies:</strong> If you create an account with us, then we will use cookies for the management of the signup process and general administration. These cookies will usually be deleted when you log out.
              </li>
              <li>
                <strong>Login related cookies:</strong> We use cookies when you are logged in so that we can remember this fact. This prevents you from having to log in every single time you visit a new page.
              </li>
              <li>
                <strong>Analytics cookies:</strong> We may use third-party cookies to track and measure usage of this Site so that we can continue to produce engaging content. These cookies may track things such as how long you spend on the Site or pages you visit which helps us to understand how we can improve the Site for you.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-purple-700 pt-6">Your Choices Regarding Cookies</h2>
            <p>
              You can prevent the setting of cookies by adjusting the settings on your browser (see your browser Help for how to do this). Be aware that disabling cookies will affect the functionality of this and many other websites that you visit. Disabling cookies will usually result in also disabling certain functionality and features of this site.
            </p>

            <h2 className="text-2xl font-bold text-purple-700 pt-6">Contact Us</h2>
            <p>
              If you have questions or comments about this Cookie Policy, please contact us at:
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

export default CookiePolicyPage;