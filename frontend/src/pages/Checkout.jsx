import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

  const userId = localStorage.getItem('user_id') || 1;

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
      
      // Comprehensive AI analysis
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
        
        console.log('AI Analysis completed:', data.analysis);
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

  // Smart Behaviors Components
  const SmartAlert = ({ alert, type }) => (
    <div className={`p-3 rounded-lg mb-2 ${
      type === 'stock' ? 'bg-red-100 border border-red-300 text-red-800' :
      type === 'price' ? 'bg-green-100 border border-green-300 text-green-800' :
      'bg-blue-100 border border-blue-300 text-blue-800'
    }`}>
      <div className="flex items-center">
        {type === 'stock' && (
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
        {type === 'price' && (
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
        <span className="text-sm font-medium">{alert.message}</span>
      </div>
    </div>
  );

  const SuggestionCard = ({ item, reason, onAdd }) => (
    <div className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center space-x-3">
        <img 
          src={item.image_url || `https://via.placeholder.com/60x60?text=${encodeURIComponent(item.name)}`}
          alt={item.name}
          className="w-12 h-12 object-cover rounded"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/60x60?text=${encodeURIComponent(item.name)}`;
          }}
        />
        <div className="flex-1">
          <h4 className="font-medium text-sm">{item.name}</h4>
          <p className="text-xs text-gray-500">{reason}</p>
          <p className="font-bold text-indigo-600">${item.price.toFixed(2)}</p>
        </div>
        <button
          onClick={() => onAdd(item)}
          className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );

  const CartItem = ({ item }) => (
    <div className={`flex items-center space-x-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
      <img 
        className="w-20 h-20 object-cover rounded-lg" 
        src={item.image_url || `https://via.placeholder.com/80x80?text=${encodeURIComponent(item.name)}`}
        alt={item.name}
        onError={(e) => {
          e.target.src = `https://via.placeholder.com/80x80?text=${encodeURIComponent(item.name)}`;
        }}
      />
      <div className="flex-1">
        <h3 className="font-semibold text-lg">{item.name}</h3>
        <p className="text-sm text-gray-500">{item.category}</p>
        <p className="font-bold text-indigo-600">${item.price.toFixed(2)} each</p>
        
        {/* Smart behaviors for this item */}
        {smartBehaviors.size_recommendations?.find(rec => rec.product_id === item.id) && (
          <div className="mt-2">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Recommended size: {smartBehaviors.size_recommendations.find(rec => rec.product_id === item.id).recommended_size}
            </span>
          </div>
        )}
        
        {smartBehaviors.stock_alerts?.find(alert => alert.product_id === item.id) && (
          <div className="mt-2">
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
              {smartBehaviors.stock_alerts.find(alert => alert.product_id === item.id).message}
            </span>
          </div>
        )}
        
        {smartBehaviors.price_alerts?.find(alert => alert.product_id === item.id) && (
          <div className="mt-2">
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              {smartBehaviors.price_alerts.find(alert => alert.product_id === item.id).message}
            </span>
          </div>
        )}
      </div>
      
      {/* Quantity Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            darkMode 
              ? 'bg-gray-600 hover:bg-gray-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
          </svg>
        </button>
        
        <span className="font-semibold text-lg min-w-[2rem] text-center">{item.quantity}</span>
        
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            darkMode 
              ? 'bg-gray-600 hover:bg-gray-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </button>
      </div>
      
      {/* Subtotal and Delete */}
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</p>
        </div>
        
        <button
          onClick={() => removeFromCart(item.id)}
          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
          aria-label="Remove item"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    </div>
  );

  if (cart.length === 0) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8-4-8 4m16 0v18l-8 4-8-4V7m16 18l-8 4-8-4" />
            </svg>
            <h2 className="mt-2 text-lg font-medium">Your cart is empty</h2>
            <p className="mt-1 text-sm text-gray-500">Start shopping to add items to your cart.</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold">Smart Shopping Cart</h1>
          <button
            onClick={() => navigate('/')}
            className={`text-sm font-medium ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}
          >
            ← Continue Shopping
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* AI Loading Indicator */}
        {aiLoading && (
          <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-blue-50'} border border-blue-200`}>
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800">AI is analyzing your cart for the best recommendations...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Smart Behaviors Alerts */}
            {smartBehaviors.urgency_indicators?.length > 0 && (
              <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <h3 className="font-semibold mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Smart Alerts
                </h3>
                {smartBehaviors.urgency_indicators.map((alert, index) => (
                  <SmartAlert key={index} alert={alert} type={alert.type} />
                ))}
              </div>
            )}

            {/* Cart Items */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 mb-6`}>
              <h2 className="text-xl font-semibold mb-6">Cart Items ({cart.length})</h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* AI Suggestions */}
            {suggestions && Object.keys(suggestions).length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    AI Recommendations
                  </h3>
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    {showSuggestions ? 'Hide' : 'Show'} Suggestions
                  </button>
                </div>

                {showSuggestions && (
                  <div className="space-y-4">
                    {suggestions.frequently_bought_together?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Frequently Bought Together</h4>
                        <div className="space-y-2">
                          {suggestions.frequently_bought_together.slice(0, 3).map((item, index) => (
                            <SuggestionCard 
                              key={index} 
                              item={item} 
                              reason={item.reason} 
                              onAdd={addSuggestedItem} 
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestions.complete_the_look?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Complete the Look</h4>
                        <div className="space-y-2">
                          {suggestions.complete_the_look.slice(0, 3).map((item, index) => (
                            <SuggestionCard 
                              key={index} 
                              item={item} 
                              reason={item.reason} 
                              onAdd={addSuggestedItem} 
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestions.you_may_also_like?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">You May Also Like</h4>
                        <div className="space-y-2">
                          {suggestions.you_may_also_like.slice(0, 3).map((item, index) => (
                            <SuggestionCard 
                              key={index} 
                              item={item} 
                              reason={item.reason} 
                              onAdd={addSuggestedItem} 
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Summary with AI Pricing */}
          <div className="lg:col-span-1">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 sticky top-24`}>
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Smart Order Summary
              </h2>
              
              {/* Purchase Predictions */}
              {predictions.completion_probability && (
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Completion Probability</span>
                    <span className="text-lg font-bold text-blue-600">
                      {Math.round(predictions.completion_probability * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${predictions.completion_probability * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal ({cart.reduce((total, item) => total + item.quantity, 0)} items)</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>

                {/* AI Discounts */}
                {smartPricing?.discounts?.map((discount, index) => (
                  <div key={index} className="flex justify-between text-green-600">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {discount.name}
                    </span>
                    <span>-${discount.amount.toFixed(2)}</span>
                  </div>
                ))}

                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span>${(calculateSubtotal() * 0.08).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="flex items-center">
                    Shipping
                    {smartPricing?.free_shipping_eligible && (
                      <svg className="w-4 h-4 ml-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                  <span>{smartPricing?.shipping === 0 ? 'Free' : `$${smartPricing?.shipping?.toFixed(2) || '10.00'}`}</span>
                </div>

                {/* Smart Pricing Recommendations */}
                {smartPricing?.recommendations?.map((rec, index) => (
                  <div key={index} className="p-2 bg-blue-50 rounded text-sm text-blue-800">
                    {rec.message}
                  </div>
                ))}

                <hr className={`border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`} />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>

                {/* Total Savings Display */}
                {smartPricing?.savings > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>You Saved</span>
                    <span>${smartPricing.savings.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Intervention Suggestions */}
              {predictions.intervention_suggestions?.map((suggestion, index) => (
                <div key={index} className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-yellow-800">{suggestion.message}</span>
                  </div>
                </div>
              ))}

              <form onSubmit={handleSubmit} className="mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-lg text-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing...
                    </div>
                  ) : (
                    `Smart Checkout - $${calculateTotal().toFixed(2)}`
                  )}
                </button>
              </form>
              
              <p className="text-sm text-gray-500 mt-4 text-center">
                AI-powered pricing and recommendations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
