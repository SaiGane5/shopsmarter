import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeContext from '../context/ThemeContext';

const CheckoutCancel = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const handleReturnToCart = () => {
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="max-w-2xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Payment Cancelled</h1>
          <p className="mt-4 text-lg">Your payment was cancelled. Your cart items are still saved.</p>
          <div className="mt-8 space-x-4">
            <button
              onClick={handleReturnToCart}
              className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Return to Cart
            </button>
            <button
              onClick={handleContinueShopping}
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-400 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancel;
