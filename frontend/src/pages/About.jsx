import React, { useContext } from "react";
import ThemeContext from "../context/ThemeContext";

const About = () => {
  const { darkMode } = useContext(ThemeContext);

  const teamMembers = [
    {
      name: "Sai Ganesh",
      avatar: "👨‍💻",
      color: "from-indigo-500 to-blue-600",
    },
    {
      name: "Yashwanth Varma",
      avatar: "👨‍💻",
      color: "from-green-500 to-teal-600",
    },
    {
      name: "Rushikesh Kapale",
      avatar: "👨‍💻",
      color: "from-purple-500 to-pink-600",
    },
  ];

  const projectFeatures = [
    {
      icon: "📷",
      title: "Visual Search Technology",
      description:
        "Upload any image and our AI instantly analyzes visual features to find similar products across our database.",
    },
    {
      icon: "🧠",
      title: "Advanced Computer Vision",
      description:
        "Powered by deep learning models that understand colors, patterns, shapes, and product characteristics.",
    },
    {
      icon: "⚡",
      title: "Instant Results",
      description:
        "Get accurate product matches in seconds with our optimized search algorithms and efficient indexing.",
    },
    {
      icon: "🎯",
      title: "Precision Matching",
      description:
        "Our AI understands context and delivers highly relevant results based on visual similarity.",
    },
  ];

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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-8">
              About
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                ShopSmarter
              </span>
            </h1>
            <p className="mt-6 max-w-4xl mx-auto text-xl text-gray-100 leading-relaxed">
              We're revolutionizing online shopping with cutting-edge AI-powered
              visual search technology. Simply upload any image and discover
              similar products instantly with unprecedented accuracy.
            </p>
          </div>
        </div>
      </div>

      {/* AI Technology Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide">
                Our Technology
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Powered by
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Artificial Intelligence
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              ShopSmarter leverages advanced computer vision and machine
              learning to understand what you're looking for and deliver precise
              product recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {projectFeatures.map((feature, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transform transition-all duration-500 hover:scale-105 ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                } border p-8 text-center`}
                style={{
                  animationDelay: `${index * 0.2}s`,
                  animationFillMode: "both",
                }}
              >
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {feature.icon}
                  </div>

                  <h3 className="text-xl font-bold mb-4 group-hover:text-indigo-600 transition-colors duration-200">
                    {feature.title}
                  </h3>

                  <p
                    className={`leading-relaxed ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* How It Works Visual */}
          <div
            className={`mt-20 p-12 rounded-3xl ${
              darkMode ? "bg-gray-800" : "bg-white"
            } shadow-2xl border ${
              darkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4">How ShopSmarter Works</h3>
              <p
                className={`text-lg ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Experience the future of shopping with our three-step AI process
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connection Lines */}
              <div className="hidden md:block absolute top-1/2 left-1/3 w-1/3 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transform -translate-y-1/2"></div>
              <div className="hidden md:block absolute top-1/2 right-1/3 w-1/3 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transform -translate-y-1/2"></div>

              {[
                {
                  step: "01",
                  title: "Upload Image",
                  description:
                    "Simply drag and drop or upload any product image",
                  icon: "📤",
                },
                {
                  step: "02",
                  title: "AI Analysis",
                  description:
                    "Our computer vision AI analyzes visual features instantly",
                  icon: "🔍",
                },
                {
                  step: "03",
                  title: "Get Results",
                  description:
                    "Discover similar products with high accuracy matches",
                  icon: "✨",
                },
              ].map((item, index) => (
                <div key={index} className="text-center relative">
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {item.step}
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg">
                    {item.icon}
                  </div>
                  <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                  <p
                    className={`${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className={`py-20 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide">
                Our Team
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Meet Our
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {" "}
                Amazing Team
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The brilliant minds behind ShopSmarter's innovative AI technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transform transition-all duration-500 hover:scale-105 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-gray-50 border-gray-200"
                } border`}
                style={{
                  animationDelay: `${index * 0.2}s`,
                  animationFillMode: "both",
                }}
              >
                {/* Animated Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${member.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                ></div>

                <div className="relative p-8 text-center">
                  <div
                    className={`w-24 h-24 bg-gradient-to-r ${member.color} rounded-full flex items-center justify-center text-4xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    {member.avatar}
                  </div>

                  <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-600 transition-colors duration-200">
                    {member.name}
                  </h3>
                </div>
              </div>
            ))}
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

export default About;
