import React, { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ThemeContext from '../context/ThemeContext';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Clear cart on successful checkout
    localStorage.removeItem('shopsmarter_cart');
  }, []);

  const handleContinueShopping = () => {
    navigate('/');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="max-w-2xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Payment Successful!</h1>
          <p className="mt-4 text-lg">Thank you for your purchase. Your order has been processed successfully.</p>
          {sessionId && (
            <p className="mt-2 text-sm text-gray-500">Session ID: {sessionId}</p>
          )}
          <div className="mt-8">
            <button
              onClick={handleContinueShopping}
              className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
