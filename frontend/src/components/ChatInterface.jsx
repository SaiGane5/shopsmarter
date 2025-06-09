import React, { useState, useRef, useEffect, useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

const ChatInterface = ({ onSendMessage, loading, onClose }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm Aurra, your AI shopping assistant. I can help you refine your search results, find specific items, or answer questions about products. What can I help you with today?", 
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    // Smooth entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-focus input when component mounts
    if (inputRef.current && isVisible) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { 
      id: messages.length + 1, 
      text: input, 
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      await onSendMessage(input);
      
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { 
            id: prev.length + 1, 
            text: "Perfect! I've updated your product recommendations based on your request. You should see the refined results above. Is there anything else I can help you find?", 
            sender: 'bot',
            timestamp: new Date()
          }
        ]);
        setIsTyping(false);
      }, 1200);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { 
            id: prev.length + 1, 
            text: "I apologize, but I encountered an issue processing your request. Please try rephrasing your query or try again in a moment.", 
            sender: 'bot',
            timestamp: new Date()
          }
        ]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedPrompts = [
    "Show me cheaper options",
    "Find items under $50",
    "Show me blue items only",
    "Find formal wear",
    "Show trending products",
    "Filter by women's clothing"
  ];

  const handleSuggestedPrompt = (prompt) => {
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  return (
    <>
      <div className={`w-96 h-[600px] flex flex-col rounded-2xl shadow-2xl border overflow-hidden transition-all duration-500 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
      } ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Enhanced Header */}
        <div className={`p-4 border-b flex items-center justify-between relative overflow-hidden ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-x"></div>
          
          <div className="flex items-center space-x-3 relative z-10">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg animate-pulse-slow">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse">
                <div className="w-full h-full bg-green-400 rounded-full animate-ping"></div>
              </div>
            </div>
            <div>
              <h3 className={`font-bold text-lg ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>Aurra</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-green-500 font-medium">AI Assistant • Online</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className={`p-2 rounded-xl transition-all duration-200 relative z-10 hover:scale-110 active:scale-95 ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-red-50 text-gray-500 hover:text-red-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Messages Area with Hidden Scrollbar */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 aurra-chat-scrollbar ${
          darkMode ? 'bg-gray-800' : 'bg-gradient-to-b from-gray-50/50 to-white'
        }`}>
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex transition-all duration-300 ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className={`max-w-[85%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                {message.sender === 'bot' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-xs">A</span>
                    </div>
                    <span className={`text-xs font-medium ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Aurra</span>
                  </div>
                )}
                
                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md ml-4'
                      : darkMode 
                        ? 'bg-gray-700 text-gray-100 rounded-bl-md border border-gray-600 mr-4' 
                        : 'bg-white text-gray-800 rounded-bl-md border border-gray-200 shadow-md mr-4'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
                
                <div className={`mt-1 text-xs ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                } ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {/* Enhanced Typing Indicator */}
          {(isTyping || loading) && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[85%]">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                    <span className="text-white font-bold text-xs">A</span>
                  </div>
                  <span className={`text-xs font-medium ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Aurra is typing...</span>
                </div>
                
                <div className={`px-4 py-3 rounded-2xl rounded-bl-md shadow-sm mr-4 ${
                  darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200 shadow-md'
                }`}>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Suggested Prompts */}
        {messages.length <= 1 && (
          <div className={`px-4 pb-2 transition-all duration-300 ${
            darkMode ? 'bg-gray-800' : 'bg-gradient-to-t from-white to-gray-50/50'
          }`}>
            <p className={`text-xs mb-3 font-medium ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>✨ Try asking Aurra:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.slice(0, 4).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-purple-500 hover:text-purple-300' 
                      : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-sm'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Enhanced Input Area */}
        <div className={`p-4 border-t ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message to Aurra..."
                className={`w-full resize-none rounded-xl p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                  darkMode 
                    ? 'bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:bg-gray-600' 
                    : 'bg-gray-50 text-gray-900 placeholder-gray-500 border border-gray-300 focus:bg-white focus:shadow-sm'
                }`}
                rows="1"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading || isTyping}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                  !input.trim() || loading || isTyping
                    ? 'text-gray-400 cursor-not-allowed'
                    : darkMode
                      ? 'text-indigo-400 hover:bg-indigo-900/20 hover:scale-110'
                      : 'text-indigo-600 hover:bg-indigo-50 hover:scale-110'
                } active:scale-95`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className={`mt-2 text-xs flex items-center justify-between ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <span>Press Enter to send • Shift + Enter for new line</span>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs">Powered by AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles for Smooth Animations and Hidden Scrollbar */}
      <style jsx>{`
        .aurra-chat-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        .aurra-chat-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
        
        @keyframes gradient-x {
          0%, 100% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default ChatInterface;
