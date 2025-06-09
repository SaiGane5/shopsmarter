import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import ImageUploader from "../components/ImageUploader";
import ThemeContext from "../context/ThemeContext";

const ImageUpload = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const handleImageUpload = (imageData) => {
    console.log('🖼️ Image upload data received:', imageData);
    
    navigate("/results", {
      state: {
        features: imageData.features,
        uploadedImage: imageData.imageUrl, // Pass the uploaded image URL
      },
    });
  };

  return (
    <div
      className={`min-h-screen relative overflow-hidden transition-all duration-700 ${
        darkMode 
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white" 
          : "bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900"
      }`}
    >
      {/* Professional Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating geometric shapes */}
        <div className={`absolute top-20 left-10 w-32 h-32 rounded-full opacity-30 animate-float-1 ${
          darkMode ? "bg-gradient-to-r from-purple-600 to-pink-600" : "bg-gradient-to-r from-blue-400 to-indigo-400"
        }`}></div>
        <div className={`absolute top-40 right-20 w-24 h-24 rounded-lg opacity-25 animate-float-2 transform rotate-45 ${
          darkMode ? "bg-gradient-to-r from-indigo-600 to-blue-600" : "bg-gradient-to-r from-purple-400 to-pink-400"
        }`}></div>
        <div className={`absolute bottom-32 left-1/4 w-20 h-20 rounded-full opacity-20 animate-float-3 ${
          darkMode ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-emerald-400 to-cyan-400"
        }`}></div>
        <div className={`absolute bottom-20 right-1/3 w-28 h-28 rounded-lg opacity-30 animate-float-4 transform rotate-12 ${
          darkMode ? "bg-gradient-to-r from-orange-600 to-red-600" : "bg-gradient-to-r from-orange-400 to-red-400"
        }`}></div>

        {/* Animated mesh gradient overlay */}
        <div className={`absolute inset-0 opacity-20 ${
          darkMode ? "bg-gradient-mesh-dark" : "bg-gradient-mesh-light"
        } animate-gradient-shift`}></div>

        {/* Flowing particles */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full opacity-40 animate-particle-${(i % 4) + 1} ${
                darkMode ? "bg-indigo-400" : "bg-purple-500"
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${8 + Math.random() * 4}s`
              }}
            ></div>
          ))}
        </div>

        {/* Subtle grid pattern */}
        <div 
          className={`absolute inset-0 opacity-5 ${
            darkMode ? "bg-grid-dark" : "bg-grid-light"
          }`}
          style={{
            backgroundImage: `
              linear-gradient(${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px),
              linear-gradient(90deg, ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>

      <main className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-slide-up">
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Visual
              </span>
              <br />
              <span className={`${darkMode ? "text-white" : "text-gray-900"}`}>
                Product Search
              </span>
            </h1>
            <p className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}>
              Upload any product image and discover similar items instantly with advanced AI technology
            </p>
          </div>

          {/* Main Upload Card */}
          <div
            className={`relative p-10 md:p-16 rounded-4xl shadow-3xl border backdrop-blur-xl transition-all duration-500 transform hover:scale-[1.01] ${
              darkMode
                ? "bg-slate-800/60 border-slate-700/30 shadow-black/30"
                : "bg-white/70 border-white/30 shadow-gray-500/20"
            }`}
          >
            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-4xl bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 animate-gradient-border"></div>
            
            <ImageUploader onImageUpload={handleImageUpload} />

            {/* Enhanced How it works section */}
            <div className="mt-16 pt-12 border-t border-opacity-20 border-gray-300">
              <h2 className="text-3xl font-bold mb-12 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                How Our AI Technology Works
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    step: "01",
                    title: "Image Upload",
                    description: "Securely upload your product image with advanced preprocessing",
                    icon: "📤",
                    gradient: "from-blue-500 to-indigo-600"
                  },
                  {
                    step: "02", 
                    title: "AI Analysis",
                    description: "Deep learning models extract visual patterns and features",
                    icon: "🧠",
                    gradient: "from-purple-500 to-pink-600"
                  },
                  {
                    step: "03",
                    title: "Smart Matching", 
                    description: "Advanced algorithms find similar products across databases",
                    icon: "🎯",
                    gradient: "from-emerald-500 to-teal-600"
                  },
                  {
                    step: "04",
                    title: "Instant Results",
                    description: "Get curated results with price comparisons and ratings",
                    icon: "⚡",
                    gradient: "from-orange-500 to-red-600"
                  }
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`relative p-8 rounded-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 ${
                      darkMode 
                        ? "bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/30" 
                        : "bg-white/60 hover:bg-white/80 border border-gray-200/30"
                    } backdrop-blur-sm`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Step number with gradient */}
                    <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-r ${item.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                      {item.step}
                    </div>
                    
                    <div className="text-4xl mb-6 text-center">{item.icon}</div>
                    <h3 className="text-xl font-bold mb-4 text-center">{item.title}</h3>
                    <p className={`text-center leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(45deg); }
          50% { transform: translateY(-30px) rotate(225deg); }
        }

        @keyframes float-3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-25px); }
        }

        @keyframes float-4 {
          0%, 100% { transform: translateY(0px) rotate(12deg); }
          50% { transform: translateY(-35px) rotate(192deg); }
        }

        @keyframes particle-1 {
          0% { transform: translateY(100vh) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(50px); opacity: 0; }
        }

        @keyframes particle-2 {
          0% { transform: translateY(100vh) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(-30px); opacity: 0; }
        }

        @keyframes particle-3 {
          0% { transform: translateY(100vh) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
        }

        @keyframes particle-4 {
          0% { transform: translateY(100vh) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(-40px); opacity: 0; }
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes gradient-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-slide-up {
          animation: slide-up 1s ease-out;
        }

        .animate-float-1 {
          animation: float-1 6s ease-in-out infinite;
        }

        .animate-float-2 {
          animation: float-2 8s ease-in-out infinite;
        }

        .animate-float-3 {
          animation: float-3 7s ease-in-out infinite;
        }

        .animate-float-4 {
          animation: float-4 9s ease-in-out infinite;
        }

        .animate-particle-1 {
          animation: particle-1 linear infinite;
        }

        .animate-particle-2 {
          animation: particle-2 linear infinite;
        }

        .animate-particle-3 {
          animation: particle-3 linear infinite;
        }

        .animate-particle-4 {
          animation: particle-4 linear infinite;
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }

        .animate-gradient-border {
          background-size: 200% 200%;
          animation: gradient-border 3s ease infinite;
        }

        .rounded-4xl {
          border-radius: 2rem;
        }

        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
};

export default ImageUpload;
