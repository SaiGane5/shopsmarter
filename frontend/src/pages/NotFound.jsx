import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeContext from '../context/ThemeContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="max-w-2xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-indigo-600">404</h1>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Page Not Found</h2>
          <p className="mt-4 text-lg">Sorry, we couldn't find the page you're looking for.</p>
          <div className="mt-8">
            <button
              onClick={handleGoHome}
              className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
