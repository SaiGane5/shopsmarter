import React, { useState, useContext } from "react";
import ThemeContext from "../context/ThemeContext";

const Contact = () => {
  const { darkMode } = useContext(ThemeContext);
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleEmailClick = (email) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        darkMode
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-br from-gray-50 to-gray-100"
      }`}
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-pink-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-blue-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-8">
              Contact
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Our Team
              </span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-100 leading-relaxed">
              We're here to help you with any questions or support you need.
              Reach out to us and we'll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </div>

      {/* Email Block Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide">
                Emails
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Contact
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Support
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Select the appropriate email to reach us
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              className={`group relative cursor-pointer transform transition-all duration-500 hover:scale-105 ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } border rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden`}
              onClick={() => handleEmailClick("me22b133@smail.iitm.ac.in")}
            >
              <div className="relative p-8 text-center">
                <div
                  className={`p-6 rounded-lg ${
                    darkMode ? "bg-gray-700" : "bg-indigo-50"
                  }`}
                >
                  <p className="text-lg font-mono text-indigo-600 break-all">
                    me22b133@smail.iitm.ac.in
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`group relative cursor-pointer transform transition-all duration-500 hover:scale-105 ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } border rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden`}
              onClick={() => handleEmailClick("ch22b024@smail.iitm.ac.in")}
            >
              <div className="relative p-8 text-center">
                <div
                  className={`p-6 rounded-lg ${
                    darkMode ? "bg-gray-700" : "bg-indigo-50"
                  }`}
                >
                  <p className="text-lg font-mono text-indigo-600 break-all">
                    ch22b024@smail.iitm.ac.in
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`group relative cursor-pointer transform transition-all duration-500 hover:scale-105 ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } border rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden`}
              onClick={() => handleEmailClick("ch22b023@smail.iitm.ac.in")}
            >
              <div className="relative p-8 text-center">
                <div
                  className={`p-6 rounded-lg ${
                    darkMode ? "bg-gray-700" : "bg-indigo-50"
                  }`}
                >
                  <p className="text-lg font-mono text-indigo-600 break-all">
                    ch22b023@smail.iitm.ac.in
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div className={`py-20 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide">
                Our Location
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Visit Our
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {" "}
                Campus
              </span>
            </h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <div
              className={`group relative overflow-hidden rounded-3xl shadow-2xl ${
                darkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-200"
              } border transform hover:scale-105 transition-all duration-500`}
            >
              {/* Map Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="map-pattern"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="10" cy="10" r="2" fill="currentColor" />
                      <path
                        d="M0 10 L20 10 M10 0 L10 20"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        opacity="0.3"
                      />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#map-pattern)" />
                </svg>
              </div>

              <div className="relative p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  📍
                </div>

                <h3 className="text-3xl font-bold mb-4">IIT Madras</h3>
                <p
                  className={`text-xl mb-6 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Indian Institute of Technology Madras
                </p>

                <div
                  className={`inline-flex items-center px-6 py-3 rounded-xl ${
                    darkMode ? "bg-gray-600" : "bg-gray-100"
                  } mb-6`}
                >
                  <svg
                    className="w-5 h-5 text-green-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                  <span className="font-medium">Chennai, Tamil Nadu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slideInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Contact;
