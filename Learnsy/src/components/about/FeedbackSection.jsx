// src/components/about/FeedbackSection.jsx
import React, { useState } from 'react';


const FeedbackSection = () => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleRatingClick = (starIndex) => {
    setRating(starIndex + 1);
  };

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    console.log('Feedback Submitted:', { feedback, rating });
    alert('Thank you for your feedback!');
    setFeedback('');
    setRating(0);
  };

  return (
    <section className="py-20 md:py-24 bg-gray-200 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <span className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium mb-4 shadow-sm">
          <span>Your Thoughts Matter</span>
        </span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-purple-800 mb-4">
          Share Your <span className="text-purple-600">Feedback</span>
        </h2>
        <p className="text-lg text-gray-700 max-w-xl mx-auto mb-10">
          Help us improve by sharing your experience with Learnsy. Your insights drive our innovation.
        </p>

        <div className="bg-white p-8 rounded-lg shadow-2xl border border-gray-200 shadow-black">
          <form onSubmit={handleSubmitFeedback}>
            <div className="mb-6 text-left">
              <label htmlFor="feedback" className="block text-gray-700 text-lg font-medium mb-2">
                Your Feedback
              </label>
              <textarea
                id="feedback"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none bg-gray-100"
                rows="5"
                placeholder="Share your thoughts about Learnsy..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="mb-8 text-left">
              <p className="block text-gray-700 text-lg font-medium mb-2">
                Rate Your Experience
              </p>
              <div className="flex space-x-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-8 h-8 cursor-pointer transition-colors duration-200 ${
                      i < rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    onClick={() => handleRatingClick(i)}
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg shadow-lg hover:from-purple-700 hover:to-purple-900 transition-all duration-300 text-lg font-semibold"
            >
              Submit Feedback
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default FeedbackSection;