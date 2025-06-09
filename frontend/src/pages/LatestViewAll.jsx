import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeContext from '../context/ThemeContext';

// Scroll detection hook
const useScrollDetection = () => {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  }, []);

  return { isScrolling, handleScroll };
};

const LatestViewAll = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  
  // Get data from navigation state
  const initialData = location.state || {};
  const [products, setProducts] = useState(initialData.products || []);
  const [filteredProducts, setFilteredProducts] = useState(initialData.products || []);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  
  // Scroll detection
  const { isScrolling, handleScroll } = useScrollDetection();
  
  // Filter states
  const [filters, setFilters] = useState({
    gender: '',
    categoryType: '',
    category: '',
    priceRange: [0, 1000],
    sortBy: 'relevance',
    inStock: false,
    minRating: 0,
    sectionType: 'latest'
  });
  
  // Predefined categories for dropdowns
  const genderOptions = useMemo(() => [
    { value: '', label: 'All Genders' },
    { value: 'men', label: 'Men' },
    { value: 'women', label: 'Women' },
    { value: 'kids', label: 'Kids' }
  ], []);

  const categoryTypeOptions = useMemo(() => [
    { value: '', label: 'All Categories' },
    { value: 'apparel', label: '👕 Apparel' },
    { value: 'accessories', label: '👜 Accessories' },
    { value: 'footwear', label: '👟 Footwear' },
    { value: 'personal_care', label: '🛍️ Personal Care' }
  ], []);

  // Get unique categories from products
  const availableCategories = useMemo(() => {
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return categories.sort();
  }, [products]);

  // Enhanced offer calculation for latest products
  const calculateOffer = useCallback((product, sectionType) => {
    if (!product || !product.id) return { discount: 0, badge: '', originalPrice: 0 };

    const basePrice = parseFloat(product.price || 0);
    const productSeed = product.id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    // Latest arrivals get smaller discounts (5-20%)
    const latestDiscounts = [5, 10, 15, 20];
    const discount = latestDiscounts[productSeed % latestDiscounts.length];
    const badge = discount <= 10 ? 'New Arrival' : `${discount}% Off`;
    const originalMultiplier = 1 / (1 - discount / 100);
    
    return {
      discount,
      badge,
      originalPrice: basePrice * originalMultiplier,
      currentPrice: basePrice,
      savings: basePrice * originalMultiplier - basePrice
    };
  }, []);

  // Load cart on component mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("shopsmarter_cart");
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(Array.isArray(parsedCart) ? parsedCart : []);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      setCart([]);
    }

    const handleCartUpdate = () => {
      try {
        const savedCart = localStorage.getItem("shopsmarter_cart");
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCart(Array.isArray(parsedCart) ? parsedCart : []);
        }
      } catch (error) {
        console.error("Error updating cart:", error);
      }
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  // Apply filters function
  const applyFilters = useCallback(() => {
    let filtered = [...products];

    // Gender filter
    if (filters.gender && filters.gender !== '') {
      filtered = filtered.filter(product => {
        const name = (product.name || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        
        const genderKeywords = {
          men: ['men', 'male', 'man', 'mens', "men's", 'masculine', 'him', 'his'],
          women: ['women', 'female', 'woman', 'womens', "women's", 'feminine', 'her', 'ladies', 'lady'],
          kids: ['kids', 'children', 'child', 'baby', 'toddler', 'youth', 'junior', 'girl', 'boy']
        };
        
        const keywords = genderKeywords[filters.gender] || [];
        return keywords.some(keyword => 
          name.includes(keyword) || 
          category.includes(keyword) || 
          description.includes(keyword)
        );
      });
    }

    // Category Type filter
    if (filters.categoryType && filters.categoryType !== '') {
      filtered = filtered.filter(product => {
        const name = (product.name || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        
        const categoryKeywords = {
          apparel: ['shirt', 'dress', 'pants', 'jeans', 'jacket', 'coat', 'sweater', 'hoodie', 'top', 'bottom', 'clothing', 'wear', 'blouse', 'skirt', 't-shirt', 'polo'],
          accessories: ['bag', 'wallet', 'watch', 'jewelry', 'belt', 'hat', 'cap', 'scarf', 'gloves', 'sunglasses', 'necklace', 'bracelet', 'ring', 'earrings'],
          footwear: ['shoes', 'boots', 'sneakers', 'sandals', 'heels', 'flats', 'loafers', 'athletic', 'running', 'walking', 'dress shoes', 'casual shoes'],
          personal_care: ['skincare', 'makeup', 'cosmetics', 'perfume', 'cologne', 'lotion', 'cream', 'shampoo', 'conditioner', 'soap', 'deodorant', 'toothpaste']
        };
        
        const keywords = categoryKeywords[filters.categoryType] || [];
        return keywords.some(keyword => 
          name.includes(keyword) || 
          category.includes(keyword)
        );
      });
    }

    // Existing category filter
    if (filters.category && filters.category !== '') {
      filtered = filtered.filter(product => 
        product.category && 
        product.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    // Price range filter
    filtered = filtered.filter(product => {
      const price = parseFloat(product.price || 0);
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Stock filter
    if (filters.inStock) {
      filtered = filtered.filter(product => product.in_stock !== false);
    }

    // Rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(product => {
        if (!product.id) return false;
        const seed = product.id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const rating = [4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9][seed % 9];
        return rating >= filters.minRating;
      });
    }

    // Add latest offer details to products
    filtered = filtered.map(product => ({
      ...product,
      sectionType: 'latest',
      offerDetails: calculateOffer(product, 'latest')
    }));

    // Sort products
    switch (filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
        break;
      case 'price_high':
        filtered.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
        break;
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'rating':
        filtered.sort((a, b) => {
          const getRating = (product) => {
            if (!product.id) return 0;
            const seed = product.id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return [4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9][seed % 9];
          };
          return getRating(b) - getRating(a);
        });
        break;
      case 'newest':
        filtered.sort((a, b) => (a.offerDetails?.discount || 0) - (b.offerDetails?.discount || 0));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  }, [products, filters, calculateOffer]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Fetch latest products
  const fetchAdditionalProducts = useCallback(async () => {
    if (products.length > 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/products/latest?limit=50');
      if (response.ok) {
        const data = await response.json();
        const newProducts = data.products || [];
        setProducts(newProducts);
        setFilteredProducts(newProducts);
      }
    } catch (error) {
      console.error('Error fetching latest products:', error);
    } finally {
      setLoading(false);
    }
  }, [products.length]);

  useEffect(() => {
    fetchAdditionalProducts();
  }, [fetchAdditionalProducts]);

  // Cart management functions (same as before - keeping them short for space)
  const addToCart = useCallback((product) => {
    try {
      if (!product || !product.id) return;
      setCart(prevCart => {
        const existingItem = prevCart.find((item) => item.id === product.id);
        let updatedCart;
        if (existingItem) {
          updatedCart = prevCart.map((item) =>
            item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
          );
        } else {
          updatedCart = [...prevCart, { ...product, quantity: 1 }];
        }
        localStorage.setItem("shopsmarter_cart", JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("cartUpdated"));
        return updatedCart;
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  }, []);

  const updateCartQuantity = useCallback((productId, change) => {
    try {
      setCart(prevCart => {
        const updatedCart = prevCart.map(item => {
          if (item.id === productId) {
            const newQuantity = (item.quantity || 1) + change;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        }).filter(Boolean);
        localStorage.setItem("shopsmarter_cart", JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("cartUpdated"));
        return updatedCart;
      });
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  }, []);

  const removeFromCart = useCallback((productId) => {
    try {
      setCart(prevCart => {
        const updatedCart = prevCart.filter(item => item.id !== productId);
        localStorage.setItem("shopsmarter_cart", JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("cartUpdated"));
        return updatedCart;
      });
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  }, []);

  // Filter handlers
  const handleGenderChange = useCallback((gender) => {
    setFilters(prev => ({ ...prev, gender }));
  }, []);

  const handleCategoryTypeChange = useCallback((categoryType) => {
    setFilters(prev => ({ ...prev, categoryType }));
  }, []);

  const handleCategoryChange = useCallback((category) => {
    setFilters(prev => ({ ...prev, category }));
  }, []);

  const handlePriceRangeChange = useCallback((range) => {
    setFilters(prev => ({ ...prev, priceRange: range }));
  }, []);

  const handleSortChange = useCallback((sortBy) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleStockFilter = useCallback((inStock) => {
    setFilters(prev => ({ ...prev, inStock }));
  }, []);

  const handleRatingFilter = useCallback((minRating) => {
    setFilters(prev => ({ ...prev, minRating }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      gender: '',
      categoryType: '',
      category: '',
      priceRange: [0, 1000],
      sortBy: 'relevance',
      inStock: false,
      minRating: 0,
      sectionType: 'latest'
    });
  }, []);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-50 backdrop-blur-xl bg-opacity-95`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(-1)}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                  ✨ Latest Arrivals
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                  <span className="ml-2 text-xs">• Fresh new items with introductory prices</span>
                </p>
              </div>
            </div>
            
            {/* Mobile sort */}
            <div className="md:hidden">
              <select
                value={filters.sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ENHANCED: Filters Sidebar with Auto-Hide Scrollbars */}
          <aside className={`lg:w-80 ${
            darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/60' : 'bg-gradient-to-br from-white to-gray-50/50'
          } backdrop-blur-xl rounded-3xl shadow-xl border ${
            darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
          } h-fit sticky top-24`}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                  <span className="mr-2">✨</span> Latest Filters
                </h2>
                <button
                  onClick={resetFilters}
                  className="text-green-600 hover:text-green-700 text-sm font-semibold transition-colors hover:scale-105 transform duration-200"
                >
                  Reset All
                </button>
              </div>

              {/* ENHANCED: Scrollable area with auto-hide scrollbars */}
              <div 
                className={`space-y-8 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-hide ${isScrolling ? 'scrolling' : ''}`}
                onScroll={handleScroll}
              >
                {/* Gender Filter */}
                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                    <span className="mr-2">👤</span> Gender
                  </h3>
                  <select
                    value={filters.gender}
                    onChange={(e) => handleGenderChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-sm font-medium transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-700/50 border-gray-600/50 text-white hover:bg-gray-700/70' 
                        : 'bg-white border-gray-300/50 text-gray-900 hover:bg-gray-50'
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:shadow-md`}
                  >
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Type Filter */}
                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                    <span className="mr-2">🏷️</span> Category Type
                  </h3>
                  <select
                    value={filters.categoryType}
                    onChange={(e) => handleCategoryTypeChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-sm font-medium transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-700/50 border-gray-600/50 text-white hover:bg-gray-700/70' 
                        : 'bg-white border-gray-300/50 text-gray-900 hover:bg-gray-50'
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:shadow-md`}
                  >
                    {categoryTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specific Category Filter */}
                {availableCategories.length > 0 && (
                  <div>
                    <h3 className={`text-sm font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                      <span className="mr-2">🔖</span> Specific Category
                    </h3>
                    <div className={`space-y-3 max-h-48 overflow-y-auto scrollbar-hide ${isScrolling ? 'scrolling' : ''}`} onScroll={handleScroll}>
                      <label className="flex items-center py-2 cursor-pointer hover:bg-opacity-50 rounded-lg px-2 transition-colors">
                        <input
                          type="radio"
                          name="category"
                          checked={filters.category === ''}
                          onChange={() => handleCategoryChange('')}
                          className="text-green-600 focus:ring-green-500 focus:ring-2"
                        />
                        <span className={`ml-3 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          All Categories
                        </span>
                      </label>
                      {availableCategories.slice(0, 6).map((category) => (
                        <label key={category} className="flex items-center py-2 cursor-pointer hover:bg-opacity-50 rounded-lg px-2 transition-colors">
                          <input
                            type="radio"
                            name="category"
                            checked={filters.category === category}
                            onChange={() => handleCategoryChange(category)}
                            className="text-green-600 focus:ring-green-500 focus:ring-2"
                          />
                          <span className={`ml-3 text-sm font-medium capitalize truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {category}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                    <span className="mr-2">💰</span> Price Range
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.priceRange[0]}
                        onChange={(e) => handlePriceRangeChange([parseInt(e.target.value) || 0, filters.priceRange[1]])}
                        className={`px-4 py-3 border rounded-xl text-sm font-medium transition-all duration-200 ${
                          darkMode 
                            ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 hover:bg-gray-700/70' 
                            : 'bg-white border-gray-300/50 text-gray-900 placeholder-gray-500 hover:bg-gray-50'
                        } focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:shadow-md`}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.priceRange[1]}
                        onChange={(e) => handlePriceRangeChange([filters.priceRange[0], parseInt(e.target.value) || 1000])}
                        className={`px-4 py-3 border rounded-xl text-sm font-medium transition-all duration-200 ${
                          darkMode 
                            ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 hover:bg-gray-700/70' 
                            : 'bg-white border-gray-300/50 text-gray-900 placeholder-gray-500 hover:bg-gray-50'
                        } focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:shadow-md`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        [0, 50, '$0-50'],
                        [50, 100, '$50-100'],
                        [100, 200, '$100-200'],
                        [200, 500, '$200-500']
                      ].map(([min, max, label]) => (
                        <button
                          key={`${min}-${max}`}
                          onClick={() => handlePriceRangeChange([min, max])}
                          className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 hover:scale-105 ${
                            filters.priceRange[0] === min && filters.priceRange[1] === max
                              ? 'bg-green-600 text-white border-green-600 shadow-lg'
                              : darkMode
                                ? 'border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500'
                                : 'border-gray-300/50 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                    <span className="mr-2">⭐</span> Minimum Rating
                  </h3>
                  <div className="space-y-3">
                    {[0, 3, 4, 4.5].map((rating) => (
                      <label key={rating} className="flex items-center py-2 cursor-pointer hover:bg-opacity-50 rounded-lg px-2 transition-colors">
                        <input
                          type="radio"
                          name="rating"
                          checked={filters.minRating === rating}
                          onChange={() => handleRatingFilter(rating)}
                          className="text-green-600 focus:ring-green-500 focus:ring-2"
                        />
                        <span className={`ml-3 text-sm font-medium flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {rating === 0 ? 'All Ratings' : (
                            <>
                              {rating}+ 
                              <div className="flex ml-2">
                                {[...Array(5)].map((_, i) => (
                                  <svg key={i} className={`w-3 h-3 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Stock Filter */}
                <div>
                  <label className="flex items-center py-3 cursor-pointer hover:bg-opacity-50 rounded-lg px-2 transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) => handleStockFilter(e.target.checked)}
                      className="text-green-600 focus:ring-green-500 focus:ring-2 rounded"
                    />
                    <span className={`ml-3 text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                      <span className="mr-2">✅</span> In Stock Only
                    </span>
                  </label>
                </div>

                {/* Desktop Sort */}
                <div className="hidden md:block">
                  <h3 className={`text-sm font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                    <span className="mr-2">🔄</span> Sort By
                  </h3>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-sm font-medium transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-700/50 border-gray-600/50 text-white hover:bg-gray-700/70' 
                        : 'bg-white border-gray-300/50 text-gray-900 hover:bg-gray-50'
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:shadow-md`}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="newest">Newest First</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="name">Name A-Z</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading latest arrivals...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">✨</div>
                <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  No latest arrivals found
                </h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6 max-w-md mx-auto`}>
                  We couldn't find any latest arrivals matching your criteria. Try adjusting your filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                {/* Active Filters Display */}
                {(filters.gender || filters.categoryType || filters.category) && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {filters.gender && (
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          👤 {genderOptions.find(g => g.value === filters.gender)?.label}
                          <button
                            onClick={() => handleGenderChange('')}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {filters.categoryType && (
                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {categoryTypeOptions.find(c => c.value === filters.categoryType)?.label}
                          <button
                            onClick={() => handleCategoryTypeChange('')}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {filters.category && (
                        <span className="inline-flex items-center px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
                          🔖 {filters.category}
                          <button
                            onClick={() => handleCategoryChange('')}
                            className="ml-2 text-teal-600 hover:text-teal-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={product.id || index}
                      product={product}
                      index={index}
                      cart={cart}
                      addToCart={addToCart}
                      updateCartQuantity={updateCartQuantity}
                      removeFromCart={removeFromCart}
                      navigate={navigate}
                      darkMode={darkMode}
                      sectionType="latest"
                      calculateOffer={calculateOffer}
                    />
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ENHANCED: Auto-Hide Scrollbar Styles for Latest */}
      <style jsx>{`
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .scrollbar-hide::-webkit-scrollbar {
          width: 3px;
          height: 3px;
          opacity: 0;
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: transparent;
        }

        .scrollbar-hide::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 0;
        }

        .scrollbar-hide::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0);
          border-radius: 2px;
          border: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .scrollbar-hide:hover::-webkit-scrollbar,
        .scrollbar-hide:active::-webkit-scrollbar {
          opacity: 1;
        }

        .scrollbar-hide:hover::-webkit-scrollbar-thumb,
        .scrollbar-hide:active::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.6);
        }

        .scrollbar-hide:hover::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.8);
        }

        ${darkMode ? `
          .scrollbar-hide:hover::-webkit-scrollbar-thumb,
          .scrollbar-hide:active::-webkit-scrollbar-thumb {
            background: rgba(34, 197, 94, 0.6);
          }

          .scrollbar-hide:hover::-webkit-scrollbar-thumb:hover {
            background: rgba(34, 197, 94, 0.8);
          }
        ` : ''}

        .scrollbar-hide.scrolling::-webkit-scrollbar {
          opacity: 1;
        }

        .scrollbar-hide.scrolling::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.7);
        }
      `}</style>
    </div>
  );
};

// Product Card Component (same structure with green theme for Latest)
const ProductCard = React.memo(({ product, index, cart, addToCart, updateCartQuantity, removeFromCart, navigate, darkMode, sectionType, calculateOffer }) => {
  const generateRating = useCallback((productId) => {
    if (!productId) return 4.5;
    const seed = productId.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const ratings = [4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9];
    return ratings[seed % ratings.length];
  }, []);

  const cartItem = useMemo(() => 
    cart.find(item => item.id === product.id)
  , [cart, product.id]);

  const offerDetails = useMemo(() => {
    if (product.offerDetails) return product.offerDetails;
    return calculateOffer ? calculateOffer(product, sectionType) : {
      discount: 10,
      badge: 'New Arrival',
      originalPrice: parseFloat(product.price || 0) * 1.11,
      currentPrice: parseFloat(product.price || 0),
      savings: parseFloat(product.price || 0) * 0.11
    };
  }, [calculateOffer, product, sectionType]);

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    const productWithOffer = {
      ...product,
      offerDetails,
      sectionType: sectionType || product.sectionType
    };
    addToCart(productWithOffer);
  }, [addToCart, product, offerDetails, sectionType]);

  const handleUpdateQuantity = useCallback((e, change) => {
    e.stopPropagation();
    updateCartQuantity(product.id, change);
  }, [updateCartQuantity, product.id]);

  const handleRemoveFromCart = useCallback((e) => {
    e.stopPropagation();
    removeFromCart(product.id);
  }, [removeFromCart, product.id]);

  const handleProductClick = useCallback(() => {
    navigate("/product-detail", { 
      state: { 
        product: {
          ...product,
          offerDetails,
          sectionType: sectionType || product.sectionType
        }
      } 
    });
  }, [navigate, product, offerDetails, sectionType]);

  if (!product) return null;

  const rating = generateRating(product.id);
  const reviewCount = Math.floor(Math.random() * 500) + 50;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`group relative cursor-pointer overflow-hidden rounded-3xl transition-all duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-gray-800/80 to-gray-900/60 border border-gray-700/50 hover:border-green-600 hover:shadow-2xl hover:shadow-green-900/20"
          : "bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/50 shadow-lg hover:border-green-300 hover:shadow-2xl hover:shadow-green-900/10"
      } hover:-translate-y-2 backdrop-blur-xl`}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-t-3xl">
        <img
          src={product.image_url || `https://via.placeholder.com/400x400?text=${encodeURIComponent(product.name || 'Product')}`}
          alt={product.name || 'Product'}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onClick={handleProductClick}
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/400x400?text=${encodeURIComponent(product.name || 'Product')}`;
          }}
        />

        {/* Badge - Top Right */}
        <div className="absolute top-4 right-4">
          <div className={`${
            offerDetails.discount <= 10 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
              : 'bg-gradient-to-r from-blue-500 to-indigo-500'
          } text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg backdrop-blur-sm`}>
            {offerDetails.badge}
          </div>
        </div>

        {/* Just Arrived Badge */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-black/70 text-white text-xs font-medium px-3 py-2 rounded-xl backdrop-blur-sm">
            ✨ Just Arrived
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-6 space-y-4">
        {/* Product Title */}
        <div className="h-12 flex items-start">
          <h3
            className={`text-base font-bold leading-tight line-clamp-2 group-hover:text-green-600 transition-colors duration-200 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
            onClick={handleProductClick}
          >
            {product.name || 'Unnamed Product'}
          </h3>
        </div>

        {/* Rating Section - Fixed Height */}
        <div className="h-6 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className={`text-sm ml-1 font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              ({rating})
            </span>
          </div>
        </div>

        {/* Reviews Section - Fixed Height */}
        <div className="h-5">
          <span className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            {reviewCount} reviews
          </span>
        </div>

        {/* Price Section - Fixed Height */}
        <div className="h-16 space-y-2">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              ${offerDetails.currentPrice.toFixed(2)}
            </span>
            {offerDetails.originalPrice > offerDetails.currentPrice && (
              <span className={`text-sm line-through font-medium ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                ${offerDetails.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          {offerDetails.savings > 0 && (
            <div className="flex items-center">
              <span className="text-sm text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
                Save ${offerDetails.savings.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Stock Status - Fixed Height */}
        <div className="h-6 flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-green-600 font-semibold">In Stock</span>
        </div>

        {/* Cart Controls - Fixed Height */}
        <div className="h-14 pt-2">
          {cartItem ? (
            <div className={`flex items-center justify-between h-12 ${
              darkMode ? 'bg-gray-700/30' : 'bg-gray-50'
            } rounded-xl p-3`}>
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => handleUpdateQuantity(e, -1)}
                  className={`w-8 h-8 rounded-full ${
                    darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-white hover:bg-gray-50 text-gray-700 shadow-sm border border-gray-200'
                  } flex items-center justify-center font-bold text-lg transition-all duration-200 hover:scale-110`}
                >
                  −
                </button>
                <span className={`font-bold text-lg min-w-[2rem] text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {cartItem.quantity}
                </span>
                <button
                  onClick={(e) => handleUpdateQuantity(e, 1)}
                  className={`w-8 h-8 rounded-full ${
                    darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-white hover:bg-gray-50 text-gray-700 shadow-sm border border-gray-200'
                  } flex items-center justify-center font-bold text-lg transition-all duration-200 hover:scale-110`}
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 
                text-white rounded-xl font-bold text-sm transition-all duration-200 
                shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center space-x-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5"
                />
              </svg>
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default LatestViewAll;
