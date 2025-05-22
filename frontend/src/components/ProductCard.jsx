import React, { useState, useEffect, useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

const ProductCard = ({ product, onAddToCart, inCart }) => {
  const { darkMode } = useContext(ThemeContext);
  const [imageState, setImageState] = useState('loading');
  const [imageSrc, setImageSrc] = useState('');
  
  useEffect(() => {
    // Handle different URL formats and prepare the image source
    const prepareImageSrc = () => {
      if (!product.image_url) {
        return `https://via.placeholder.com/400x400?text=${encodeURIComponent(product.name)}`;
      }
      
      // If it's already a full URL, use it directly
      if (product.image_url.startsWith('http')) {
        return product.image_url;
      }
      
      // If it's a relative path, ensure proper formatting
      const baseUrl = window.location.origin;
      const path = product.image_url.startsWith('/') 
        ? product.image_url 
        : `/${product.image_url}`;
      
      return `${baseUrl}${path}`;
    };
    
    // Set initial image source
    const src = prepareImageSrc();
    setImageSrc(src);
    
    // Preload the image to check if it loads correctly
    const img = new Image();
    img.onload = () => setImageState('loaded');
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      setImageState('error');
    };
    img.src = src;
    
    // Clean up function
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [product.image_url, product.name]);
  
  // Get fallback or placeholder image
  const getFallbackImage = () => {
    return `https://via.placeholder.com/400x400?text=${encodeURIComponent(product.name)}`;
  };
  
  return (
    <div className={`rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 ${
      darkMode ? 'bg-gray-700' : 'bg-white'
    }`}>
      <div className="relative pb-[100%]">
        {/* Image container with proper state handling */}
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          {imageState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {imageState === 'loaded' && (
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
          
          {imageState === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <img 
                src={getFallbackImage()} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
        <p className={`text-sm mb-2 line-clamp-2 h-10 overflow-hidden ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {product.description}
        </p>
        
        <div className="flex justify-between items-center mt-4">
          <span className="font-bold">${product.price.toFixed(2)}</span>
          
          <button
            onClick={() => onAddToCart(product)}
            disabled={inCart}
            className={`px-3 py-1 rounded text-sm ${
              inCart
                ? darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition`}
          >
            {inCart ? 'Added' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
