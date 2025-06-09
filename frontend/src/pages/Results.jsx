import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ChatInterface from '../components/ChatInterface';
import FloatingChatButton from '../components/FloatingChatButton';
import ThemeContext from '../context/ThemeContext';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  
  // Initialize all states with proper default values
  const [products, setProducts] = useState([]);
  const [originalProducts, setOriginalProducts] = useState([]); // NEW: Store original results
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [complementary, setComplementary] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(false);

  // Get uploaded image and features from location state
  const { features, uploadedImage } = location.state || {};

  // Page entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsPageVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("shopsmarter_cart");
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(Array.isArray(parsedCart) ? parsedCart : []);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setCart([]);
    }
  }, []);

  // Main effect to fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!features) {
          console.log('No features found in location state, redirecting to home');
          navigate("/");
          return;
        }

        console.log('Fetching recommendations with features:', features);

        const response = await fetch("/api/recommendations/similar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            features,
            limit: 20 // Increased limit to get more products for filtering
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Received recommendations data:', data);

        const recommendations = data.recommendations || data.products || [];
        
        if (Array.isArray(recommendations)) {
          setProducts(recommendations);
          setOriginalProducts(recommendations); // FIXED: Store original products
          console.log(`Set ${recommendations.length} products (original stored)`);
        } else {
          console.error('Recommendations is not an array:', recommendations);
          setProducts([]);
          setOriginalProducts([]);
        }

      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError(err.message || 'Failed to fetch recommendations');
        setProducts([]);
        setOriginalProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [location.state, navigate]);

  // ENHANCED: Fetch complementary products when main products are loaded
  useEffect(() => {
    const fetchComplementaryProducts = async () => {
      if (!Array.isArray(originalProducts) || originalProducts.length === 0 || !features) {
        return;
      }

      try {
        console.log('🛍️ Fetching complementary products for search results...');
        
        const response = await fetch("/api/recommendations/complementary", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ 
            features: features,
            limit: 8
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const complementaryProducts = data.complementary_products || [];
          
          if (Array.isArray(complementaryProducts)) {
            setComplementary(complementaryProducts);
            console.log(`✅ Set ${complementaryProducts.length} complementary products for search results`);
          } else {
            setComplementary([]);
          }
        } else {
          console.error('❌ Failed to fetch complementary products:', response.status);
          setComplementary([]);
        }
      } catch (error) {
        console.error('❌ Error fetching complementary products:', error);
        setComplementary([]);
      }
    };

    fetchComplementaryProducts();
  }, [originalProducts, features]); // Changed dependency from products to originalProducts

  // Enhanced cart operations
  const addToCart = (product) => {
    if (!product || !product.id) {
      console.error('Invalid product for cart:', product);
      return;
    }

    try {
      const existingItem = cart.find((item) => item.id === product.id);
      let updatedCart;
      
      if (existingItem) {
        updatedCart = cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      } else {
        updatedCart = [...cart, { ...product, quantity: 1 }];
      }
      
      setCart(updatedCart);
      localStorage.setItem("shopsmarter_cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cartUpdated"));
      
      console.log(`Added ${product.name} to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    try {
      if (newQuantity <= 0) {
        const updatedCart = cart.filter((item) => item.id !== productId);
        setCart(updatedCart);
        localStorage.setItem("shopsmarter_cart", JSON.stringify(updatedCart));
      } else {
        const updatedCart = cart.map((item) =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        );
        setCart(updatedCart);
        localStorage.setItem("shopsmarter_cart", JSON.stringify(updatedCart));
      }
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveFromCart = (productId) => {
    try {
      const updatedCart = cart.filter((item) => item.id !== productId);
      setCart(updatedCart);
      localStorage.setItem("shopsmarter_cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  // FIXED: Enhanced refinement that always works from original products
  const handleRefineResults = async (prompt) => {
    if (!prompt) {
      console.error('Cannot refine: no prompt provided');
      return {
        type: 'error',
        response: 'Please provide a valid search query.'
      };
    }

    // FIXED: Always use original products for refinement
    const productsToRefine = Array.isArray(originalProducts) && originalProducts.length > 0 
      ? originalProducts 
      : products;

    if (!Array.isArray(productsToRefine) || productsToRefine.length === 0) {
      console.error('Cannot refine: no products available');
      return {
        type: 'error',
        response: 'No products available to refine. Please try a new search.'
      };
    }

    try {
      setChatLoading(true);
      console.log(`Refining from ${productsToRefine.length} original products with prompt:`, prompt);

      const response = await fetch("/api/recommendations/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          products: productsToRefine, // FIXED: Always send original products
          prompt,
          original_count: productsToRefine.length
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to refine recommendations: ${response.status}`);
      }

      const data = await response.json();
      console.log('Refinement response:', data);
      
      const refinedProducts = data.products || data.recommendations || [];
      
      if (Array.isArray(refinedProducts)) {
        setProducts(refinedProducts); // Update displayed products
        console.log(`Refined from ${productsToRefine.length} to ${refinedProducts.length} products`);
        
        // Return proper response for the chat interface
        return {
          type: data.type || 'filtered',
          response: data.response || `Found ${refinedProducts.length} products matching your request from ${productsToRefine.length} total products`
        };
      } else {
        console.error('Refined products is not an array:', refinedProducts);
        return {
          type: 'error',
          response: 'Invalid response format from refinement.'
        };
      }

    } catch (err) {
      console.error("Error refining recommendations:", err);
      return {
        type: 'error',
        response: 'Failed to refine results. Please try again.'
      };
    } finally {
      setChatLoading(false);
    }
  };

  // Add function to reset to original products
  const resetToOriginalProducts = () => {
    if (Array.isArray(originalProducts)) {
      setProducts(originalProducts);
      console.log(`Reset to ${originalProducts.length} original products`);
    }
  };

  const handleCheckout = () => {
    if (!Array.isArray(cart) || cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    try {
      localStorage.setItem("shopsmarter_cart", JSON.stringify(cart));
      navigate("/checkout", { state: { cart } });
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Error during checkout. Please try again.');
    }
  };

  const calculateCartTotal = () => {
    if (!Array.isArray(cart)) return 0;
    
    return cart.reduce((total, item) => {
      const price = typeof item.price === 'number' ? item.price : 0;
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
      return total + (price * quantity);
    }, 0);
  };

  const getProductQuantity = (productId) => {
    const item = cart.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  // Safe render checks
  const safeProducts = Array.isArray(products) ? products : [];
  const safeComplementary = Array.isArray(complementary) ? complementary : [];
  const safeCart = Array.isArray(cart) ? cart : [];

  return (
    <>
      <div className={`min-h-screen transition-all duration-700 ease-out ${
        isPageVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${
        darkMode 
          ? "bg-gray-900 text-white" 
          : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900"
      }`}>
        {/* Enhanced Header with Smooth Animations */}
        <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-all duration-500 shadow-lg ${
          darkMode 
            ? "bg-gray-900/90 border-gray-700" 
            : "bg-white/90 border-gray-200"
        }`}>
          <div className="container mx-auto px-4 py-4">
            <div className={`flex justify-between items-center transition-all duration-500 ${
              isPageVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
            }`}>
              <div className="flex items-center space-x-4">
                {/* Enhanced Uploaded Image Display */}
                {uploadedImage && (
                  <div className="flex items-center space-x-3 animate-fade-in-right">
                    <div className={`p-2 rounded-lg border transition-all duration-300 hover:scale-105 ${
                      darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
                    }`}>
                      <img 
                        src={uploadedImage} 
                        alt="Searched item" 
                        className="w-12 h-12 object-cover rounded-md transition-transform duration-300 hover:scale-110"
                      />
                    </div>
                    <div className="text-sm">
                      <p className={`font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>Searched for:</p>
                      <p className={`text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Similar items to your upload</p>
                    </div>
                  </div>
                )}
                
                <div className="animate-fade-in-up">
                  <h1 className={`text-2xl font-bold ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>Product Results</h1>
                  {safeProducts.length > 0 && (
                    <p className={`text-sm mt-1 ${
                      darkMode ? 'text-gray-400' : 'text-slate-600'
                    }`}>
                      {safeProducts.length} of {originalProducts.length} products shown
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Reset Filter Button */}
                {safeProducts.length !== originalProducts.length && originalProducts.length > 0 && (
                  <button
                    onClick={resetToOriginalProducts}
                    className={`px-4 py-2 rounded-lg border transition-all duration-300 hover:scale-105 ${
                      darkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Show All ({originalProducts.length})
                  </button>
                )}

                {/* Enhanced Cart Button with Animations */}
                {safeCart.length > 0 && (
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="relative px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 animate-bounce-in-right"
                  >
                    <span className="flex items-center space-x-2">
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l1.5-6M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                      <span>Cart ({safeCart.length})</span>
                    </span>
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
                      {safeCart.reduce((sum, item) => sum + item.quantity, 0)}
                    </div>
                    
                    {/* Ripple Effect */}
                    <div className="absolute inset-0 rounded-xl bg-white opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Enhanced Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 rounded-full animate-ping"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-400 rounded-full animate-pulse"></div>
              </div>
              <p className={`mt-4 text-lg font-medium animate-pulse ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>Finding perfect products for you...</p>
              <p className={`text-sm mt-2 ${
                darkMode ? 'text-gray-400' : 'text-slate-600'
              }`}>This may take a few moments</p>
            </div>
          )}

          {/* Enhanced Error State */}
          {error && (
            <div className={`max-w-2xl mx-auto p-8 rounded-2xl border-2 border-dashed animate-shake ${
              darkMode 
                ? "border-red-400 bg-red-900/20" 
                : "border-red-300 bg-red-50"
            }`}>
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-red-500 mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>Oops! Something went wrong</h3>
                <p className={`mb-6 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    navigate("/");
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Products Grid with Staggered Animations */}
          {!loading && !error && safeProducts.length > 0 && (
            <div className="space-y-12">
              {/* Main Products Section */}
              <section className="animate-fade-in-up">
                <div className="mb-8">
                  <h2 className={`text-3xl font-bold mb-2 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>Recommended For You</h2>
                  <p className={`${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>
                    {safeProducts.length === originalProducts.length 
                      ? 'All available products based on your preferences'
                      : `Filtered results: ${safeProducts.length} of ${originalProducts.length} products`
                    }
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {safeProducts.map((product, index) => (
                    <div
                      key={product.id || product.product_id || Math.random()}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <ProductCard
                        product={product}
                        onAddToCart={addToCart}
                        onUpdateQuantity={updateQuantity}
                        quantity={getProductQuantity(product.id)}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Enhanced Complementary Products Section */}
              {safeComplementary.length > 0 && (
                <section className={`p-8 rounded-2xl shadow-xl border animate-slide-in-left ${
                  darkMode 
                    ? "bg-gray-800/50 border-gray-700" 
                    : "bg-white/80 backdrop-blur-sm border-gray-200"
                }`}>
                  <div className="mb-8">
                    <h2 className={`text-3xl font-bold mb-2 ${
                      darkMode ? 'text-white' : 'text-gray-800'
                    }`}>Complete Your Look</h2>
                    <p className={`${
                      darkMode ? 'text-gray-400' : 'text-slate-600'
                    }`}>Items that go perfectly with your search results</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {safeComplementary.map((product, index) => (
                      <div 
                        key={product.id || product.product_id || Math.random()} 
                        className="relative animate-fade-in-up"
                        style={{ animationDelay: `${(index + 4) * 100}ms` }}
                      >
                        <ProductCard
                          product={product}
                          onAddToCart={addToCart}
                          onUpdateQuantity={updateQuantity}
                          quantity={getProductQuantity(product.id)}
                        />
                        {/* Enhanced Complementary Badge */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg animate-pulse-soft">
                            🎯 Complementary
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Enhanced Empty State */}
          {!loading && !error && safeProducts.length === 0 && originalProducts.length > 0 && (
            <div className="text-center py-20 animate-fade-in">
              <svg className={`mx-auto h-24 w-24 mb-6 animate-float ${
                darkMode ? 'text-gray-400' : 'text-slate-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className={`text-2xl font-bold mb-4 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>No products match your current filters</h3>
              <p className={`mb-8 max-w-md mx-auto ${
                darkMode ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Try adjusting your search criteria or view all {originalProducts.length} available products.
              </p>
              <button
                onClick={resetToOriginalProducts}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95"
              >
                Show All Products ({originalProducts.length})
              </button>
            </div>
          )}

          {/* Original Empty State for no products at all */}
          {!loading && !error && safeProducts.length === 0 && originalProducts.length === 0 && (
            <div className="text-center py-20 animate-fade-in">
              <svg className={`mx-auto h-24 w-24 mb-6 animate-float ${
                darkMode ? 'text-gray-400' : 'text-slate-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className={`text-2xl font-bold mb-4 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>No products found</h3>
              <p className={`mb-8 max-w-md mx-auto ${
                darkMode ? 'text-gray-400' : 'text-slate-600'
              }`}>
                We couldn't find any products matching your criteria. Try uploading a different image or adjusting your search.
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95"
              >
                Upload New Image
              </button>
            </div>
          )}
        </main>

        {/* Enhanced Footer */}
        <footer className={`py-12 mt-20 border-t transition-all duration-500 ${
          darkMode 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white/80 backdrop-blur-sm border-gray-200"
        }`}>
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className={`text-lg font-semibold ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>Powered by Aurra AI</span>
            </div>
            <p className={`${
              darkMode ? 'text-gray-400' : 'text-slate-600'
            }`}>© 2025 ShopSmarter with Aurra AI Assistant</p>
          </div>
        </footer>

        {/* Cart Modal with Animations */}
        {showCheckout && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className={`max-w-lg w-full mx-4 rounded-2xl shadow-2xl overflow-hidden animate-modal-appear ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}>
              <div className={`p-6 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex justify-between items-center">
                  <h2 className={`text-2xl font-bold ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>Shopping Cart</h2>
                  <button 
                    onClick={() => setShowCheckout(false)}
                    className={`p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                      darkMode 
                        ? 'hover:bg-gray-700 text-gray-400' 
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto p-6 aurra-chat-scrollbar">
                {safeCart.length === 0 ? (
                  <div className="text-center py-12 animate-fade-in">
                    <svg className={`mx-auto h-16 w-16 mb-4 animate-float ${
                      darkMode ? 'text-gray-400' : 'text-slate-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className={`text-lg ${
                      darkMode ? 'text-gray-400' : 'text-slate-500'
                    }`}>Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {safeCart.map((item, index) => (
                      <div 
                        key={item.id} 
                        className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 hover:scale-105 animate-fade-in-up ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <img
                          src={item.image_url || `https://via.placeholder.com/64x64?text=${encodeURIComponent(item.name || 'Product')}`}
                          alt={item.name || 'Product'}
                          className="w-16 h-16 object-cover rounded-lg transition-transform duration-300 hover:scale-110"
                          onError={(e) => {
                            e.target.src = `https://via.placeholder.com/64x64?text=${encodeURIComponent(item.name || 'Product')}`;
                          }}
                        />
                        <div className="flex-1">
                          <h3 className={`font-medium text-sm ${
                            darkMode ? 'text-white' : 'text-gray-800'
                          }`}>{item.name || 'Unnamed Product'}</h3>
                          <p className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>
                            ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
                            {item.quantity > 1 && ` × ${item.quantity}`}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleRemoveFromCart(item.id)}
                          className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                            darkMode 
                              ? 'text-red-400 hover:bg-red-900/20' 
                              : 'text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {safeCart.length > 0 && (
                <div className={`p-6 border-t animate-slide-up ${
                  darkMode 
                    ? 'border-gray-700 bg-gray-700/50' 
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-lg font-semibold ${
                      darkMode ? 'text-white' : 'text-gray-800'
                    }`}>Total:</span>
                    <span className="text-2xl font-bold text-indigo-600 animate-pulse-soft">
                      ${calculateCartTotal().toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FIXED: Floating Chat Button - Now properly positioned outside footer */}
      {safeProducts.length > 0 && (
        <FloatingChatButton 
          onClick={() => setShowChat(true)}
          hasNewMessage={false}
        />
      )}

      {/* Enhanced Chat Interface with Smooth Animations */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="animate-slide-up-enhanced">
            <ChatInterface 
              onSendMessage={handleRefineResults}
              loading={chatLoading}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}

      {/* Enhanced Custom Styles for Smooth Animations and Hidden Scrollbar */}
      <style jsx>{`
        .aurra-chat-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        .aurra-chat-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes bounce-in-right {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.3);
          }
          50% {
            transform: translateX(-10px) scale(1.05);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slide-up-enhanced {
          from {
            transform: translateY(100%) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes modal-appear {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }
        
        @keyframes pulse-soft {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        
        .animate-fade-in-right {
          animation: fade-in-right 0.6s ease-out;
        }
        
        .animate-bounce-in-right {
          animation: bounce-in-right 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-slide-up-enhanced {
          animation: slide-up-enhanced 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-modal-appear {
          animation: modal-appear 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }
        
        /* Smooth transitions for all interactive elements */
        * {
          scroll-behavior: smooth;
        }
        
        /* Enhanced button animations */
        .btn-enhanced {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .btn-enhanced:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .btn-enhanced:active {
          transform: translateY(0);
          transition: all 0.15s ease;
        }
      `}</style>
    </>
  );
};

export default Results;
