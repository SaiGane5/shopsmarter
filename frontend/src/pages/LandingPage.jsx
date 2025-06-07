import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeContext from '../context/ThemeContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [stats, setStats] = useState({ count: 0, name: '' }); // This might be causing the issue
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFeaturedProducts();
    fetchStats();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products/latest?limit=8');
      if (response.ok) {
        const data = await response.json();
        setFeaturedProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/products/categories');
      if (response.ok) {
        const data = await response.json();
        setStats({
          count: data.total || 0,
          name: 'Categories Available'
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ count: 0, name: 'Categories Available' });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/search-results', {
        state: { query: searchQuery, searchType: 'text' }
      });
    }
  };

  const handleImageSearch = () => {
    navigate('/search');
  };

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('shopsmarter_cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('shopsmarter_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const ProductCard = ({ product }) => (
    <div className={`group cursor-pointer ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300`}>
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
        <img
          src={product.image_url || `https://via.placeholder.com/400x400?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
          className="h-48 w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/400x400?text=${encodeURIComponent(product.name)}`;
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold truncate">{product.name}</h3>
        <p className="text-xs text-gray-500 mt-1">{product.category}</p>
        <p className="text-lg font-bold mt-2 text-indigo-600">
          ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
        </p>
        <button
          onClick={() => addToCart(product)}
          className="mt-3 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Shop Smarter with</span>{' '}
                  <span className="block text-indigo-600 xl:inline">AI Intelligence</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Upload an image and find similar products instantly. Our AI-powered shopping assistant makes discovering your perfect items effortless.
                </p>

                {/* Stats Section - FIXED: Render object properties, not the object */}
                <div className="mt-8 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-indigo-600">
                      {/* ✅ CORRECT: Access object property, not the whole object */}
                      {stats.count}
                    </p>
                    <p className="text-sm text-gray-500">
                      {/* ✅ CORRECT: Access object property, not the whole object */}
                      {stats.name}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-indigo-600">500+</p>
                    <p className="text-sm text-gray-500">Products Available</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-indigo-600">AI-Powered</p>
                    <p className="text-sm text-gray-500">Smart Recommendations</p>
                  </div>
                </div>

                {/* Search Section */}
                <div className="mt-8 space-y-4">
                  {/* Text Search */}
                  <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for products..."
                      className={`flex-1 px-4 py-3 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                    >
                      Search
                    </button>
                  </form>

                  {/* Image Search Button */}
                  <button
                    onClick={handleImageSearch}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Search by Image
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold">Featured Products</h2>
            <p className="mt-4 text-gray-600">Discover our latest and most popular items</p>
          </div>

          {loading ? (
            <div className="mt-12 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No featured products available</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/search-results"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
            >
              View All Products
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={`py-16 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold">Why Choose ShopSmarter?</h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center">
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold">AI-Powered Search</h3>
              <p className="mt-2 text-gray-600">Upload any image and find similar products instantly using advanced AI technology.</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold">Personalized Recommendations</h3>
              <p className="mt-2 text-gray-600">Get tailored product suggestions based on your preferences and shopping history.</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold">Lightning Fast</h3>
              <p className="mt-2 text-gray-600">Get instant results with our optimized search algorithms and fast loading times.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
