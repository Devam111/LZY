// src/pages/FeaturesPage.jsx
import React from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

// Updated features data with all 8 features and unique color themes
const featuresData = [
  {
    title: 'Personalized Learning',
    description: 'Experience a truly custom learning environment with a personal dashboard displaying your courses and resources. Our AI-based summarization tools make revising complex content quicker and more efficient.',
    colors: {
      numberBg: 'bg-sky-400', numberText: 'text-white',
      boxBg: 'bg-sky-50', boxText: 'text-sky-800',
      iconBg: 'bg-sky-400',
    }
  },
  {
    title: 'Resource Sharing & Collaboration',
    description: 'Teachers can easily upload notes, presentations, videos, and GitHub links, creating a centralized learning hub. This encourages seamless interaction and ensures students have everything they need in one place.',
    colors: {
      numberBg: 'bg-teal-500', numberText: 'text-white',
      boxBg: 'bg-teal-50', boxText: 'text-teal-800',
      iconBg: 'bg-teal-500',
    }
  },
  {
    title: 'Smart Content Summarization',
    description: 'Our AI tools automatically summarize long YouTube videos and lengthy presentations, extracting key points for faster learning and creating short, readable notes for quick revision.',
    colors: {
      numberBg: 'bg-rose-500', numberText: 'text-white',
      boxBg: 'bg-rose-50', boxText: 'text-rose-800',
      iconBg: 'bg-rose-500',
    }
  },
  {
    title: 'Self-Paced Revision',
    description: 'Students can revisit all uploaded resources at any time, supporting a flexible learning pace. Built-in revision reminders help learners stay on track without the pressure of fixed schedules.',
    colors: {
      numberBg: 'bg-yellow-500', numberText: 'text-white',
      boxBg: 'bg-yellow-50', boxText: 'text-yellow-700',
      iconBg: 'bg-yellow-500',
    }
  },
  {
    title: 'Centralized Learning Hub',
    description: 'No more switching between apps. Learnsy combines notes, videos, presentations, and code repositories into one organized and structured platform for a streamlined learning experience.',
    colors: {
      numberBg: 'bg-indigo-500', numberText: 'text-white',
      boxBg: 'bg-indigo-50', boxText: 'text-indigo-800',
      iconBg: 'bg-indigo-500',
    }
  },
  {
    title: 'SaaS Model for Institutions',
    description: 'Learnsy is built as a scalable software-as-a-service model. Educational institutions can provide their students with a private, dedicated space with separate courses and resources.',
    colors: {
      numberBg: 'bg-green-600', numberText: 'text-white',
      boxBg: 'bg-green-50', boxText: 'text-green-800',
      iconBg: 'bg-green-600',
    }
  },
  {
    title: 'Interactive Assessments & Quizzes',
    description: 'Teachers can create quick quizzes and assignments to test understanding. With auto-evaluation for MCQs, students receive instant feedback to accelerate their learning loop.',
    colors: {
      numberBg: 'bg-pink-500', numberText: 'text-white',
      boxBg: 'bg-pink-50', boxText: 'text-pink-800',
      iconBg: 'bg-pink-500',
    }
  },
  {
    title: 'Progress Tracking & Analytics',
    description: 'Students can visualize their learning journey, tracking completed resources and pending revisions. Teachers gain insights into which materials are most engaging, helping identify areas for improvement.',
    colors: {
      numberBg: 'bg-slate-700', numberText: 'text-white',
      boxBg: 'bg-slate-100', boxText: 'text-slate-800',
      iconBg: 'bg-slate-700',
    }
  },
];

// Icons are defined here to keep the array cleaner
const icons = [
  // 1. Personalized Learning
  <svg key="icon-1" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>,
  // 2. Resource Sharing
  <svg key="icon-2" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path></svg>,
  // 3. Smart Summarization
  <svg key="icon-3" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>,
  // 4. Self-Paced Revision
  <svg key="icon-4" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
  // 5. Centralized Hub
  <svg key="icon-5" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9m-9 9a9 9 0 00-9-9"></path></svg>,
  // 6. SaaS Model
  <svg key="icon-6" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>,
  // 7. Assessments & Quizzes
  <svg key="icon-7" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
  // 8. Progress Tracking
  <svg key="icon-8" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>,
];


const FeaturesPage = () => {
  return (
    <div className="bg-white">
      <Header />

      <main className="bg-white">
        {/* Hero Section */}
        <div className="text-center py-20 sm:py-24 px-4 bg-gray-50">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-purple-800">
            Features That Empower
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the powerful tools and resources Learnsy offers to revolutionize your academic journey.
          </p>
        </div>

        {/* Alternating Features Section */}
        <div className="max-w-6xl mx-auto px-4 py-20 sm:py-24 space-y-24">
          {featuresData.map((feature, index) => (
            <div
              key={feature.title}
              className={`flex flex-col md:flex-row items-center gap-12 ${
                index % 2 !== 0 ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Number Circle */}
              <div className={`flex-shrink-0 w-40 h-40 lg:w-48 lg:h-48 rounded-full flex items-center justify-center shadow-lg ${feature.colors.numberBg}`}>
                <span className={`text-7xl lg:text-8xl font-black ${feature.colors.numberText}`}>
                  0{index + 1}
                </span>
              </div>
              
              {/* Feature Box */}
              <div className={`p-8 rounded-2xl shadow-lg border w-full flex-grow ${feature.colors.boxBg}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-md ${feature.colors.iconBg}`}>
                    {icons[index]}
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold ${feature.colors.boxText}`}>
                      {feature.title}
                    </h3>
                  </div>
                </div>
                <p className={`mt-5 leading-relaxed ${feature.colors.boxText} opacity-80`}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FeaturesPage;