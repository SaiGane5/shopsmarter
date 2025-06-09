import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeContext from '../context/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem('shopsmarter_cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        setCartItemCount(totalItems);
      } else {
        setCartItemCount(0);
      }
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCartClick = () => {
    const savedCart = localStorage.getItem('shopsmarter_cart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      navigate('/checkout', { state: { cart } });
    } else {
      navigate('/checkout');
    }
  };

  const navItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Search', path: '/search', icon: '🔍' },
    { name: 'About', path: '/about', icon: '📋' },
    { name: 'Contact', path: '/contact', icon: '📞' },
  ];

  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const mobileItemVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0 }
  };

  return (
    <motion.nav 
      initial="hidden"
      animate="visible"
      variants={navVariants}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500  ${
        isScrolled 
          ? darkMode 
            ? 'bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl' 
            : 'bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-2xl'
          : darkMode 
            ? 'bg-black backdrop-blur-lg' 
            : 'bg-white/80 backdrop-blur-lg'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <motion.div 
            className="flex items-center cursor-pointer group"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`w-10 h-10 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                  <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>S</span>
                </div>
              </div>
              <div>
                <span className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  ShopSmarter
                </span>
                <div className="text-xs text-gray-500 font-medium">AI-Powered Shopping</div>
              </div>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-1">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`relative px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 group ${
                    location.pathname === item.path
                      ? darkMode 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-gray-200 text-gray-900'
                      : darkMode 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800/80' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/80'
                  }`}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.name}</span>
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Cart Icon */}
            <motion.button
              onClick={handleCartClick}
              className={`relative p-2.5 rounded-xl transition-all duration-300 group ${
                darkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800/80' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/80'
              } hover:shadow-lg`}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Shopping Cart"
            >
              <svg 
                className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 9a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" 
                />
              </svg>
              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg"
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-300 shadow-lg ${
                darkMode 
                  ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' 
                  : 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
              }`}
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                {darkMode ? (
                  <motion.svg 
                    key="sun"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    className="w-4 h-4" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </motion.svg>
                ) : (
                  <motion.svg 
                    key="moon"
                    initial={{ rotate: 180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -180, opacity: 0 }}
                    className="w-4 h-4" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile menu button */}
            <motion.button
              onClick={toggleMenu}
              className={`md:hidden p-2.5 rounded-xl transition-all duration-300 ${
                darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800/80' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/80'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.svg 
                    key="close"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    className="h-5 w-5" 
                    stroke="currentColor" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </motion.svg>
                ) : (
                  <motion.svg 
                    key="menu"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    className="h-5 w-5" 
                    stroke="currentColor" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
            className={`md:hidden absolute top-full left-0 right-0 rounded-b-2xl ${
              darkMode ? 'bg-gray-900/95' : 'bg-white/95'
            } backdrop-blur-xl border-b ${
              darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
            } shadow-2xl`}
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setIsMenuOpen(false);
                  }}
                  variants={mobileItemVariants}
                  className={`flex items-center space-x-4 w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    location.pathname === item.path
                      ? darkMode 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-gray-200 text-gray-900'
                      : darkMode 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800/80' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/80'
                  }`}
                  whileHover={{ x: 8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                  {location.pathname === item.path && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </motion.button>
              ))}
              
              {/* Mobile Cart Link */}
              <motion.button
                onClick={() => {
                  handleCartClick();
                  setIsMenuOpen(false);
                }}
                variants={mobileItemVariants}
                className={`flex items-center justify-between w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  darkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800/80' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/80'
                }`}
                whileHover={{ x: 8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-lg">🛍️</span>
                  <span>Cart</span>
                </div>
                {cartItemCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
