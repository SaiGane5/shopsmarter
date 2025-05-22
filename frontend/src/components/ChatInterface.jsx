import React, { useState, useRef, useEffect, useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

const ChatInterface = ({ onSendMessage }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your shopping assistant. You can ask me to refine your search results or find specific items.", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
  if (!input.trim()) return;
  
  const userMessage = { id: messages.length + 1, text: input, sender: 'user' };
  setMessages([...messages, userMessage]);
  setInput('');
  setLoading(true);
  
  try {
    // Call the refine endpoint with the user's prompt
    await onSendMessage(input);
    
    // Add bot response
    setMessages(prev => [
      ...prev,
      { 
        id: prev.length + 1, 
        text: "I've refined your results based on your request. Check out the updated product recommendations!", 
        sender: 'bot' 
      }
    ]);
  } catch (error) {
    console.error('Error sending message:', error);
    setMessages(prev => [
      ...prev,
      { 
        id: prev.length + 1, 
        text: "Sorry, I couldn't process your request. Please try again.", 
        sender: 'bot' 
      }
    ]);
  } finally {
    setLoading(false);
  }
};

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`h-full flex flex-col rounded-lg shadow-lg overflow-hidden ${
      darkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="p-4 border-b">
        <h2 className="font-semibold">Shopping Assistant</h2>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto max-h-[500px]">
        {messages.map(message => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.sender === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                message.sender === 'user'
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="text-left mb-4">
            <div className={`inline-block rounded-lg px-4 py-2 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        <div className="flex">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className={`flex-1 resize-none rounded-l-lg p-2 focus:outline-none ${
              darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            }`}
            rows="2"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`px-4 rounded-r-lg ${
              !input.trim() || loading
                ? darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Try asking: "Show me more blue items" or "Find something cheaper"
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
