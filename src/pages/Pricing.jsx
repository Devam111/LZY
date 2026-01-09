import React from 'react';

const Pricing = () => {
  // Placeholder function for handling the "Start for Free" button click.
  // You can replace this with your actual navigation or sign-up logic.
  const handleGetStarted = () => {
    console.log("Redirecting to sign-up or getting started page...");
    // Example: window.location.href = '/signup';
  };

  // Placeholder function for handling plan selection.
  // You can replace this with logic to redirect to a checkout page with the selected plan.
  const handleChoosePlan = (plan) => {
    console.log(`Selected Plan: ${plan}`);
    // Example: window.location.href = `/checkout?plan=${plan}`;
  };

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 w-full">
      <div className="w-full text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Flexible Plans for Every Student
        </h2>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Unlock your full potential with our affordable subscription plans. 
          Choose the one that fits your learning journey.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          
          {/* Free Trial Plan */}
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col border-2 border-dashed transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:border-solid hover:border-purple-600">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Free Trial</h3>
            <p className="text-4xl font-extrabold text-gray-900 mb-2">Free</p>
            <ul className="text-gray-600 space-y-2 mb-8 text-left text-sm">
              <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>First 3 videos per course</li>
              <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>First 2 documents per course</li>
              <li className="flex items-center text-gray-400"><svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>No Notes Access</li>
              <li className="flex items-center text-gray-400"><svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>No AI Powered Tools</li>
            </ul>
            <button onClick={handleGetStarted} className="mt-auto w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors">Start for Free</button>
          </div>

          {/* 1 Month Plan */}
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col border-2 border-transparent transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:border-purple-600">
            <h3 className="text-xl font-bold text-gray-800 mb-4">1 Month</h3>
            <p className="text-4xl font-extrabold text-gray-900 mb-4">₹149</p>
            <ul className="text-gray-600 space-y-2 mb-8 text-left text-sm">
              <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Full Course Access</li>
              <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>AI Learning Tools</li>
              <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Progress Tracking</li>
            </ul>
            <button onClick={() => handleChoosePlan('1 Month')} className="mt-auto w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors">Choose Plan</button>
          </div>
          
          {/* 3 Months Plan */}
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col border-2 border-transparent transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:border-purple-600">
            <h3 className="text-xl font-bold text-gray-800 mb-4 ">3 Months</h3>
            <p className="text-4xl font-extrabold text-gray-900 mb-2">₹349</p>
            <p className="text-sm text-gray-500 mb-4">(~₹116/mo)</p>
            <ul className="text-gray-600 space-y-2 mb-8 text-left text-sm">
              <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Full Course Access</li>
              <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>AI Learning Tools</li>
              <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Progress Tracking</li>
            </ul>
            <button onClick={() => handleChoosePlan('3 Months')} className="mt-auto w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors">Choose Plan</button>
          </div>

          {/* 6 Months Plan (Highlighted) */}
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col relative border-2 border-transparent transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:border-purple-600">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</span>
            <h3 className="text-xl font-bold text-gray-800 mb-4">6 Months</h3>
            <p className="text-4xl font-extrabold text-gray-900 mb-2">₹649</p>
            <p className="text-sm text-gray-500 mb-4">(~₹108/mo)</p>
            <ul className="text-gray-600 space-y-2 mb-8 text-left text-sm">
              <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Full Course Access</li>
              <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>AI Learning Tools</li>
              <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Progress Tracking</li>
            </ul>
            <button onClick={() => handleChoosePlan('6 Months')} className="mt-auto w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">Choose Plan</button>
          </div>

          {/* 12 Months Plan */}
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col border-2 border-transparent transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:border-purple-600">
            <h3 className="text-xl font-bold text-gray-800 mb-4">12 Months</h3>
            <p className="text-4xl font-extrabold text-gray-900 mb-2">₹1099</p>
            <p className="text-sm text-gray-500 mb-4">(~₹92/mo)</p>
            <ul className="text-gray-600 space-y-2 mb-8 text-left text-sm">
              <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Full Course Access</li>
              <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>AI Learning Tools</li>
              <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Progress Tracking</li>
            </ul>
            <button onClick={() => handleChoosePlan('12 Months')} className="mt-auto w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors">Choose Plan</button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Pricing;