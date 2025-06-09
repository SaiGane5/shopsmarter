import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ThemeContext from '../context/ThemeContext';

const genderOptions = [
  { label: 'All Genders', value: '' },
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Kids', value: 'kids' },
];

const priceRangeOptions = [
  { label: 'All', min: '', max: '' },
  { label: '$0-50', min: 0, max: 50 },
  { label: '$50-100', min: 50, max: 100 },
  { label: '$100-200', min: 100, max: 200 },
  { label: '$200-500', min: 200, max: 500 },
  { label: '$0-1000', min: 0, max: 1000 },
];

const ratingOptions = [
  { label: 'All Ratings', value: '' },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '4.5+', value: 4.5 },
];

const sortOptions = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Price: Low to High', value: 'price_low' },
  { label: 'Price: High to Low', value: 'price_high' },
  { label: 'A-Z', value: 'name' },
  { label: 'High Rated', value: 'high_rated' },
];

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store unfiltered products
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);

  // Filters state
  const [filters, setFilters] = useState({
    gender: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    inStock: false,
    sortBy: 'relevance',
  });

  const { query } = location.state || {};

  // Load products and cart on mount or when search/filter changes
  useEffect(() => {
    if (location.state?.products) {
      setProducts(location.state.products);
      setAllProducts(location.state.products);
    } else if (query) {
      performSearch();
    }
    loadCart();
    // eslint-disable-next-line
  }, [location.state, query]);

  // Load cart from localStorage
  const loadCart = () => {
    const savedCart = localStorage.getItem('shopsmarter_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  // FIXED: Consistent rating generation (same as ProductDetail)
  const generateDynamicRating = (productId) => {
    if (!productId) return 4.5;
    const seed = productId.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const ratings = [4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9];
    return ratings[seed % ratings.length];
  };

  // FIXED: Consistent review count generation (same as ProductDetail)
  const generateReviewCount = (productId) => {
    if (!productId) return 50;
    const seed = productId.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return Math.floor((seed % 150) + 50); // Consistent range 50-200
  };

  // Cart functions
  const isInCart = (productId) => {
    return cart.find(item => item.id === productId);
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    let updatedCart;
    if (existingItem) {
      updatedCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: (item.quantity || 1) + 1 }
          : item
      );
    } else {
      updatedCart = [...cart, { ...product, quantity: 1 }];
    }
    setCart(updatedCart);
    localStorage.setItem('shopsmarter_cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateCartQuantity = (productId, change) => {
    const updatedCart = cart.map(item => {
      if (item.id === productId) {
        const newQuantity = (item.quantity || 1) + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean);
    
    setCart(updatedCart);
    localStorage.setItem('shopsmarter_cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // Enhanced gender filtering function
  const filterByGender = (products, genderFilter) => {
    if (!genderFilter || genderFilter === '') {
      return products;
    }

    return products.filter(product => {
      const productName = product.name.toLowerCase();
      const genderTerm = genderFilter.toLowerCase();
      
      switch (genderTerm) {
        case 'men':
          return (productName.includes('men') || productName.includes('male')) && 
                 !productName.includes('women') && 
                 !productName.includes('female');
        case 'women':
          return productName.includes('women') || 
                 productName.includes('female') || 
                 productName.includes('ladies') ||
                 (productName.includes('girl') && !productName.includes('girls'));
        case 'kids':
          return productName.includes('kids') || 
                 productName.includes('child') || 
                 productName.includes('children') ||
                 productName.includes('boy') || 
                 productName.includes('girl') ||
                 productName.includes('youth') ||
                 productName.includes('junior') ||
                 productName.includes('teen');
        default:
          return true;
      }
    });
  };

  // Enhanced search function
  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        limit: '50',
        sort_by: filters.sortBy,
      });

      if (filters.minPrice !== '') params.append('min_price', filters.minPrice);
      if (filters.maxPrice !== '') params.append('max_price', filters.maxPrice);
      if (filters.minRating) params.append('min_rating', filters.minRating);
      if (filters.inStock) params.append('in_stock', 'true');

      const response = await fetch(`/api/products/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        let allProducts = data.products || [];
        setAllProducts(allProducts);
        
        // Apply gender filtering client-side
        const filteredProducts = filterByGender(allProducts, filters.gender);
        setProducts(filteredProducts);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  // Handle price presets
  const handlePricePreset = (min, max) => {
    setFilters(prev => ({
      ...prev,
      minPrice: min === '' ? '' : min,
      maxPrice: max === '' ? '' : max,
    }));
  };

  // Apply filters and search
  const applyFilters = () => {
    performSearch();
  };

  // ADDED: Clear all filters
  const clearAllFilters = () => {
    setFilters({
      gender: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      inStock: false,
      sortBy: 'relevance',
    });
    
    // Reset to show all original search results
    setProducts(allProducts);
  };

  // ENHANCED: Product card component with improved cart controls and hover effects
  const ProductCard = ({ product }) => {
    const dynamicRating = generateDynamicRating(product.id);
    const reviewCount = generateReviewCount(product.id);
    const cartItem = isInCart(product.id);

    return (
      <div
        className={`group cursor-pointer ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-indigo-500' : 'bg-white border-gray-200 hover:border-indigo-500'} rounded-xl shadow-md border-2 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
        onClick={() =>
          navigate('/product-detail', {
            state: {
              product: { ...product, dynamicRating, reviewCount },
              searchQuery: query,
              fromSearch: true,
            },
          })
        }
      >
        <div className="aspect-square overflow-hidden relative">
          <img
            src={product.image_url || `https://via.placeholder.com/300x300?text=${encodeURIComponent(product.name)}`}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(product.name)}`;
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <button className="bg-white text-gray-900 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 font-medium">
              View Details
            </button>
          </div>
        </div>
        <div className="p-4">
          <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} line-clamp-2 min-h-[2.5rem]`}>
            {product.name}
          </h3>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {product.category}
          </p>
          
          {/* FIXED: Consistent rating display */}
          <div className="flex items-center mt-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(dynamicRating) ? 'text-yellow-400' : 'text-gray-300'} fill-current`}
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <span className={`text-xs ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {dynamicRating} ({reviewCount})
            </span>
          </div>
          
          <p className="text-lg font-bold text-indigo-600 mt-2">
            ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
          </p>
          
          {/* ENHANCED: Dynamic cart button behavior */}
          {cartItem ? (
            <div 
              className="mt-3 flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => updateCartQuantity(product.id, -1)}
                className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
              >
                -
              </button>
              <span className="font-semibold text-sm">{cartItem.quantity}</span>
              <button
                onClick={() => updateCartQuantity(product.id, 1)}
                className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="mt-3 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    );
  };

  const filterBoxClass = `
    lg:col-span-1 
    ${darkMode ? 'bg-gray-800' : 'bg-white'} 
    rounded-lg shadow-lg border p-6 h-fit
    overflow-y-auto 
    scrollbar-hide
    sticky top-8
  `;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold">
            Search Results for "{query}" 
            {filters.gender && (
              <span className="text-indigo-600"> • {filters.gender.charAt(0).toUpperCase() + filters.gender.slice(1)}</span>
            )}
          </h1>
          <p className="text-gray-600 mt-2">
            Found {products.length} products
            {filters.gender && (
              <span className="text-indigo-600"> for {filters.gender}</span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ENHANCED: Professional filters without emojis */}
          <div className={filterBoxClass} style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Gender
                </label>
                <select
                  value={filters.gender}
                  onChange={e => handleFilterChange('gender', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-indigo-500 text-sm`}
                >
                  {genderOptions.map((opt, idx) => (
                    <option key={idx} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {filters.gender && (
                  <div className={`text-xs mt-1 px-2 py-1 rounded ${darkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>
                    Active: {filters.gender.charAt(0).toUpperCase() + filters.gender.slice(1)}
                  </div>
                )}
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price Range
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {priceRangeOptions.map((range, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePricePreset(range.min, range.max)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium border ${filters.minPrice == range.min && filters.maxPrice == range.max ? 'bg-indigo-600 text-white border-indigo-600' : darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'} hover:bg-indigo-500 hover:text-white transition`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={e => handleFilterChange('minPrice', e.target.value)}
                    placeholder="Min"
                    className={`px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-indigo-500 text-sm`}
                  />
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={e => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="Max"
                    className={`px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-indigo-500 text-sm`}
                  />
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={e => handleFilterChange('minRating', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-indigo-500 text-sm`}
                >
                  {ratingOptions.map((opt, idx) => (
                    <option key={idx} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* In Stock Only */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={filters.inStock}
                  onChange={e => handleFilterChange('inStock', e.target.checked)}
                  className="accent-indigo-600 w-4 h-4"
                />
                <label htmlFor="inStock" className="text-sm font-medium">
                  In Stock Only
                </label>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={e => handleFilterChange('sortBy', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-indigo-500 text-sm`}
                >
                  {sortOptions.map((opt, idx) => (
                    <option key={idx} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={applyFilters}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors mt-2 font-semibold shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found matching your search.</p>
                {filters.gender && (
                  <p className="text-gray-400 text-sm mt-2">
                    Try removing the "{filters.gender}" filter or searching for different terms.
                  </p>
                )}
                <div className="flex gap-2 justify-center mt-4">
                  {(filters.gender || filters.minPrice || filters.maxPrice || filters.minRating || filters.inStock) && (
                    <button
                      onClick={clearAllFilters}
                      className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
                    >
                      Clear All Filters
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/')}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Try a different search
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Hide scrollbar utility */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default SearchResults;
