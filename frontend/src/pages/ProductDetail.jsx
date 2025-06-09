import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ThemeContext from '../context/ThemeContext';

const ProductDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const [cart, setCart] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [complementaryProducts, setComplementaryProducts] = useState([]); // NEW
  const [loading, setLoading] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [complementaryLoading, setComplementaryLoading] = useState(true); // NEW
  const [quantity, setQuantity] = useState(1);

  const { product, features, fromSearch } = location.state || {};

  useEffect(() => {
    if (!product) {
      navigate('/', { replace: true });
      return;
    }
    
    console.log('🔍 Product Detail mounted for:', product.name);
    loadCart();
    fetchRelatedProducts();
    fetchComplementaryProducts(); // NEW
  }, [product, navigate]);

  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem('shopsmarter_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(Array.isArray(parsedCart) ? parsedCart : []);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCart([]);
    }
  };

  const fetchRelatedProducts = async () => {
    if (!product || !product.id) {
      console.log('❌ No product ID available for related products fetch');
      setRelatedProducts(createFallbackProducts());
      setRelatedLoading(false);
      return;
    }
    
    console.log('🛍️ Fetching related products for:', product.name, 'ID:', product.id);
    setRelatedLoading(true);
    
    try {
      let response = await fetch(`/api/products/related/${product.id}?limit=8`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Related products API response:', data);
        
        if (data.products && data.products.length > 0) {
          setRelatedProducts(data.products);
          console.log(`✅ Set ${data.products.length} related products from dedicated endpoint`);
          setRelatedLoading(false);
          return;
        }
      }
      
      console.log('⚠️ API strategies failed, creating fallback products');
      const fallbackProducts = createFallbackProducts();
      setRelatedProducts(fallbackProducts);
      
    } catch (error) {
      console.error('❌ Error fetching related products:', error);
      const fallbackProducts = createFallbackProducts();
      setRelatedProducts(fallbackProducts);
    } finally {
      setRelatedLoading(false);
    }
  };

  // NEW: Fetch complementary products
  const fetchComplementaryProducts = async () => {
    if (!product || !product.id) {
      console.log('❌ No product ID available for complementary products fetch');
      setComplementaryProducts([]);
      setComplementaryLoading(false);
      return;
    }
    
    console.log('🛍️ Fetching complementary products for:', product.name, 'ID:', product.id);
    setComplementaryLoading(true);
    
    try {
      const response = await fetch('/api/recommendations/complementary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          product_id: product.id,
          limit: 8
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Complementary products API response:', data);
        
        if (data.complementary_products && data.complementary_products.length > 0) {
          setComplementaryProducts(data.complementary_products);
          console.log(`✅ Set ${data.complementary_products.length} complementary products`);
        } else {
          console.log('⚠️ No complementary products returned from API');
          setComplementaryProducts([]);
        }
      } else {
        console.log('⚠️ Complementary products API failed:', response.status);
        setComplementaryProducts([]);
      }
      
    } catch (error) {
      console.error('❌ Error fetching complementary products:', error);
      setComplementaryProducts([]);
    } finally {
      setComplementaryLoading(false);
    }
  };

  const createFallbackProducts = () => {
    if (!product) return [];
    
    const baseCategory = extractCategoryForSearch(product);
    
    const fallbackData = [
      { category: 'jeans', items: ['Classic Blue Jeans', 'Black Skinny Jeans', 'Ripped Denim Jeans', 'High Waist Jeans'] },
      { category: 'shirts', items: ['Cotton White Shirt', 'Casual Blue Shirt', 'Formal Black Shirt', 'Striped Polo Shirt'] },
      { category: 'dresses', items: ['Summer Floral Dress', 'Little Black Dress', 'Maxi Dress', 'Cocktail Dress'] },
      { category: 'jackets', items: ['Leather Jacket', 'Denim Jacket', 'Bomber Jacket', 'Blazer Jacket'] }
    ];
    
    const matchingCategory = fallbackData.find(cat => cat.category === baseCategory) || fallbackData[1];
    
    return matchingCategory.items.map((name, index) => ({
      id: `fallback-${baseCategory}-${index + 1}`,
      name: name,
      category: matchingCategory.category,
      price: Math.floor(Math.random() * 80) + 20,
      image_url: `https://via.placeholder.com/300x300?text=${encodeURIComponent(name)}`
    }));
  };

  const extractCategoryForSearch = (product) => {
    if (!product) return 'shirts';
    
    const name = (product.name || '').toLowerCase();
    
    if (name.includes('jeans') || name.includes('jean')) return 'jeans';
    if (name.includes('shirt') || name.includes('t-shirt') || name.includes('tshirt')) return 'shirts';
    if (name.includes('dress')) return 'dresses';
    if (name.includes('jacket') || name.includes('coat')) return 'jackets';
    
    return 'shirts';
  };

  const generateDynamicRating = (productId) => {
    if (!productId) return 4.5;
    const seed = productId.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const ratings = [4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9];
    return ratings[seed % ratings.length];
  };

  const isInCart = (productId) => {
    return cart.find(item => item.id === productId);
  };

  const addToCart = (productToAdd, selectedQuantity = quantity) => {
    try {
      const existingItem = cart.find(item => item.id === productToAdd.id);
      let updatedCart;
      
      if (existingItem) {
        updatedCart = cart.map(item =>
          item.id === productToAdd.id
            ? { ...item, quantity: (item.quantity || 1) + selectedQuantity }
            : item
        );
      } else {
        updatedCart = [...cart, { 
          ...productToAdd, 
          quantity: selectedQuantity
        }];
      }
      
      setCart(updatedCart);
      localStorage.setItem('shopsmarter_cart', JSON.stringify(updatedCart));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const updateCartQuantity = (productId, change) => {
    try {
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
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const removeFromCart = (productId) => {
    try {
      const updatedCart = cart.filter(item => item.id !== productId);
      setCart(updatedCart);
      localStorage.setItem('shopsmarter_cart', JSON.stringify(updatedCart));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const handleRelatedProductClick = (relatedProduct) => {
    console.log('🔗 Navigating to related product:', relatedProduct.name);
    navigate('/product-detail', {
      state: {
        product: {
          ...relatedProduct,
          dynamicRating: generateDynamicRating(relatedProduct.id)
        },
        features,
        fromSearch: true
      },
      replace: true
    });
  };

  // NEW: Handle complementary product clicks
  const handleComplementaryProductClick = (complementaryProduct) => {
    console.log('🔗 Navigating to complementary product:', complementaryProduct.name);
    navigate('/product-detail', {
      state: {
        product: {
          ...complementaryProduct,
          dynamicRating: generateDynamicRating(complementaryProduct.id)
        },
        features,
        fromSearch: true
      },
      replace: true
    });
  };

  // FIXED: Proper navigation back to results page
  const handleBackClick = () => {
    console.log('🔙 Back button clicked - fromSearch:', fromSearch, 'features:', features);
    if (fromSearch && features) {
      // Navigate back to results page with the original features
      navigate('/results', {
        state: { features },
        replace: false
      });
    } else {
      navigate('/', { replace: false });
    }
  };

  if (!product) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'
      }`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>Product not found</h2>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const cartItem = isInCart(product.id);
  const dynamicRating = product.dynamicRating || generateDynamicRating(product.id);
  const reviewCount = Math.floor(Math.random() * 200) + 50;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900'
    }`}>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className={`text-sm flex items-center space-x-2 ${
            darkMode ? 'text-gray-400' : 'text-slate-600'
          }`}>
            <span>Fashion</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <span>{product.category || 'Clothing'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <span className={`font-medium ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>{product.name}</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Single Product Image */}
          <div className={`aspect-square rounded-2xl overflow-hidden shadow-2xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <img
              src={product.image_url || `https://via.placeholder.com/600x600?text=${encodeURIComponent(product.name)}`}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                e.target.src = `https://via.placeholder.com/600x600?text=${encodeURIComponent(product.name)}`;
              }}
            />
          </div>

          {/* Product Details */}
          <div className="space-y-8">
            {/* Title and Category */}
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  darkMode 
                    ? 'bg-indigo-900/50 text-indigo-300' 
                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}>
                  {product.category || 'Fashion Item'}
                </span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 text-sm font-medium">In Stock</span>
                </div>
              </div>
              
              <h1 className={`text-4xl font-bold mb-3 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {product.name}
              </h1>
              
              <p className={`text-lg ${
                darkMode ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Premium quality fashion item crafted with attention to detail
              </p>
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg 
                      key={i} 
                      className={`w-5 h-5 ${i < Math.floor(dynamicRating) ? 'text-yellow-400' : darkMode ? 'text-gray-600' : 'text-gray-300'} fill-current`} 
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <span className={`font-medium ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {dynamicRating}
                </span>
              </div>
              <span className={`${
                darkMode ? 'text-gray-400' : 'text-slate-600'
              }`}>
                ({reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline space-x-4">
              <span className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
              </span>
              {product.originalPrice && (
                <span className={`text-xl line-through ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Quantity Selection */}
            <div className="space-y-3">
              <h3 className={`font-semibold text-lg ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>Quantity</h3>
              <div className="flex items-center space-x-4">
                <div className={`flex items-center border-2 rounded-lg ${
                  darkMode ? 'border-gray-600' : 'border-gray-300'
                }`}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                    </svg>
                  </button>
                  <span className={`px-6 py-3 font-semibold text-lg ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {cartItem ? (
                <div className="flex flex-col space-y-3">
                  <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                    darkMode 
                      ? 'border-indigo-600 bg-indigo-900/20' 
                      : 'border-indigo-300 bg-indigo-50'
                  }`}>
                    <span className={`font-medium ${
                      darkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {cartItem.quantity} in cart
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCartQuantity(product.id, -1)}
                        className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => updateCartQuantity(product.id, 1)}
                        className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="w-full py-4 px-8 rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200 font-semibold"
                  >
                    Remove from Cart
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => addToCart(product, quantity)}
                    className="w-full py-4 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Add to Cart - ${(product.price * quantity).toFixed(2)}
                  </button>
                  
                  <button className="w-full py-4 px-8 border-2 border-indigo-300 text-indigo-600 rounded-xl text-lg font-semibold hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-400 dark:hover:bg-indigo-900/20 transition-all duration-200">
                    Buy Now
                  </button>
                </div>
              )}
            </div>

            {/* Features */}
            {product.relevance_info && (
              <div className="space-y-4">
                <h3 className={`font-semibold text-lg ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>Product Features</h3>
                <div className="flex flex-wrap gap-2">
                  {product.relevance_info.color_matches?.map((color, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-sm font-medium"
                    >
                      {color}
                    </span>
                  ))}
                  {product.relevance_info.clothing_matches?.map((match, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 rounded-full text-sm font-medium"
                    >
                      {match}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Product Description */}
            <div className="space-y-4">
              <h3 className={`font-semibold text-lg ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>Product Details</h3>
              <div className={`p-6 rounded-xl ${
                darkMode ? 'bg-gray-800/50' : 'bg-white/80 backdrop-blur-sm'
              } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`leading-relaxed ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  This premium {product.name} combines style and comfort, crafted from high-quality materials. 
                  Perfect for both casual and formal occasions, featuring modern design elements that make it a 
                  versatile addition to your wardrobe. Made with sustainable practices and designed to last.
                </p>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className={`font-medium mb-2 ${
                      darkMode ? 'text-white' : 'text-gray-800'
                    }`}>Material</h4>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Premium Cotton Blend</p>
                  </div>
                  <div>
                    <h4 className={`font-medium mb-2 ${
                      darkMode ? 'text-white' : 'text-gray-800'
                    }`}>Care Instructions</h4>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Machine wash cold</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* NEW: Complementary Products Section */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className={`text-3xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>Complete the Look</h2>
              <p className={`text-sm mt-2 ${
                darkMode ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Items that go perfectly with this product
              </p>
            </div>
            {!complementaryLoading && complementaryProducts.length > 0 && (
              <span className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-slate-600'
              }`}>
                {complementaryProducts.length} complementary items
              </span>
            )}
          </div>
          
          {complementaryLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className={`text-lg ${
                  darkMode ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  Finding complementary items...
                </p>
              </div>
            </div>
          ) : complementaryProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {complementaryProducts.map((complementaryProduct, index) => {
                const complementaryRating = generateDynamicRating(complementaryProduct.id);
                const complementaryReviews = Math.floor(Math.random() * 200) + 50;
                
                return (
                  <div
                    key={complementaryProduct.id || `complementary-${index}`}
                    className={`group cursor-pointer rounded-2xl shadow-lg border overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 hover:border-purple-600' 
                        : 'bg-white border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => handleComplementaryProductClick(complementaryProduct)}
                  >
                    <div className="aspect-square overflow-hidden relative">
                      <img
                        src={complementaryProduct.image_url || `https://via.placeholder.com/300x300?text=${encodeURIComponent(complementaryProduct.name)}`}
                        alt={complementaryProduct.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(complementaryProduct.name)}`;
                        }}
                      />
                      
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <button className="bg-white text-gray-900 px-6 py-3 rounded-xl opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 font-semibold shadow-lg">
                          Add to Look
                        </button>
                      </div>
                      
                      <div className="absolute top-3 left-3">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                          🎯 Goes With
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className={`font-bold text-lg mb-2 line-clamp-2 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {complementaryProduct.name}
                      </h3>
                      <p className={`text-sm mb-3 ${
                        darkMode ? 'text-gray-400' : 'text-slate-600'
                      }`}>
                        {complementaryProduct.category}
                      </p>
                      
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i} 
                              className={`w-4 h-4 ${i < Math.floor(complementaryRating) ? 'text-yellow-400' : darkMode ? 'text-gray-600' : 'text-gray-300'} fill-current`} 
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                        </div>
                        <span className={`text-sm ml-2 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>
                          {complementaryRating} ({complementaryReviews})
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          ${typeof complementaryProduct.price === 'number' ? complementaryProduct.price.toFixed(2) : '0.00'}
                        </p>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(complementaryProduct, 1);
                          }}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🛍️</div>
              <p className={`text-lg ${
                darkMode ? 'text-gray-400' : 'text-slate-600'
              }`}>
                No complementary items found for this product
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
