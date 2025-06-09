import React, { useState, useEffect } from 'react';

const FloatingChatButton = ({ onClick, hasNewMessage = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    // Show button after a short delay for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          className={`relative group flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-full shadow-lg transform transition-all duration-500 ease-out hover:scale-110 hover:shadow-2xl active:scale-95 ${
            isVisible ? 'animate-bounce-in' : ''
          } ${isPressed ? 'scale-95' : ''}`}
          aria-label="Chat with Aurra - AI Assistant"
        >
          {/* Animated Glow Effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-pulse opacity-75 blur-sm"></div>
          
          {/* Outer Ring Animation */}
          <div className={`absolute inset-0 rounded-full border-2 border-white/30 transition-all duration-700 ${
            isHovered ? 'scale-125 opacity-0' : 'scale-100 opacity-100'
          }`}></div>
          
          {/* Button Content */}
          <div className="relative z-10 flex items-center justify-center">
            <svg 
              className={`w-8 h-8 transition-all duration-300 ${
                isHovered ? 'scale-110 rotate-12' : 'scale-100 rotate-0'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
              />
            </svg>
          </div>

          {/* Notification Badge */}
          {hasNewMessage && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce border-2 border-white shadow-lg">
              <span className="animate-pulse">!</span>
            </div>
          )}

          {/* Click Ripple Effect */}
          <div className={`absolute inset-0 rounded-full bg-white transition-all duration-300 ${
            isPressed ? 'opacity-30 scale-110' : 'opacity-0 scale-100'
          }`}></div>
        </button>

        {/* Enhanced Tooltip */}
        <div className={`absolute bottom-20 right-0 mb-2 px-4 py-3 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-xl shadow-2xl transition-all duration-300 whitespace-nowrap border border-gray-700/50 ${
          isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
        }`}>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-medium">Chat with Aurra</span>
          </div>
          <div className="text-xs text-gray-300 mt-1">AI Shopping Assistant</div>
          <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.15) rotate(-90deg);
            opacity: 0.8;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </>
  );
};

export default FloatingChatButton;
