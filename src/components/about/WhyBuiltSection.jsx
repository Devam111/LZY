// src/components/about/WhyBuiltSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const WhyBuiltSection = () => {
  return (
    <section id="why-built" className="py-20 md:py-24 bg-gray-100 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-purple-800 mb-8">
          Why <span className="text-purple-600">we</span> built Learnsy
        </h2>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
          In the heart of every student's journey lies a common challenge: the overwhelming sea of information, disconnected resources,
          and the struggle to find clarity in complex subjects. We witnessed this firsthand during our academic years, where brilliant
          minds were often held back not by lack of ability, but by the absence of a unified platform that could bridge the gap between
          knowledge and understanding.
        </p>
        <p className="text-lg text-gray-700 mb-10 leading-relaxed font-semibold">
          <span className="text-purple-700">Learnsy was born from a simple yet powerful vision: to transform how students learn, collaborate, and grow together.</span> We
          envisioned a platform where quality resources meet community support, where complex concepts become accessible through
          collaborative learning, and where every student, regardless of their background, can find the tools and support they need to
          excel.
        </p>
      </div>
    </section>
  );
};

export default WhyBuiltSection;