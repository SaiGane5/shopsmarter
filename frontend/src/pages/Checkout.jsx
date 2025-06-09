import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeContext from '../context/ThemeContext';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  
  // Cart state
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // AI enhancement states
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState({});
  const [smartPricing, setSmartPricing] = useState(null);
  const [smartBehaviors, setSmartBehaviors] = useState({});
  const [predictions, setPredictions] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [expandedSuggestions, setExpandedSuggestions] = useState({});

  const userId = localStorage.getItem('user_id') || 1;

  // Professional color palette
  const colors = {
    primary: darkMode ? '#3B82F6' : '#2563EB',
    primaryHover: darkMode ? '#2563EB' : '#1D4ED8',
    secondary: darkMode ? '#6B7280' : '#9CA3AF',
    success: darkMode ? '#10B981' : '#059669',
    warning: darkMode ? '#F59E0B' : '#D97706',
    danger: darkMode ? '#EF4444' : '#DC2626',
    background: darkMode ? '#111827' : '#F8FAFC',
    cardBg: darkMode ? '#1F2937' : '#FFFFFF',
    border: darkMode ? '#374151' : '#E5E7EB',
    text: darkMode ? '#F9FAFB' : '#111827',
    textSecondary: darkMode ? '#D1D5DB' : '#6B7280'
  };

  useEffect(() => {
    if (location.state && location.state.cart) {
      setCart(location.state.cart.map(item => ({ ...item, quantity: item.quantity || 1 })));
    } else {
      const savedCart = localStorage.getItem('shopsmarter_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart.map(item => ({ ...item, quantity: item.quantity || 1 })));
      } else {
        navigate('/');
      }
    }
  }, [location.state, navigate]);

  // AI Analysis Effect
  useEffect(() => {
    if (cart.length > 0) {
      performAIAnalysis();
    }
  }, [cart]);

  const performAIAnalysis = async () => {
    try {
      setAiLoading(true);
      
      const response = await fetch('/api/checkout/analyze-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cart_items: cart, 
          user_id: userId 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data.analysis);
        setSuggestions(data.analysis.personalized_suggestions);
        setSmartPricing(data.analysis.dynamic_pricing);
        setSmartBehaviors(data.analysis.smart_behaviors);
        setPredictions(data.analysis.purchase_predictions);
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // Update localStorage whenever cart changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('shopsmarter_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
    }
  }, [cart]);

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.id !== productId);
      if (newCart.length === 0) {
        localStorage.removeItem('shopsmarter_cart');
        window.dispatchEvent(new Event('cartUpdated'));
        navigate('/');
      } else {
        localStorage.setItem('shopsmarter_cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('cartUpdated'));
      }
      return newCart;
    });
  };

  const addSuggestedItem = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      updateQuantity(item.id, existingItem.quantity + 1);
    } else {
      setCart(prevCart => [...prevCart, { ...item, quantity: 1 }]);
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    if (smartPricing) {
      return smartPricing.final_total;
    }
    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.08;
    const shipping = subtotal > 75 ? 0 : 10;
    return subtotal + tax + shipping;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const products = [];
      cart.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          products.push(item.id);
        }
      });
      
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          products, 
          user_id: userId,
          cart_items: cart 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process checkout');
      }
      
      const data = await response.json();
      window.location.href = `/success?session_id=${data.id}`;
      
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Professional Alert Component
  const SmartAlert = ({ alert, type }) => (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: type === 'stock' ? '#FEF2F2' : type === 'price' ? '#F0FDF4' : '#EFF6FF',
        borderLeft: `4px solid ${type === 'stock' ? colors.danger : type === 'price' ? colors.success : colors.primary}`,
        color: type === 'stock' ? colors.danger : type === 'price' ? colors.success : colors.primary
      }}
      className="p-4 rounded-lg mb-3"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-3">
          <div style={{
            background: type === 'stock' ? '#FEE2E2' : type === 'price' ? '#DCFCE7' : '#DBEAFE',
            color: type === 'stock' ? colors.danger : type === 'price' ? colors.success : colors.primary
          }} className="w-8 h-8 rounded-full flex items-center justify-center">
            {type === 'stock' && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {type === 'price' && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        <div>
          <p className="font-medium text-sm">{alert.message}</p>
          {alert.urgency && (
            <p className="text-xs opacity-75 mt-1">Urgency: {alert.urgency}</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Professional Suggestion Card Component
  const SuggestionCard = ({ item, reason, onAdd, confidence }) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      style={{
        background: colors.cardBg,
        borderColor: colors.border
      }}
      className="p-4 rounded-lg border transition-all duration-300 hover:shadow-md"
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img 
            src={item.image_url || `https://via.placeholder.com/64x64?text=${encodeURIComponent(item.name)}`}
            alt={item.name}
            className="w-16 h-16 object-cover rounded-lg"
            onError={(e) => {
              e.target.src = `https://via.placeholder.com/64x64?text=${encodeURIComponent(item.name)}`;
            }}
          />
          {confidence && (
            <div style={{ background: colors.primary }} className="absolute -top-2 -right-2 text-white text-xs px-2 py-1 rounded-full font-medium">
              {Math.round(confidence * 100)}%
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 style={{ color: colors.text }} className="font-semibold text-sm truncate">
            {item.name}
          </h4>
          <p style={{ color: colors.textSecondary }} className="text-xs mt-1">
            {reason}
          </p>
          <div className="flex items-center mt-2">
            <span style={{ color: colors.primary }} className="text-lg font-bold">
              ${item.price.toFixed(2)}
            </span>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAdd(item)}
          style={{
            background: colors.primary,
            borderColor: colors.primary
          }}
          className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90"
        >
          Add
        </motion.button>
      </div>
    </motion.div>
  );

  // Professional Cart Item Component
  const CartItem = ({ item }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{
        background: colors.cardBg,
        borderColor: colors.border
      }}
      className="p-6 rounded-lg mb-4 border transition-all duration-300 hover:shadow-sm"
    >
      <div className="flex items-center space-x-6">
        <div className="relative">
          <img 
            className="w-20 h-20 object-cover rounded-lg" 
            src={item.image_url || `https://via.placeholder.com/80x80?text=${encodeURIComponent(item.name)}`}
            alt={item.name}
            onError={(e) => {
              e.target.src = `https://via.placeholder.com/80x80?text=${encodeURIComponent(item.name)}`;
            }}
          />
          <div style={{ background: colors.primary }} className="absolute -top-2 -right-2 text-white text-xs px-2 py-1 rounded-full font-medium">
            {item.quantity}
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <h3 style={{ color: colors.text }} className="text-lg font-semibold">
            {item.name}
          </h3>
          <p style={{ color: colors.textSecondary }} className="text-sm">
            {item.category}
          </p>
          <div className="flex items-center space-x-4">
            <span style={{ color: colors.primary }} className="text-xl font-bold">
              ${item.price.toFixed(2)}
            </span>
            <span style={{ color: colors.textSecondary }} className="text-sm">
              each
            </span>
          </div>
          
          {/* Smart behaviors for this item */}
          <div className="flex flex-wrap gap-2">
            {smartBehaviors.size_recommendations?.find(rec => rec.product_id === item.id) && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Size: {smartBehaviors.size_recommendations.find(rec => rec.product_id === item.id).recommended_size}
              </span>
            )}
            
            {smartBehaviors.stock_alerts?.find(alert => alert.product_id === item.id) && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                <svg className="w-3 h-3 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
                </svg>
                {smartBehaviors.stock_alerts.find(alert => alert.product_id === item.id).message}
              </span>
            )}
            
            {smartBehaviors.price_alerts?.find(alert => alert.product_id === item.id) && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {smartBehaviors.price_alerts.find(alert => alert.product_id === item.id).message}
              </span>
            )}
          </div>
        </div>
        
        {/* Quantity Controls */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              style={{
                background: colors.cardBg,
                borderColor: colors.border,
                color: colors.text
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 hover:shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
              </svg>
            </motion.button>
            
            <div style={{
              background: colors.background,
              color: colors.text
            }} className="min-w-[2.5rem] text-center py-1 px-2 rounded font-semibold">
              {item.quantity}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              style={{
                background: colors.cardBg,
                borderColor: colors.border,
                color: colors.text
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 hover:shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </motion.button>
          </div>
          
          {/* Subtotal and Delete */}
          <div className="text-center space-y-2">
            
            <p style={{ color: colors.primary }} className="text-lg font-bold">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
            

          </div>
        </div>
      </div>
    </motion.div>
  );

  if (cart.length === 0) {
    return (
      <div style={{ background: colors.background, color: colors.text }} className="min-h-screen">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div style={{ background: colors.primary + '20' }} className="mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-6">
              <svg style={{ color: colors.primary }} className="h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8-4-8 4m16 0v18l-8 4-8-4V7m16 18l-8 4-8-4" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
            <p style={{ color: colors.textSecondary }} className="text-lg mb-8">Start shopping to add items to your cart and experience our AI-powered recommendations.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              style={{ background: colors.primary }}
              className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-lg text-white transition-all duration-200 hover:opacity-90"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Start Shopping
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: colors.background, color: colors.text }} className="min-h-screen transition-colors duration-300">
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Smart Behaviors Alerts */}
            <AnimatePresence>
              {smartBehaviors.urgency_indicators?.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    background: colors.cardBg,
                    borderColor: colors.border
                  }}
                  className="p-6 rounded-lg border"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <div style={{ background: colors.warning + '20', color: colors.warning }} className="w-8 h-8 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Smart Alerts
                  </h3>
                  {smartBehaviors.urgency_indicators.map((alert, index) => (
                    <SmartAlert key={index} alert={alert} type={alert.type} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cart Items */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: colors.cardBg,
                borderColor: colors.border
              }}
              className="p-6 rounded-lg border"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <div style={{ background: colors.primary + '20', color: colors.primary }} className="w-8 h-8 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  Your Items ({cart.length})
                </h2>
                <span style={{
                  background: colors.primary + '20',
                  color: colors.primary
                }} className="px-3 py-1 rounded-full text-sm font-medium">
                  {cart.reduce((total, item) => total + item.quantity, 0)} total items
                </span>
              </div>
              
              <AnimatePresence>
                {cart.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* AI Suggestions */}
            <AnimatePresence>
              {suggestions && Object.keys(suggestions).length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{
                    background: colors.cardBg,
                    borderColor: colors.border
                  }}
                  className="p-6 rounded-lg border"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center">
                      <div style={{ background: colors.primary + '20', color: colors.primary }} className="w-8 h-8 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      AI Recommendations
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      style={{ background: colors.primary }}
                      className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90"
                    >
                      {showSuggestions ? 'Hide' : 'Show'} Suggestions
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {showSuggestions && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6"
                      >
                        {suggestions.frequently_bought_together?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-base mb-3 flex items-center">
                              <svg style={{ color: colors.success }} className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Frequently Bought Together
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {suggestions.frequently_bought_together.slice(0, 4).map((item, index) => (
                                <SuggestionCard 
                                  key={index} 
                                  item={item} 
                                  reason={item.reason} 
                                  confidence={item.confidence}
                                  onAdd={addSuggestedItem} 
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {suggestions.complete_the_look?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-base mb-3 flex items-center">
                              <svg style={{ color: colors.primary }} className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                              </svg>
                              Complete the Look
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {suggestions.complete_the_look.slice(0, 4).map((item, index) => (
                                <SuggestionCard 
                                  key={index} 
                                  item={item} 
                                  reason={item.reason}
                                  confidence={item.confidence}
                                  onAdd={addSuggestedItem} 
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {suggestions.you_may_also_like?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-base mb-3 flex items-center">
                              <svg style={{ color: colors.secondary }} className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                              </svg>
                              You May Also Like
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {suggestions.you_may_also_like.slice(0, 4).map((item, index) => (
                                <SuggestionCard 
                                  key={index} 
                                  item={item} 
                                  reason={item.reason}
                                  confidence={item.confidence}
                                  onAdd={addSuggestedItem} 
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Professional Order Summary */}
          <div className="xl:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                background: colors.cardBg,
                borderColor: colors.border
              }}
              className="p-6 rounded-lg border sticky top-24"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <div style={{ background: colors.success + '20', color: colors.success }} className="w-8 h-8 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                Order Summary
              </h2>
              
              {/* Purchase Predictions */}
              {predictions.completion_probability && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Completion Probability
                    </span>
                    <span style={{ color: colors.primary }} className="text-lg font-bold">
                      {Math.round(predictions.completion_probability * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${predictions.completion_probability * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      style={{ background: colors.primary }}
                      className="h-2 rounded-full"
                    ></motion.div>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                    Based on your shopping behavior
                  </p>
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between text-base">
                  <span>Subtotal ({cart.reduce((total, item) => total + item.quantity, 0)} items)</span>
                  <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                </div>

                {/* AI Discounts */}
                <AnimatePresence>
                  {smartPricing?.discounts?.map((discount, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      style={{ 
                        background: colors.success + '20',
                        color: colors.success
                      }}
                      className="flex justify-between p-3 rounded-lg"
                    >
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="font-medium">{discount.name}</div>
                          <div className="text-xs opacity-75">{discount.description}</div>
                        </div>
                      </span>
                      <span className="font-bold">-${discount.amount.toFixed(2)}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span>${(calculateSubtotal() * 0.08).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    Shipping
                    {smartPricing?.free_shipping_eligible && (
                      <svg style={{ color: colors.success }} className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                  <span style={{ color: smartPricing?.shipping === 0 ? colors.success : colors.text }} className={smartPricing?.shipping === 0 ? 'font-semibold' : ''}>
                    {smartPricing?.shipping === 0 ? 'Free!' : `$${smartPricing?.shipping?.toFixed(2) || '10.00'}`}
                  </span>
                </div>

                {/* Smart Pricing Recommendations */}
                <AnimatePresence>
                  {smartPricing?.recommendations?.map((rec, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center">
                        <svg style={{ color: colors.primary }} className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {rec.message}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <hr style={{ borderColor: colors.border }} className="border-t-2" />
                
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span style={{ color: colors.primary }}>
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>

                {/* Total Savings Display */}
                {smartPricing?.savings > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      background: colors.success + '20',
                      color: colors.success
                    }}
                    className="flex justify-between font-bold text-base p-3 rounded-lg"
                  >
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      You Saved
                    </span>
                    <span>${smartPricing.savings.toFixed(2)}</span>
                  </motion.div>
                )}
              </div>

              {/* Intervention Suggestions */}
              <AnimatePresence>
                {predictions.intervention_suggestions?.map((suggestion, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                  >
                    <div className="flex items-center">
                      <svg style={{ color: colors.warning }} className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        {suggestion.message}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="mt-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  style={{ background: colors.primary }}
                  className="w-full text-white py-4 px-6 rounded-lg text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:opacity-90"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Complete Purchase - ${calculateTotal().toFixed(2)}
                    </div>
                  )}
                </motion.button>
              </form>
              
              <div className="mt-4 text-center">
                <p style={{ color: colors.textSecondary }} className="text-sm flex items-center justify-center">
                  <svg style={{ color: colors.success }} className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Secure checkout with AI optimization
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
