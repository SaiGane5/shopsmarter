import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeContext from '../context/ThemeContext';

const ProductCard = ({ product, onAddToCart, onUpdateQuantity, quantity = 0 }) => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [imageState, setImageState] = useState('loading');
  const [imageSrc, setImageSrc] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    const prepareImageSrc = () => {
      if (!product.image_url) {
        return `https://via.placeholder.com/400x400?text=${encodeURIComponent(product.name)}`;
      }
      
      if (product.image_url.startsWith('http')) {
        return product.image_url;
      }
      
      const baseUrl = window.location.origin;
      const path = product.image_url.startsWith('/') 
        ? product.image_url 
        : `/${product.image_url}`;
      
      return `${baseUrl}${path}`;
    };
    
    const src = prepareImageSrc();
    setImageSrc(src);
    
    const img = new Image();
    img.onload = () => setImageState('loaded');
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      setImageState('error');
    };
    img.src = src;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [product.image_url, product.name]);
  
  const getFallbackImage = () => {
    return `https://via.placeholder.com/400x400?text=${encodeURIComponent(product.name)}`;
  };

  const handleAddToCart = () => {
    onAddToCart(product);
  };

  const handleQuantityChange = (newQuantity) => {
    onUpdateQuantity(product.id, Math.max(0, newQuantity));
  };

  const handleQuickView = (e) => {
    e.stopPropagation();
    navigate('/product-detail', {
      state: {
        product: product,
        fromSearch: true
      }
    });
  };

  const isInCart = quantity > 0;
  
  return (
    <div 
      className={`group relative rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 border ${
        darkMode 
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-indigo-100'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <div className={`absolute inset-0 transition-colors duration-300 ${
          darkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          {imageState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}
          
          {imageState === 'loaded' && (
            <img
              src={imageSrc}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                isHovered ? 'scale-110' : 'scale-100'
              }`}
              loading="lazy"
            />
          )}
          
          {imageState === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={getFallbackImage()} 
                alt={product.name} 
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  isHovered ? 'scale-110' : 'scale-100'
                }`}
              />
            </div>
          )}
        </div>

        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />

        {/* Discount Badge */}
        {product.original_price && product.original_price > product.price && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full shadow-lg">
              -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
            </span>
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-6">
        {/* Product Category */}
        {product.category && (
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-3 ${
            darkMode 
              ? 'bg-indigo-900/50 text-indigo-300' 
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          }`}>
            {product.category}
          </span>
        )}

        {/* Product Title */}
        <h3 className={`font-bold text-lg mb-2 line-clamp-2 transition-colors ${
          darkMode 
            ? 'text-white group-hover:text-indigo-400' 
            : 'text-gray-900 group-hover:text-indigo-600'
        }`}>
          {product.name}
        </h3>
        
        {/* Product Description */}
        <p className={`text-sm mb-4 line-clamp-2 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {product.description}
        </p>
        
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating) 
                      ? 'text-yellow-400' 
                      : darkMode ? 'text-gray-600' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className={`ml-2 text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              ({product.rating}) • {product.reviews || 0} reviews
            </span>
          </div>
        )}
        
        {/* Price Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-indigo-600">
              ${product.price.toFixed(2)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className={`text-lg line-through ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                ${product.original_price.toFixed(2)}
              </span>
            )}
          </div>
          
          {/* Stock Status */}
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              product.in_stock !== false ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className={`text-xs font-medium ${
              product.in_stock !== false 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {product.in_stock !== false ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
        
        {/* Add to Cart / Quantity Controls */}
        <div className="space-y-3">
          {!isInCart ? (
            <button
              onClick={handleAddToCart}
              disabled={product.in_stock === false}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform ${
                product.in_stock === false
                  ? darkMode 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-95'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l1.5-6M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                <span>{product.in_stock === false ? 'Out of Stock' : 'Add to Cart'}</span>
              </div>
            </button>
          ) : (
            <div className={`flex items-center justify-between p-2 rounded-xl border-2 ${
              darkMode 
                ? 'border-indigo-600 bg-indigo-900/20' 
                : 'border-indigo-300 bg-indigo-50'
            }`}>
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                className={`p-2 rounded-lg transition-colors shadow-sm ${
                  darkMode 
                    ? 'bg-gray-700 text-indigo-400 hover:bg-gray-600' 
                    : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-2">
                <span className={`font-semibold text-indigo-600 ${
                  darkMode ? 'text-indigo-400' : 'text-indigo-700'
                }`}>
                  {quantity}
                </span>
                <span className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  in cart
                </span>
              </div>
              
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Quick View Button */}
          <button 
            onClick={handleQuickView}
            className={`w-full py-2 px-4 rounded-lg border transition-all duration-200 font-medium ${
              darkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500' 
                : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400'
            }`}
          >
            Quick View
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {imageState === 'loading' && (
        <div className={`absolute inset-0 flex items-center justify-center ${
          darkMode ? 'bg-gray-800/80' : 'bg-white/80'
        }`}>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
