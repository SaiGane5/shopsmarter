import React, { useState, useRef, useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

const ImageUploader = ({ onImageUpload }) => {
  const [dragging, setDragging] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      setError('Please upload an image file (jpg, png, etc.)');
      return;
    }

    // Reset error
    setError(null);
    
    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setImage(objectUrl);
    
    // Upload to server
    uploadImage(file, objectUrl);
  };

  const uploadImage = async (file, previewUrl) => {
    setLoading(true);
    
    try {
      // Create FormData object for file upload
      const formData = new FormData();
      formData.append('image', file);
      
      // Send to API using the correct endpoint from backend
      const response = await fetch('/api/image/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Pass features to parent component
      onImageUpload({
        image: previewUrl,
        features: data.features
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
      setLoading(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragging ? 'border-blue-500 bg-blue-50' : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
        } transition-colors duration-200`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Analyzing image...</p>
          </div>
        ) : image ? (
          <div className="flex flex-col items-center">
            <div className="relative max-h-64 mb-4 rounded overflow-hidden">
              <img 
                src={image} 
                alt="Preview" 
                className="max-h-64 object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/400x300?text=Image+Preview';
                }}
              />
            </div>
            <button
              onClick={() => {
                URL.revokeObjectURL(image); // Clean up object URL
                setImage(null);
                fileInputRef.current.value = '';
              }}
              className={`px-4 py-2 rounded ${
                darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
              } transition`}
            >
              Upload a different image
            </button>
          </div>
        ) : (
          <div className="py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2">Drag and drop an image here, or</p>
            <button
              onClick={handleBrowseClick}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Browse files
            </button>
            <p className="mt-2 text-sm text-gray-500">
              PNG, JPG, JPEG up to 10MB
            </p>
          </div>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default ImageUploader;
