import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeContext from '../context/ThemeContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const [latestProducts, setLatestProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  const userId = localStorage.getItem('user_id') || 1;

  useEffect(() => {
    fetchData();
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem('shopsmarter_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const fetchData = async () => {
    try {
      const [latestRes, trendingRes] = await Promise.all([
        fetch('/api/products/latest?limit=8'),
        fetch('/api/products/trending?limit=8')
      ]);

      if (latestRes.ok) {
        const latestData = await latestRes.json();
        setLatestProducts(latestData.products || []);
      }

      if (trendingRes.ok) {
        const trendingData = await trendingRes.json();
        setTrendingProducts(trendingData.products || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const updatedCart = [...cart, product];
    setCart(updatedCart);
    localStorage.setItem('shopsmarter_cart', JSON.stringify(updatedCart));
  };

  const ProductCard = ({ product }) => (
    <div className={`group cursor-pointer ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-48 w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold truncate">{product.name}</h3>
        <p className="text-xs text-gray-500 mt-1">{product.category}</p>
        <p className="text-lg font-bold mt-2 text-indigo-600">${product.price?.toFixed(2) || '0.00'}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          className="mt-3 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 text-lg ${darkMode ? 'text-white' : 'text-gray-600'}`}>Loading amazing products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Discover Products
              <span className="block text-yellow-300">with AI Magic</span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-100 leading-relaxed">
              Upload any image and let our AI find similar products instantly. Shop smarter, discover faster, and find exactly what you're looking for.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/search')}
                className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full text-indigo-600 bg-white hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Start with Image Search
              </button>
              {cart.length > 0 && (
                <button
                  onClick={() => navigate('/checkout', { state: { cart } })}
                  className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full text-white bg-green-600 hover:bg-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6"></path>
                  </svg>
                  View Cart ({cart.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600">Three simple steps to find your perfect product</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "📸",
                title: "Upload Image",
                description: "Take a photo or upload an image of any product you like"
              },
              {
                icon: "🤖",
                title: "AI Analysis",
                description: "Our AI analyzes the image to identify key features and patterns"
              },
              {
                icon: "🛍️",
                title: "Find & Buy",
                description: "Browse similar products and add your favorites to cart"
              }
            ].map((feature, index) => (
              <div key={index} className={`text-center p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">🔥 Trending Now</h2>
              <button
                onClick={() => navigate('/search')}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View all →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {trendingProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Latest Products */}
      {latestProducts.length > 0 && (
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">✨ Latest Arrivals</h2>
              <button
                onClick={() => navigate('/search')}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View all →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {latestProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to discover amazing products?
          </h2>
          <p className="text-xl text-gray-100 mb-8">
            Join thousands of smart shoppers who find exactly what they want with AI-powered search.
          </p>
          <button
            onClick={() => navigate('/search')}
            className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full text-indigo-600 bg-white hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Get Started Now
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
