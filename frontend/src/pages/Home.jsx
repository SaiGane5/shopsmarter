import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageUploader from '../components/ImageUploader';
import ThemeContext from '../context/ThemeContext';

const Home = () => {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  const handleImageUpload = (imageData) => {
  navigate('/results', { 
    state: { 
      features: imageData.features 
    } 
  });
};

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">ShopSmarter</h1>
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className={`p-8 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Find products with just an image
            </h2>
            <p className="text-center mb-8">
              Upload a photo of something you like, and we'll find similar products for you.
            </p>
            
            <ImageUploader onImageUpload={handleImageUpload} />
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">How it works</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Upload an image of a product you like</li>
                <li>Our AI analyzes the image to identify key features</li>
                <li>Browse similar products and refine results with text prompts</li>
                <li>Add items to cart and checkout seamlessly</li>
              </ol>
            </div>
          </div>
        </div>
      </main>

      <footer className={`py-6 mt-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 ShopSmarter AI Assistant</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
