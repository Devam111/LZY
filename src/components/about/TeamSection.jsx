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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12"> {/* Adjusted grid for 4 members */}
          {/* Team Member 1 */}
          <div className="flex flex-col items-center">
            <img
              src="https://via.placeholder.com/150/8b5cf6/ffffff?text=M.Y." // Placeholder image
              alt="Devam Bhikadiya"
              className="w-40 h-40 rounded-full object-cover mb-8 shadow-2xl border-4 border-purple-200 shadow-purple-500"
            />
            <h3 className="text-xl font-bold text-purple-700">Devam Bhikadiya</h3>
            <p className="text-gray-600 font-bold">CEO</p>
          </div>
          {/* Team Member 2 */}
          <div className="flex flex-col items-center">
            <img
              src="https://via.placeholder.com/150/a78bfa/ffffff?text=D.K." // Placeholder image
              alt="Dhruvam Barvaliya"
              className="w-40 h-40 rounded-full object-cover mb-8 shadow-2xl border-4 border-purple-200 shadow-purple-500"
            />
            <h3 className="text-xl font-bold text-purple-700">Dhruvam Barvaliya</h3>
            <p className="text-gray-600 font-bold">CMO</p>
          </div>
          {/* Team Member 3 */}
          <div className="flex flex-col items-center">
            <img
              src="https://via.placeholder.com/150/c4b5fd/ffffff?text=D.S." // Placeholder image
              alt="Nevil Kumbhani"
              className="w-40 h-40 rounded-full object-cover mb-8 shadow-2xl border-4 border-purple-200 shadow-purple-500"
            />
            <h3 className="text-xl font-bold text-purple-700">Nevil Kumbhani</h3>
            <p className="text-gray-600 font-bold">CFO</p>
          </div>
          {/* Team Member 4 - NEW */}
          <div className="flex flex-col items-center">
            <img
              src="https://via.placeholder.com/150/d8b4fe/ffffff?text=N.P."
              alt="Mitanshu Makwana"
              className="w-40 h-40 rounded-full object-cover mb-8 shadow-2xl border-4 border-purple-200 shadow-purple-500"
            />
            <h3 className="text-xl font-bold text-purple-700">Mitanshu Makwana</h3>
            <p className="text-gray-600 font-bold">COO</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;