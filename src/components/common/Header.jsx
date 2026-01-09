import React, { useState } from 'react';
// Import Link and useNavigate from react-router-dom
import { Link, useNavigate } from 'react-router-dom';
// ✨ 1. Import HashLink
import { HashLink } from 'react-router-hash-link';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // A mock login state for demonstration purposes
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm w-full sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-4xl font-bold text-purple-600">
              Learnsy
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-lg text-purple-600 hover:text-purple-800 transition-colors font-medium"
            >
              Home
            </Link>
            
            {/* ✨ 2. Replaced <a> with HashLink for smooth scrolling */}
            <HashLink
              smooth
              to="/#pricing"
              className="text-lg text-purple-600 hover:text-purple-800 transition-colors font-medium"
            >
              Pricing
            </HashLink>

            <Link
              to="/about"
              className="text-lg text-purple-600 hover:text-purple-800 transition-colors font-medium"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-lg text-purple-600 hover:text-purple-800 transition-colors font-medium"
            >
              Contact Us
            </Link>
            <Link
              to="/login"
              className="text-lg text-purple-600 hover:text-purple-800 transition-colors font-medium"
            >
              Student Portal
            </Link>
            <Link
              to="/login"
              className="text-lg text-purple-600 hover:text-purple-800 transition-colors font-medium"
            >
              Faculty Portal
            </Link>
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="bg-black text-white px-5 py-2 rounded-lg text-base font-medium hover:bg-gray-800 transition-colors"
              >
                Logout
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-purple-600 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/"
                className="block rounded-md px-3 py-2 text-base font-medium text-purple-600 hover:bg-purple-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>

              {/* ✨ 3. Also replaced the mobile link with HashLink */}
              <HashLink
                smooth
                to="/#pricing"
                className="block rounded-md px-3 py-2 text-base font-medium text-purple-600 hover:bg-purple-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </HashLink>

              <Link
                to="/about"
                className="block rounded-md px-3 py-2 text-base font-medium text-purple-600 hover:bg-purple-50"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="block rounded-md px-3 py-2 text-base font-medium text-purple-600 hover:bg-purple-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact Us
              </Link>
              <Link
                to="/login"
                className="block rounded-md px-3 py-2 text-base font-medium text-purple-600 hover:bg-purple-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Student Portal
              </Link>
              <Link
                to="/login"
                className="block rounded-md px-3 py-2 text-base font-medium text-purple-600 hover:bg-purple-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Faculty Portal
              </Link>
              {isLoggedIn && (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left mt-2 px-3 py-2 text-base font-medium text-white bg-black rounded-md hover:bg-gray-800"
                  >
                    Logout
                  </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;