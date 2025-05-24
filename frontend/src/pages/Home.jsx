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
