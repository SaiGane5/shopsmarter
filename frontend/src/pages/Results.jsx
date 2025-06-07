import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ChatInterface from '../components/ChatInterface';
import ThemeContext from '../context/ThemeContext';
import ComplementaryProducts from "../components/ComplementaryProducts";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  
  // Initialize all states with proper default values
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [complementary, setComplementary] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

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

        // Check if we have the required data
        if (!location.state || !location.state.features) {
          console.log('No features found in location state, redirecting to home');
          navigate("/");
          return;
        }

        const { features } = location.state;
        console.log('Fetching recommendations with features:', features);

        const response = await fetch("/api/recommendations/similar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            features,
            limit: 10 
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Received recommendations data:', data);

        // Safely access the recommendations from the response
        const recommendations = data.recommendations || data.products || [];
        
        if (Array.isArray(recommendations)) {
          setProducts(recommendations);
          console.log(`Set ${recommendations.length} products`);
        } else {
          console.error('Recommendations is not an array:', recommendations);
          setProducts([]);
        }

      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError(err.message || 'Failed to fetch recommendations');
        setProducts([]); // Ensure products is always an array
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [location.state, navigate]);

  // Fetch complementary products when main products are loaded
  useEffect(() => {
    const fetchComplementaryProducts = async () => {
      // Only fetch if we have products and features
      if (!Array.isArray(products) || products.length === 0 || !location.state?.features) {
        return;
      }

      try {
        console.log('Fetching complementary products...');
        
        const response = await fetch("/api/recommendations/complementary", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ 
            features: location.state.features,
            limit: 8
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const complementaryProducts = data.complementary_products || data.recommendations || [];
          
          if (Array.isArray(complementaryProducts)) {
            setComplementary(complementaryProducts);
            console.log(`Set ${complementaryProducts.length} complementary products`);
          } else {
            setComplementary([]);
          }
        } else {
          console.error('Failed to fetch complementary products:', response.status);
          setComplementary([]);
        }
      } catch (error) {
        console.error('Error fetching complementary products:', error);
        setComplementary([]);
      }
    };

    fetchComplementaryProducts();
  }, [products, location.state?.features]);

  // Safe cart operations
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

  const handleRefineResults = async (prompt) => {
    if (!prompt || !Array.isArray(products) || products.length === 0) {
      console.error('Cannot refine: invalid prompt or no products');
      return;
    }

    try {
      setChatLoading(true);
      console.log('Refining results with prompt:', prompt);

      const response = await fetch("/api/recommendations/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          products, 
          prompt 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to refine recommendations: ${response.status}`);
      }

      const data = await response.json();
      const refinedProducts = data.recommendations || data.products || [];
      
      if (Array.isArray(refinedProducts)) {
        setProducts(refinedProducts);
        console.log(`Refined to ${refinedProducts.length} products`);
      } else {
        console.error('Refined products is not an array:', refinedProducts);
      }

    } catch (err) {
      console.error("Error refining recommendations:", err);
      setError('Failed to refine results. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!Array.isArray(cart) || cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    try {
      // Save cart to localStorage in case user refreshes
      localStorage.setItem("shopsmarter_cart", JSON.stringify(cart));
      
      // Navigate to checkout page
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

  // Safe render checks
  const safeProducts = Array.isArray(products) ? products : [];
  const safeComplementary = Array.isArray(complementary) ? complementary : [];
  const safeCart = Array.isArray(cart) ? cart : [];

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-3/4">
            <div
              className={`p-6 rounded-lg shadow-lg mb-8 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">
                  Recommended Products
                  {safeProducts.length > 0 && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({safeProducts.length} items)
                    </span>
                  )}
                </h2>
                
                {safeCart.length > 0 && (
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    View Cart ({safeCart.length})
                  </button>
                )}
              </div>

              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3">Finding similar products...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
                  <button
                    onClick={() => {
                      setError(null);
                      navigate("/");
                    }}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && safeProducts.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">No products found</h3>
                  <p className="text-gray-500 mb-4">Try uploading a different image or adjusting your search.</p>
                  <button
                    onClick={() => navigate("/")}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Upload New Image
                  </button>
                </div>
              )}

              {!loading && !error && safeProducts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {safeProducts.map((product) => (
                    <ProductCard
                      key={product.id || product.product_id || Math.random()}
                      product={product}
                      onAddToCart={addToCart}
                      inCart={safeCart.some((item) => item.id === product.id)}
                    />
                  ))}
                </div>
              )}

              {!loading && !error && safeComplementary.length > 0 && (
                <div className="mt-12">
                  <ComplementaryProducts products={safeComplementary} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Chat Interface - Only show if we have products */}
      {safeProducts.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            zIndex: 50,
            width: "350px",
            maxWidth: "90vw",
          }}
          className={
            darkMode
              ? "bg-gray-800 rounded-lg shadow-lg"
              : "bg-white rounded-lg shadow-lg"
          }
        >
          <ChatInterface 
            onSendMessage={handleRefineResults}
            loading={chatLoading}
          />
        </div>
      )}

      {/* Cart Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`max-w-md w-full mx-4 p-6 rounded-lg shadow-lg ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Cart</h2>
              <button 
                onClick={() => setShowCheckout(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {safeCart.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="max-h-60 overflow-y-auto">
                  {safeCart.map((item) => (
                    <div
                      key={item.id || Math.random()}
                      className="flex items-center justify-between py-3 border-b"
                    >
                      <div className="flex items-center flex-1">
                        <img
                          src={item.image_url || `https://via.placeholder.com/48x48?text=${encodeURIComponent(item.name || 'Product')}`}
                          alt={item.name || 'Product'}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.target.src = `https://via.placeholder.com/48x48?text=${encodeURIComponent(item.name || 'Product')}`;
                          }}
                        />
                        <div className="ml-3 flex-1">
                          <h3 className="font-medium text-sm truncate">{item.name || 'Unnamed Product'}</h3>
                          <p className="text-sm text-gray-500">
                            ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
                            {item.quantity > 1 && ` x ${item.quantity}`}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between mb-4">
                    <span className="font-semibold">Total:</span>
                    <span className="font-semibold">
                      ${calculateCartTotal().toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <footer
        className={`py-6 mt-12 ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}
      >
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 ShopSmarter AI Assistant</p>
        </div>
      </footer>
    </div>
  );
};

export default Results;
