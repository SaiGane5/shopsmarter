import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import ThemeContext from "../context/ThemeContext";
import video from "../assets/videoOfShopping.mp4";

const LandingPage = React.memo(() => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const [latestProducts, setLatestProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Voice Recognition refs
  const recognitionRef = useRef(null);

  // ENHANCED: Scroll position preservation
  const scrollPositionRef = useRef(0);
  
  // Save scroll position before navigation
  const saveScrollPosition = useCallback(() => {
    scrollPositionRef.current = window.scrollY;
    sessionStorage.setItem('landingPageScrollPosition', window.scrollY.toString());
  }, []);

  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    const savedPosition = sessionStorage.getItem('landingPageScrollPosition');
    if (savedPosition) {
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedPosition),
          behavior: 'smooth'
        });
      }, 100);
    }
  }, []);

  // ENHANCED: Dynamic offer calculation based on section type
  const calculateOffer = useCallback((product, sectionType) => {
    if (!product || !product.id) return { discount: 0, badge: '', originalPrice: 0 };

    const basePrice = parseFloat(product.price || 0);
    const productSeed = product.id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    let discount, badge, originalMultiplier;
    
    switch (sectionType) {
      case 'trending':
        // Trending items get higher discounts (20-50%) since they're popular
        const trendingDiscounts = [20, 25, 30, 35, 40, 45, 50];
        discount = trendingDiscounts[productSeed % trendingDiscounts.length];
        badge = `Save ${discount}%`;
        originalMultiplier = 1 / (1 - discount / 100);
        break;
        
      case 'latest':
        // Latest arrivals get smaller discounts (5-20%) since they're new
        const latestDiscounts = [5, 10, 15, 20];
        discount = latestDiscounts[productSeed % latestDiscounts.length];
        badge = discount <= 10 ? 'New Arrival' : `${discount}% Off`;
        originalMultiplier = 1 / (1 - discount / 100);
        break;
        
      case 'limited':
        // Limited time offers
        discount = 25;
        badge = 'Limited Time';
        originalMultiplier = 1.4;
        break;
        
      default:
        discount = 15;
        badge = 'Sale';
        originalMultiplier = 1.25;
    }
    
    return {
      discount,
      badge,
      originalPrice: basePrice * originalMultiplier,
      currentPrice: basePrice,
      savings: basePrice * originalMultiplier - basePrice
    };
  }, []);

  // MEMOIZED animation variants to prevent recreation
  const animationVariants = useMemo(() => ({
    containerVariants: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          delayChildren: 0.2,
          staggerChildren: 0.1,
        },
      },
    },
    fadeInVariants: {
      hidden: { opacity: 0, y: 30 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          ease: "easeOut",
        },
      },
    },
    cardVariants: {
      hidden: { opacity: 0, y: 50 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          ease: "easeOut",
        },
      },
    }
  }), []);

  // Initialize Voice Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // MEMOIZED data fetching
  const fetchData = useCallback(async () => {
    try {
      const [latestRes, trendingRes, categoriesRes] = await Promise.all([
        fetch("/api/products/latest?limit=8"),
        fetch("/api/products/trending?limit=8"),
        fetch("/api/products/categories"),
      ]);

      if (latestRes.ok) {
        const latestData = await latestRes.json();
        setLatestProducts(Array.isArray(latestData.products) ? latestData.products : []);
      }

      if (trendingRes.ok) {
        const trendingData = await trendingRes.json();
        setTrendingProducts(Array.isArray(trendingData.products) ? trendingData.products : []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        // FIXED: Safe category processing
        const validCategories = (categoriesData.categories || [])
          .filter(cat => cat && typeof cat === 'string' && cat.trim().length > 0)
          .map(cat => cat.toString().trim());
        setCategories(validCategories);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setLatestProducts([]);
      setTrendingProducts([]);
      setCategories([]);
    }
  }, []);

  // MEMOIZED cart loading
  const loadCart = useCallback(() => {
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
  }, []);

  useEffect(() => {
    fetchData();
    loadCart();
    
    // ENHANCED: Restore scroll position when coming back
    restoreScrollPosition();
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };
    
    // Save scroll position before page unload
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [fetchData, loadCart, restoreScrollPosition, saveScrollPosition]);

  // MEMOIZED search handler
  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    saveScrollPosition(); // Save position before navigation
    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        navigate("/search-results", {
          state: {
            products: data.products || [],
            query: searchQuery,
            searchType: "text",
          },
        });
      } else {
        console.error("Search failed");
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, navigate, saveScrollPosition]);

  // MEMOIZED voice search handler
  const handleVoiceSearch = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening]);

  // ENHANCED: Cart management functions
  const addToCart = useCallback((product) => {
    try {
      if (!product || !product.id) {
        console.error("Invalid product for cart:", product);
        return;
      }

      setCart(prevCart => {
        const existingItem = prevCart.find((item) => item.id === product.id);
        let updatedCart;

        if (existingItem) {
          updatedCart = prevCart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: (item.quantity || 1) + 1 }
              : item
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

  // MEMOIZED scroll handler
  const scrollToNextSection = useCallback(() => {
    const nextSection = document.getElementById("categories-section");
    if (nextSection) {
      nextSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  // MEMOIZED cart count
  const cartCount = useMemo(() => 
    cart.reduce((total, item) => total + (item.quantity || 1), 0)
  , [cart]);

  // FIXED: Category search handler
  const handleCategorySearch = useCallback(async (categoryName) => {
  try {
    saveScrollPosition(); // Save position before navigation
    
    // Determine category type based on name
    let categoryType = '';
    const name = categoryName.toLowerCase();
    
    if (['accessories', 'bags', 'jewelry'].some(key => name.includes(key))) {
      categoryType = 'accessories';
    } else if (['footwear', 'shoes', 'boots'].some(key => name.includes(key))) {
      categoryType = 'footwear';
    } else if (['personal care', 'beauty', 'skincare'].some(key => name.includes(key))) {
      categoryType = 'personal_care';
    } else {
      categoryType = 'apparel';
    }
    
    const response = await fetch(
      `/api/products/search?q=${encodeURIComponent(categoryName)}&category=${encodeURIComponent(categoryName)}&limit=20`
    );
    if (response.ok) {
      const data = await response.json();
      navigate("/search-results", {
        state: {
          products: data.products || [],
          query: categoryName,
          searchType: "explore_collection",
          categoryType: categoryType,
        },
      });
    }
  } catch (error) {
    console.error("Error searching category:", error);
  }
}, [navigate, saveScrollPosition]);

  // ENHANCED: View all products handler for trending/latest
  const handleViewAllProducts = useCallback(async (sectionType) => {
  try {
    saveScrollPosition(); // Save position before navigation
    
    let endpoint = "";
    let route = "";
    
    if (sectionType === "trending") {
      endpoint = "/api/products/trending?limit=50";
      route = "/trending-products"; // NEW ROUTE
    } else if (sectionType === "latest") {
      endpoint = "/api/products/latest?limit=50";
      route = "/latest-arrivals"; // NEW ROUTE
    }
    
    const response = await fetch(endpoint);
    if (response.ok) {
      const data = await response.json();
      navigate(route, {
        state: {
          products: data.products || [],
          query: sectionType === "trending" ? "Trending Products" : "Latest Arrivals",
          searchType: sectionType,
          sectionType: sectionType, // Pass section type for consistent styling
        },
      });
    } else {
      console.error(`Failed to fetch ${sectionType} products`);
    }
  } catch (error) {
    console.error(`Error fetching ${sectionType} products:`, error);
  }
}, [navigate, saveScrollPosition]);

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      } transition-colors duration-500 relative overflow-hidden`}
    >
      {/* Hero Section with Video Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            src={video}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            style={{ opacity: 0.6 }}
          />
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Hero Content - CENTERED LAYOUT */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-12">
            {/* Hero Text - CENTERED */}
            <motion.h1
              className="font-extrabold text-4xl sm:text-5xl md:text-6xl leading-tight mb-6"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              <motion.span
                className="block text-white"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Shop
              </motion.span>
              <motion.span
                className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                Smarter
              </motion.span>
              <motion.span
                className="block text-xl sm:text-2xl md:text-3xl mt-2 bg-gradient-to-r from-yellow-300 via-pink-300 to-red-300 bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                with AI Magic ✨
              </motion.span>
            </motion.h1>

            <motion.p
              className="text-base sm:text-lg md:text-xl text-gray-100 max-w-3xl mx-auto mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              Discover products like never before. <br />
              <span className="font-semibold text-yellow-300">
                Upload any image
              </span>{" "}
              to find similar items instantly, or search through{" "}
              <span className="font-semibold text-yellow-300">
                thousands of products
              </span>{" "}
              with our revolutionary AI technology.
            </motion.p>

            {/* CENTERED Search Bar with Voice Search */}
            <motion.div
              className="flex justify-center items-center mb-8"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
            >
              <form
                onSubmit={handleSearch}
                className="relative group w-full max-w-3xl"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                  <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-2 shadow-2xl border border-white/20">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="What are you looking for today?"
                        className="flex-1 px-8 py-6 text-xl bg-transparent border-0 outline-none text-gray-900 placeholder-gray-500 font-medium"
                      />
                      
                      {/* Voice Search Button */}
                      <button
                        type="button"
                        onClick={handleVoiceSearch}
                        className={`mx-2 p-4 rounded-xl transition-all duration-300 ${
                          isListening 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isListening ? 'Stop listening' : 'Voice search'}
                      >
                        {isListening ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        )}
                      </button>

                      {/* Search Button */}
                      <button
                        type="submit"
                        disabled={searchLoading || !searchQuery.trim()}
                        className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-10 py-6 rounded-2xl 
                          font-bold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 
                          disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 
                          flex items-center min-w-[140px] justify-center"
                      >
                        {searchLoading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <svg
                              className="w-6 h-6 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              ></path>
                            </svg>
                            Search
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </motion.div>

            {/* CTA Buttons - CENTERED */}
            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center mb-20"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.8 }}
            >
              <button
                onClick={() => {
                  saveScrollPosition();
                  navigate("/search");
                }}
                className="group relative inline-flex items-center px-12 py-6 text-xl font-bold rounded-2xl text-white 
                  bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl hover:shadow-white/10 
                  hover:scale-105 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative z-10 flex items-center">
                  <svg
                    className="w-6 h-6 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                  AI Image Search
                </span>
              </button>

              {cart.length > 0 && (
                <button
                  onClick={() => {
                    saveScrollPosition();
                    navigate("/checkout", { state: { cart } });
                  }}
                  className="group relative inline-flex items-center px-12 py-6 text-xl font-bold rounded-2xl text-white 
                    bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 
                    shadow-2xl hover:shadow-green-500/25 hover:scale-105 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center">
                    <svg
                      className="w-6 h-6 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6"
                      ></path>
                    </svg>
                    View Cart ({cartCount})
                  </span>
                </button>
              )}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={scrollToNextSection}
            className="flex flex-col items-center space-y-2 group cursor-pointer animate-bounce"
          >
            <span className="text-white/70 text-sm font-medium group-hover:text-white transition-colors duration-300 text-center">
              Discover More
            </span>
            <div className="w-8 h-8 border-2 border-white/60 rounded-full flex items-center justify-center group-hover:border-white group-hover:bg-white/10 transition-all duration-300">
              <svg
                className="w-4 h-4 text-white/60 group-hover:text-white transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                ></path>
              </svg>
            </div>
          </button>
        </div>
      </section>

      {/* FIXED: Categories Section - Based on actual data */}
      <CategoriesSection 
        categories={categories} 
        navigate={navigate}
        darkMode={darkMode}
        variants={animationVariants}
        onCategoryClick={handleCategorySearch}
        saveScrollPosition={saveScrollPosition}
      />

      {/* ENHANCED: Trending Products Section */}
      {trendingProducts.length > 0 && (
        <TrendingSection 
          products={trendingProducts}
          cart={cart}
          addToCart={addToCart}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
          navigate={navigate}
          darkMode={darkMode}
          variants={animationVariants}
          saveScrollPosition={saveScrollPosition}
          calculateOffer={calculateOffer}
          onViewAll={handleViewAllProducts}
        />
      )}

      {/* ENHANCED: Latest Products Section */}
      {latestProducts.length > 0 && (
        <LatestSection 
          products={latestProducts}
          cart={cart}
          addToCart={addToCart}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
          navigate={navigate}
          darkMode={darkMode}
          variants={animationVariants}
          saveScrollPosition={saveScrollPosition}
          calculateOffer={calculateOffer}
          onViewAll={handleViewAllProducts}
        />
      )}

      {/* Features Section */}
      <FeaturesSection 
        darkMode={darkMode}
        variants={animationVariants}
      />

      {/* Final CTA Section */}
      <FinalCTASection 
        navigate={navigate}
        variants={animationVariants}
        saveScrollPosition={saveScrollPosition}
      />

      {/* Grid Pattern Style */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: linear-gradient(
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            );
          background-size: 20px 20px;
        }

        .rounded-4xl {
          border-radius: 2rem;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .animate-bounce {
          animation: bounce 2s infinite;
        }
      `}</style>
    </div>
  );
});

// ENHANCED: Product Card with CONSISTENT button colors
const ProductCard = React.memo(({ product, index, cart, addToCart, updateCartQuantity, removeFromCart, navigate, darkMode, saveScrollPosition, sectionType, calculateOffer }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // FIXED: Dynamic rating generation based on product ID
  const generateRating = useCallback((productId) => {
    if (!productId) return 4.5;
    const seed = productId.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const ratings = [4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9];
    return ratings[seed % ratings.length];
  }, []);

  const cardVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }), []);

  const cartItem = useMemo(() => 
    cart.find(item => item.id === product.id)
  , [cart, product.id]);

  // ENHANCED: Calculate dynamic offers based on section type
  const offerDetails = useMemo(() => 
    calculateOffer ? calculateOffer(product, sectionType) : {
      discount: 15,
      badge: 'Sale',
      originalPrice: parseFloat(product.price || 0) * 1.25,
      currentPrice: parseFloat(product.price || 0),
      savings: parseFloat(product.price || 0) * 0.25
    }
  , [calculateOffer, product, sectionType]);

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    // Add offer details to product when adding to cart
    const productWithOffer = {
      ...product,
      offerDetails,
      sectionType
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
    if (saveScrollPosition) saveScrollPosition();
    // Pass offer details to product detail page
    navigate("/product-detail", { 
      state: { 
        product: {
          ...product,
          offerDetails,
          sectionType
        }
      } 
    });
  }, [navigate, product, saveScrollPosition, offerDetails, sectionType]);

  if (!product) return null;

  const rating = generateRating(product.id);
  const reviewCount = Math.floor(Math.random() * 500) + 50; // Random review count

  // ENHANCED: Dynamic badge styling based on section type
  const getBadgeStyle = () => {
    switch (sectionType) {
      case 'trending':
        return "bg-gradient-to-r from-orange-500 to-red-500 text-white";
      case 'latest':
        return offerDetails.discount <= 10 
          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
          : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white";
      default:
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ delay: index * 0.1 }}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 ${
        darkMode
          ? "bg-gray-800/90 border border-gray-700/50 hover:border-gray-600 hover:shadow-2xl"
          : "bg-white border border-gray-200 shadow-lg hover:border-gray-300 hover:shadow-2xl"
      }`}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image_url || `https://via.placeholder.com/300x300?text=${encodeURIComponent(product.name || 'Product')}`}
          alt={product.name || 'Product'}
          className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
          onClick={handleProductClick}
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(product.name || 'Product')}`;
          }}
        />

        {/* ENHANCED: Dynamic Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <div className={`${getBadgeStyle()} text-xs font-bold px-3 py-1.5 rounded-full shadow-lg`}>
            {offerDetails.badge}
          </div>
        </div>

        {/* ENHANCED: Additional badge for trending items */}
        {sectionType === 'trending' && offerDetails.discount >= 40 && (
          <div className="absolute top-3 left-3">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              🔥 Hot Deal
            </div>
          </div>
        )}

        {/* ENHANCED: New arrival indicator */}
        {sectionType === 'latest' && (
          <div className="absolute bottom-3 left-3">
            <div className="bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
              ✨ Just Arrived
            </div>
          </div>
        )}
      </div>

      {/* PERFECTLY ALIGNED Product Details Section */}
      <div className="p-5 space-y-4">
        {/* Product Title */}
        <div>
          <h3
            className={`text-lg font-bold leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {product.name || 'Unnamed Product'}
          </h3>
        </div>

        {/* Review Count - Perfectly Aligned */}
        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-medium ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {reviewCount} reviews
          </span>
          
          {/* Rating Stars */}
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'} fill-current`}
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
            <span className={`text-sm ml-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              ({rating})
            </span>
          </div>
        </div>

        {/* ENHANCED: Price Section with dynamic offers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ${offerDetails.currentPrice.toFixed(2)}
              </span>
              <span
                className={`text-base line-through ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                ${offerDetails.originalPrice.toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* ENHANCED: Savings display */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 font-semibold">
              Save ${offerDetails.savings.toFixed(2)}
            </span>
            <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {sectionType === 'trending' ? '🔥 Popular' : '✨ New'}
            </span>
          </div>
        </div>

        {/* Stock Status */}
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-green-600 font-semibold">
            In Stock
          </span>
        </div>

        {/* FIXED: CONSISTENT Cart Controls - Same styling for both sections */}
        <div className="pt-2">
          {cartItem ? (
            <div className="space-y-3">
              {/* Quantity Controls */}
              <div className={`flex items-center justify-between ${
                darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              } rounded-xl p-3`}>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => handleUpdateQuantity(e, -1)}
                    className={`w-8 h-8 rounded-full ${
                      darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm border'
                    } flex items-center justify-center font-bold text-lg transition-all duration-200 hover:scale-105`}
                  >
                    −
                  </button>
                  <span className={`font-bold text-lg min-w-[2rem] text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {cartItem.quantity}
                  </span>
                  <button
                    onClick={(e) => handleUpdateQuantity(e, 1)}
                    className={`w-8 h-8 rounded-full ${
                      darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm border'
                    } flex items-center justify-center font-bold text-lg transition-all duration-200 hover:scale-105`}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleRemoveFromCart}
                  className="text-red-500 hover:text-red-600 font-medium text-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            // FIXED: CONSISTENT button styling - Same blue gradient for BOTH sections
            <button
              onClick={handleAddToCart}
              className="w-full text-white py-4 px-6 rounded-xl font-bold text-base transition-all duration-300 
                shadow-lg hover:shadow-xl hover:scale-[1.02] relative overflow-hidden group flex items-center justify-center
                bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <svg
                className="w-5 h-5 mr-2"
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
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// ENHANCED: Category Card with scroll position saving
const CategoryCard = React.memo(({ category, index, onCategoryClick, darkMode, saveScrollPosition }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  // FIXED: Updated icons based on popular e-commerce categories
  const icons = useMemo(() => ({
    'clothing': "👕",
    'mens': "👔",
    'men': "👔",
    'womens': "👗", 
    'women': "👗",
    'apparel': "👕",
    'shirts': "👔",
    'jeans': "👖",
    'dresses': "👗",
    'shoes': "👟",
    'footwear': "👟",
    'accessories': "👜",
    'bags': "👜",
    'electronics': "📱",
    'beauty': "💄",
    'cosmetics': "💄",
    'books': "📚",
    'toys': "🧸",
    'sports': "⚽",
    'jewelry': "💎",
    'watches': "⌚",
    'furniture': "🛋️",
    'home': "🏠",
    'kitchen': "🍽️",
    'health': "💊",
    'automotive': "🚗",
    'garden': "🌱",
    'music': "🎵",
    'movies': "🎬",
    'games': "🎮",
    'food': "🍽️",
    'beverages': "🥤",
    'pets': "🐕",
    'travel': "✈️"
  }), []);

  // FIXED: Safe function to get icon
  const getIcon = useCallback((cat) => {
    if (!cat || typeof cat !== 'string') {
      return "🛍️";
    }
    
    try {
      const categoryKey = cat.toString().toLowerCase().trim();
      return icons[categoryKey] || "🛍️";
    } catch (error) {
      console.error("Error getting icon for category:", cat, error);
      return "🛍️";
    }
  }, [icons]);

  const cardVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }), []);

  const handleCategoryClick = useCallback(() => {
    if (saveScrollPosition) saveScrollPosition();
    onCategoryClick(category);
  }, [onCategoryClick, category, saveScrollPosition]);

  // Validate category input
  if (!category || typeof category !== 'string') {
    return null;
  }

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ delay: index * 0.1 }}
      className={`group cursor-pointer ${
        darkMode
          ? "bg-gray-800/90 border-gray-700/30"
          : "bg-white/95 border-gray-200/50 shadow-lg"
      } 
        backdrop-blur-xl border rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 relative overflow-hidden`}
      onClick={handleCategoryClick}
      whileHover={{ y: -4, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className={`absolute inset-0 ${
        darkMode 
          ? "bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" 
          : "bg-gradient-to-br from-blue-50/70 via-purple-50/70 to-pink-50/70"
      } opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />

      <div className="text-center relative z-10">
        <div
          className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-3xl 
          flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500"
        >
          <span className="text-3xl">{getIcon(category)}</span>
        </div>
        <h3
          className={`text-xl font-bold group-hover:text-blue-600 transition-colors duration-300 capitalize mb-2 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {category.toString()}
        </h3>
        <p
          className={`text-sm group-hover:text-gray-700 transition-colors duration-300 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Explore Collection
        </p>
      </div>
    </motion.div>
  );
});

// ENHANCED: All sections with consistent styling and working navigation
const CategoriesSection = React.memo(({ categories, navigate, darkMode, variants, onCategoryClick, saveScrollPosition }) => {
  // FIXED: Use popular categories based on real data if API categories are empty
  const displayCategories = useMemo(() => {
    if (categories.length > 0) {
      return categories.slice(0, 4);
    }
    // Fallback to popular e-commerce categories
    return ['Clothing', 'Shoes', 'Electronics', 'Accessories'];
  }, [categories]);

  return (
    <motion.section
      id="categories-section"
      className={`py-24 relative ${darkMode ? '' : 'bg-gradient-to-b from-gray-50 to-white'}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={variants.containerVariants}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-20" variants={variants.fadeInVariants}>
          <motion.div
            className={`inline-block mb-6 px-6 py-2 backdrop-blur-sm rounded-full border ${
              darkMode
                ? "bg-blue-500/10 border-blue-500/20"
                : "bg-blue-50 border-blue-200"
            }`}
            variants={variants.fadeInVariants}
          >
            <span
              className={`text-sm font-semibold uppercase tracking-wider ${
                darkMode ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Browse Collections
            </span>
          </motion.div>

          <motion.div
            className="flex items-center justify-center mb-6"
            variants={variants.fadeInVariants}
          >
            <span className="text-4xl mr-3" style={{ lineHeight: "1.2" }}>
              🛍️
            </span>
            <h2
              className={`text-5xl md:text-6xl font-black ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}
              style={{ lineHeight: "1.2", paddingBottom: "0.5rem" }}
            >
              Shop by Category
            </h2>
          </motion.div>

          <motion.p
            className={`text-xl max-w-3xl mx-auto leading-relaxed ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
            variants={variants.fadeInVariants}
          >
            Discover curated collections across all your favorite categories
            with our AI-powered recommendations
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          variants={variants.containerVariants}
        >
          {displayCategories.map((category, index) => (
            <CategoryCard 
              key={`${category}-${index}`} 
              category={category} 
              index={index}
              onCategoryClick={onCategoryClick}
              darkMode={darkMode}
              saveScrollPosition={saveScrollPosition}
            />
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
});

// ENHANCED: Trending Section with CONSISTENT blue "View All" button
const TrendingSection = React.memo(({ products, cart, addToCart, updateCartQuantity, removeFromCart, navigate, darkMode, variants, saveScrollPosition, calculateOffer, onViewAll }) => (
  <motion.section
    className={`py-40 relative ${darkMode ? '' : 'bg-gradient-to-b from-white to-gray-50'}`}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={variants.containerVariants}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        className="flex items-end justify-between mb-20"
        variants={variants.fadeInVariants}
      >
        <div className="flex-1">
          <motion.div
            className="flex items-center mb-8"
            variants={variants.fadeInVariants}
          >
            <span className="text-4xl mr-4" style={{ lineHeight: "1.2" }}>
              🔥
            </span>
            <h2
              className="text-5xl md:text-6xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 bg-clip-text text-transparent"
              style={{ lineHeight: "1.2", paddingBottom: "0.5rem" }}
            >
              Trending Now
            </h2>
          </motion.div>

          <motion.p
            className={`text-xl max-w-2xl leading-relaxed ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
            variants={variants.fadeInVariants}
          >
            🔥 Popular products with <strong>huge discounts up to 50%</strong>! Don't miss out
            on these hot items that everyone's talking about.
          </motion.p>
        </div>

        {/* FIXED: Consistent blue button styling */}
        <motion.button
          onClick={() => onViewAll("trending")}
          className={`hidden lg:flex items-center font-bold text-lg group transition-all duration-300 
            px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 ${
              darkMode
                ? "text-blue-400 bg-blue-900/20 hover:bg-blue-800/30 border border-blue-700/30"
                : "text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200"
            }`}
          variants={variants.fadeInVariants}
        >
          View All Trending
          <svg
            className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            ></path>
          </svg>
        </motion.button>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16"
        variants={variants.containerVariants}
      >
        {products.slice(0, 8).map((product, index) => (
          <ProductCard 
            key={`trending-${product.id || index}`} 
            product={product} 
            index={index}
            cart={cart}
            addToCart={addToCart}
            updateCartQuantity={updateCartQuantity}
            removeFromCart={removeFromCart}
            navigate={navigate}
            darkMode={darkMode}
            saveScrollPosition={saveScrollPosition}
            sectionType="trending"
            calculateOffer={calculateOffer}
          />
        ))}
      </motion.div>
    </div>
  </motion.section>
));

// ENHANCED: Latest Section with CONSISTENT blue "View All" button
const LatestSection = React.memo(({ products, cart, addToCart, updateCartQuantity, removeFromCart, navigate, darkMode, variants, saveScrollPosition, calculateOffer, onViewAll }) => (
  <motion.section
    className={`py-40 relative ${darkMode ? '' : 'bg-gradient-to-b from-gray-50 to-white'}`}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={variants.containerVariants}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        className="flex items-end justify-between mb-20"
        variants={variants.fadeInVariants}
      >
        <div className="flex-1">
          <motion.div
            className="flex items-center mb-8"
            variants={variants.fadeInVariants}
          >
            <span className="text-4xl mr-4" style={{ lineHeight: "1.2" }}>
              ✨
            </span>
            <h2
              className="text-5xl md:text-6xl font-black bg-gradient-to-r from-green-500 via-teal-500 to-blue-600 bg-clip-text text-transparent"
              style={{ lineHeight: "1.2", paddingBottom: "0.5rem" }}
            >
              Latest Arrivals
            </h2>
          </motion.div>

          <motion.p
            className={`text-xl max-w-2xl leading-relaxed ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
            variants={variants.fadeInVariants}
          >
            ✨ Fresh products just added to our collection with <strong>introductory offers</strong>! 
            Be the first to discover these amazing new items.
          </motion.p>
        </div>

        {/* FIXED: Consistent blue button styling - SAME as trending */}
        <motion.button
          onClick={() => onViewAll("latest")}
          className={`hidden lg:flex items-center font-bold text-lg group transition-all duration-300 
            px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 ${
              darkMode
                ? "text-blue-400 bg-blue-900/20 hover:bg-blue-800/30 border border-blue-700/30"
                : "text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200"
            }`}
          variants={variants.fadeInVariants}
        >
          View All Latest
          <svg
            className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            ></path>
          </svg>
        </motion.button>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16"
        variants={variants.containerVariants}
      >
        {products.slice(0, 8).map((product, index) => (
          <ProductCard 
            key={`latest-${product.id || index}`} 
            product={product} 
            index={index}
            cart={cart}
            addToCart={addToCart}
            updateCartQuantity={updateCartQuantity}
            removeFromCart={removeFromCart}
            navigate={navigate}
            darkMode={darkMode}
            saveScrollPosition={saveScrollPosition}
            sectionType="latest"
            calculateOffer={calculateOffer}
          />
        ))}
      </motion.div>
    </div>
  </motion.section>
));

const FeaturesSection = React.memo(({ darkMode, variants }) => {
  const features = useMemo(() => [
    {
      icon: "🤖",
      title: "AI-Powered Search",
      description:
        "Upload any image and find similar products instantly with our advanced computer vision technology. Our AI understands style, color, and design better than ever.",
      features: [
        "Computer Vision",
        "Style Recognition",
        "Instant Results",
      ],
    },
    {
      icon: "🎯",
      title: "Smart Recommendations",
      description:
        "Get personalized product suggestions based on your preferences, shopping history, and behavior patterns. Our AI learns what you love.",
      features: [
        "Personal AI",
        "Behavior Analysis",
        "Smart Suggestions",
      ],
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description:
        "Search through millions of products in milliseconds with our optimized algorithms and advanced caching systems. Speed that amazes.",
      features: [
        "Instant Search",
        "Real-time Results",
        "Zero Latency",
      ],
    },
  ], []);

  return (
    <motion.section
      className="py-40 relative overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={variants.containerVariants}
    >
      <div
        className={`absolute inset-0 ${
          darkMode
            ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
            : "bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50"
        }`}
      ></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-24" variants={variants.fadeInVariants}>
          <motion.div
            className={`inline-block mb-8 px-6 py-2 backdrop-blur-sm rounded-full border ${
              darkMode
                ? "bg-purple-500/10 border-purple-500/20"
                : "bg-purple-50 border-purple-200"
            }`}
            variants={variants.fadeInVariants}
          >
            <span
              className={`text-sm font-semibold uppercase tracking-wider ${
                darkMode ? "text-purple-400" : "text-purple-600"
              }`}
            >
              Why Choose Us
            </span>
          </motion.div>
          <motion.h2
            className="text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent"
            variants={variants.fadeInVariants}
            style={{ lineHeight: "1.2", paddingBottom: "0.5rem" }}
          >
            ✨ The Future of Shopping
          </motion.h2>
          <motion.p
            className={`text-xl max-w-3xl mx-auto leading-relaxed ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
            variants={variants.fadeInVariants}
          >
            Experience the next generation of e-commerce with our cutting-edge
            AI technology
          </motion.p>
        </motion.div>

        <motion.div
          className="grid lg:grid-cols-3 gap-12 mb-16"
          variants={variants.containerVariants}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              feature={feature}
              index={index}
              darkMode={darkMode}
              variants={variants}
            />
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
});

const FeatureCard = React.memo(({ feature, index, darkMode, variants }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className={`group text-center p-10 rounded-4xl backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-700 border 
        ${
          darkMode
            ? "bg-gray-800/50 border-gray-700/50"
            : "bg-white/90 border-gray-200/50"
        }`}
      variants={variants.cardVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ delay: index * 0.2 }}
      whileHover={{ y: -8, scale: 1.02 }}
    >
      <div className="text-7xl mb-8">{feature.icon}</div>
      <h3
        className={`text-3xl font-black mb-6 group-hover:text-blue-600 transition-colors duration-300 ${
          darkMode ? "text-white" : "text-gray-900"
        }`}
      >
        {feature.title}
      </h3>
      <p
        className={`text-lg leading-relaxed mb-8 ${
          darkMode ? "text-gray-300" : "text-gray-600"
        }`}
      >
        {feature.description}
      </p>
      <div className="space-y-3">
        {feature.features.map((item, i) => (
          <div key={i} className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <span
              className={`text-sm font-medium ${
                darkMode ? "text-gray-400" : "text-gray-700"
              }`}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
});

const FinalCTASection = React.memo(({ navigate, variants, saveScrollPosition }) => (
  <motion.section
    className="py-40 relative overflow-hidden"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={variants.containerVariants}
  >
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 via-purple-600/20 to-pink-600/30"></div>
    </div>

    <div className="relative max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8">
      <motion.div className="mb-12" variants={variants.fadeInVariants}>
        <motion.div
          className="inline-block mb-8 px-8 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
          variants={variants.fadeInVariants}
        >
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            🚀 Ready to Get Started?
          </span>
        </motion.div>
      </motion.div>

      <motion.h2
        className="text-5xl md:text-7xl font-black text-white mb-12 leading-tight"
        variants={variants.fadeInVariants}
      >
        Start Your
        <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
          AI Shopping
        </span>
        Journey Today!
      </motion.h2>

      <motion.p
        className="text-xl md:text-2xl text-gray-100 mb-16 leading-relaxed max-w-4xl mx-auto"
        variants={variants.fadeInVariants}
      >
        Experience the future of online shopping with our revolutionary AI
        technology. Find exactly what you're looking for with just a single
        image or smart search.
      </motion.p>

      <motion.div
        className="flex flex-col sm:flex-row gap-6 justify-center"
        variants={variants.fadeInVariants}
      >
        <button
          onClick={() => {
            if (saveScrollPosition) saveScrollPosition();
            navigate("/search");
          }}
          className="group relative inline-flex items-center px-12 py-6 text-xl font-black rounded-2xl text-indigo-600 
            bg-white hover:bg-gray-100 shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all duration-500 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <span className="relative z-10 flex items-center">
            🚀 Start Shopping Now
            <svg
              className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              ></path>
            </svg>
          </span>
        </button>
      </motion.div>
    </div>
  </motion.section>
));

export default LandingPage;
