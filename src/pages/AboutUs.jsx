// src/pages/AboutUsPage.jsx
import React from 'react';
import { Link as ScrollLink } from 'react-scroll';

// Import your other components
import TeamSection from '../components/about/TeamSection';
import WhyBuiltSection from '../components/about/WhyBuiltSection';
import FeedbackSection from '../components/about/FeedbackSection';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const AboutUs = () => {
  return (
    <div className="bg-white text-gray-800">
      <Header />

      {/* Section 1: Hero Section */}
      {/* FIXED: Added min-h-screen to make this section fill the screen height */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-20 md:py-32 bg-gray-100">
        <span className="inline-flex items-center bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium mb-4 shadow-sm">
          Revolutionizing Education
        </span>

        <h1 className="text-4xl md:text-6xl font-extrabold text-purple-800 mb-6 leading-tight">
          Learnsy - Get Prepared Together!
        </h1>
        <p className="max-w-3xl text-lg md:text-xl text-gray-700 mb-10">
          With the intention of learning and growing together, our team has built
          this platform to revolutionize your academic journey.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <ScrollLink
            to="team"
            smooth={true}
            duration={500}
            offset={-20}
            className="cursor-pointer bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-950 transition-colors"
          >
            Meet Our Team
          </ScrollLink>
          
          <ScrollLink
            to="why-built"
            smooth={true}
            duration={500}
            offset={-70}
            className="cursor-pointer border-2 border-purple-600 text-black px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 hover:border-purple-800 transition-colors"
          >
            Our Journey
          </ScrollLink>
        </div>
      </section>

      {/* These sections will now be below the initial view */}
      <TeamSection />
      <WhyBuiltSection />
      <FeedbackSection />
      <Footer />
    </div>
  );
};

export default AboutUs;