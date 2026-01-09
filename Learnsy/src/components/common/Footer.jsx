import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

// You would typically import your authentication hook or context here
// For example: import { useAuth } from '../context/AuthContext';

const Footer = () => {
  // 1. Get the user's login status from your app's state management.
  // This is a placeholder. Replace it with your actual auth logic.
  const isLoggedIn = false; // <-- CHANGE THIS based on your app's auth state

  const navigate = useNavigate();

  // 2. This handler checks the login status before allowing navigation.
  const handleProtectedLinkClick = (event) => {
    // If the user is NOT logged in...
    if (!isLoggedIn) {
      // ...prevent the Link from going to its destination...
      event.preventDefault();
      // ...and send them to the login page instead.
      navigate('/login');
    }
    // If logged in, this function does nothing, and the link works normally.
  };

  return (
    <footer className="bg-gray-900 text-white w-full">
      <div className="px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-purple-400 mb-4">Learnsy</h3>
            <p className="text-gray-300 mb-4 max-w-md">
              Empowering educational institutions with comprehensive online learning solutions.
              AI-powered tools for enhanced student engagement and progress tracking.
            </p>
            {/* Social Icons... */}
            {/* --- Start of Changes: Social Icons with new styling and sequence --- */}
            <div className="flex items-center space-x-4 mt-6">
              {/* GitHub */}
              <a
                href="https://github.com/login"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-black transition-all duration-300"
                aria-label="GitHub"
              >
                <svg className="w-6 h-6 text-purple-500 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/login"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-[#0077B5] transition-all duration-300"
                aria-label="LinkedIn"
              >
                <svg className="w-6 h-6 text-purple-500 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>

              {/* X (formerly Twitter) */}
              <a
                href="https://twitter.com/login"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-white transition-all duration-300"
                aria-label="X"
              >
                <svg className="w-6 h-6 text-purple-500 group-hover:text-black transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/accounts/login/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gradient-to-tr hover:from-[#fd5949] hover:via-[#d6249f] hover:to-[#285AEB] transition-all duration-300"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6 text-purple-500 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6a3.6 3.6 0 0 0-3.6-3.6H7.6z M12 9a5 5 0 1 1-5 5a5 5 0 0 1 5-5m0 2a3 3 0 1 0 0 6a3 3 0 0 0 0-6zm4.7-2.3a1.2 1.2 0 1 1-1.2-1.2a1.2 1.2 0 0 1 1.2 1.2z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/login"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-[#1877F2] transition-all duration-300"
                aria-label="Facebook"
              >
                <svg className="w-6 h-6 text-purple-500 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.271 0-4.192 1.503-4.192 4.015v2.985z"/>
                </svg>
              </a>
            </div>
            {/* --- End of Changes --- */}
            
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link>
              </li>
              {/* ✨ 2. Replaced <a> with HashLink for smooth scrolling */}
              <li>
                <HashLink
                  smooth
                  to="/#pricing"
                  className="text-lg text-purple-600 hover:text-purple-800 transition-colors font-medium"
                >
                  Pricing
                </HashLink>
              </li>
              {/* 3. Apply the onClick handler to your protected links */}
              <li>
                <Link
                  to="/student-dashboard"
                  onClick={handleProtectedLinkClick}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Student Portal
                </Link>
              </li>
              <li>
                <Link
                  to="/faculty-dashboard"
                  onClick={handleProtectedLinkClick}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Faculty Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/features" className="text-gray-300 hover:text-white transition-colors">Features</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© 2024 Learnsy. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link>
            <Link to="/cookie-policy" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;