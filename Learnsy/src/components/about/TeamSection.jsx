
// src/components/about/TeamSection.jsx
import React from 'react';

const TeamSection = () => {
  return (
    <section id="team" className="py-20 md:py-24 bg-gray-200 px-4">
      <div className="max-w-7xl mx-auto text-center"> {/* Adjusted max-w for more space */}
        <span className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium mb-4 shadow-sm">
          <span>MEET OUR TEAM</span>
        </span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-purple-800 mb-4">
          The Minds Behind <span className="text-purple-600">Learnsy</span>
        </h2>
        <div className="w-20 h-1 bg-purple-600 mx-auto mb-10"></div>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-16">
          Our team combines technical expertise, educational insight, and creative vision to
          create an exceptional learning platform.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Team Member 1 */}
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <img
                src="/dvm.png"
                alt="Devam Bhikadiya"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <div className="absolute inset-0 rounded-full bg-purple-500 opacity-20 blur-xl"></div>
            </div>
            <h3 className="text-lg font-semibold text-purple-700 mb-1">Devam Bhikadiya</h3>
          </div>
          
          {/* Team Member 2 */}
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <img
                src="/dhm.png"
                alt="Dhruvam Barvaliya"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <div className="absolute inset-0 rounded-full bg-purple-500 opacity-20 blur-xl"></div>
            </div>
            <h3 className="text-lg font-semibold text-purple-700 mb-1">Dhruvam Barvaliya</h3>
          </div>
          
          {/* Team Member 3 */}
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <img
                src="/nvl.png"
                alt="Nevil Kumbhani"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <div className="absolute inset-0 rounded-full bg-purple-500 opacity-20 blur-xl"></div>
            </div>
            <h3 className="text-lg font-semibold text-purple-700 mb-1">Nevil Kumbhani</h3>
          </div>
          
          {/* Team Member 4 */}
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <img
                src="/mit.png"
                alt="Mitanshu Makwana"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <div className="absolute inset-0 rounded-full bg-purple-500 opacity-20 blur-xl"></div>
            </div>
            <h3 className="text-lg font-semibold text-purple-700 mb-1">Mitanshu Makwana</h3>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;