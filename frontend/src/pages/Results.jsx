import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ChatInterface from '../components/ChatInterface';
import ThemeContext from '../context/ThemeContext';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("shopsmarter_cart");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // Load products from location.state or fetch as needed
  useEffect(() => {
    if (location?.state?.products) {
      setProducts(location.state.products);
    } else {
      // Optionally fetch products here if not passed via navigation
      setProducts([]);
    }
  }, [location]);

  // Add to cart logic
  const addToCart = (product) => {
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
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        if (!location.state || !location.state.features) {
          navigate("/");
          return;
        }

        const { features } = location.state;

        const response = await fetch("/api/recommendations/similar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ features }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch recommendations: ${response.status}`
          );
        }

        const data = await response.json();
        setProducts(data.products);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [location.state, navigate]);

  const handleRefineResults = async (prompt) => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:8000/api/recommendations/refine",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ products, prompt }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to refine recommendations");
      }

      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      console.error("Error refining recommendations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
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
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  // Inside the handleCheckout function in Results.jsx

  // const handleCheckout = async () => {
  //   try {
  //     const requestBody = {
  //       products: cart.map(item => item.id)
  //     };
  //     const response = await fetch('/api/checkout/create-session', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(requestBody),
  //     });

  //     if (!response.ok) {
  //       throw new Error(`Failed to create checkout session: ${response.status}`);
  //     }

  //     const { id: sessionId } = await response.json();

  //     // Redirect to checkout page (mock for demo)
  //     alert(`Checkout session created: ${sessionId}`);
  //     setCart([]);
  //     setShowCheckout(false);
  //   } catch (err) {
  //     console.error('Error creating checkout session:', err);
  //     setError(err.message);
  //   }
  // };
  const handleCheckout = () => {
    // Save cart to localStorage in case user refreshes
    localStorage.setItem("shopsmarter_cart", JSON.stringify(cart));

    // Navigate to checkout page
    navigate("/checkout", { state: { cart } });
  };

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
              <h2 className="text-2xl font-semibold mb-4">
                Recommended Products
              </h2>

              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}

              {error && (
                <div
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                  role="alert"
                >
                  <strong className="font-bold">Error:</strong>
                  <span className="block sm:inline"> {error}</span>
                </div>
              )}

              {!loading && !error && products.length === 0 && (
                <div className="text-center py-8">
                  <p>No products found. Try uploading a different image.</p>
                  <button
                    onClick={() => navigate("/")}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Upload New Image
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    inCart={cart.some((item) => item.id === product.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/4">
            <ChatInterface onSendMessage={handleRefineResults} />
          </div>
        </div>
      </main>

      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`max-w-md w-full p-6 rounded-lg shadow-lg ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Cart</h2>
              <button onClick={() => setShowCheckout(false)}>
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

            {cart.length === 0 ? (
              <p className="text-center py-4">Your cart is empty</p>
            ) : (
              <>
                <div className="max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b"
                    >
                      <div className="flex items-center">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="ml-3">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm">${item.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveFromCart(item.id)}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-red-500"
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
                      $
                      {cart
                        .reduce((total, item) => total + item.price, 0)
                        .toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Checkout
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
