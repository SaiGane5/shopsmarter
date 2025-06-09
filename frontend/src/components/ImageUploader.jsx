import React, { useState, useRef, useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

const ImageUploader = ({ onImageUpload }) => {
  const [dragging, setDragging] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
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
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, or WebP)');
      return;
    }

    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    
    const objectUrl = URL.createObjectURL(file);
    setImage(objectUrl);
    
    uploadImage(file, objectUrl);
  };

  const uploadImage = async (file, previewUrl) => {
    setLoading(true);
    setUploadProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/image/upload', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.status}`);
      }
      
      const data = await response.json();
      
      setTimeout(() => {
        onImageUpload({
          image: previewUrl,
          features: data.features
        });
        setLoading(false);
      }, 500);
      
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // FIXED: Separate function to handle browse clicks with proper event handling
  const handleBrowseClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    fileInputRef.current?.click();
  };

  const resetUploader = () => {
    if (image) {
      URL.revokeObjectURL(image);
    }
    setImage(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // FIXED: Handle container click separately to avoid conflicts
  const handleContainerClick = (e) => {
    // Only trigger if clicking directly on the container, not on child elements
    if (e.target === e.currentTarget && !loading && !image) {
      handleBrowseClick(e);
    }
  };

  return (
    <div className="w-full">
      {/* Error Message */}
      {error && (
        <div className="mb-8 p-6 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 text-red-600 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* FIXED: Main Upload Area with proper event handling */}
      <div
        className={`
          relative border-2 border-dashed rounded-3xl shadow-2xl
          p-12 md:p-16 text-center transition-all duration-300
          ${dragging
            ? "border-indigo-500 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 scale-[1.02] shadow-indigo-500/20"
            : darkMode
            ? "border-slate-600 bg-gradient-to-br from-slate-800/60 to-slate-700/60 hover:border-slate-500"
            : "border-gray-300 bg-gradient-to-br from-gray-50/80 to-white/80 hover:border-gray-400"
          }
          ${!loading && !image ? "hover:scale-[1.01] cursor-pointer" : ""}
          backdrop-blur-xl
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleContainerClick}
      >
        {/* Subtle animated background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient-flow"></div>
        </div>

        {loading ? (
          <div className="relative z-10 flex flex-col items-center justify-center py-12">
            {/* Professional loading animation */}
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-gray-200">
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-600 animate-spin animate-reverse"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Enhanced progress display */}
            <div className="w-full max-w-md mb-6">
              <div className={`h-3 rounded-full overflow-hidden ${darkMode ? "bg-slate-700" : "bg-gray-200"} shadow-inner`}>
                <div 
                  className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-300 ease-out rounded-full relative overflow-hidden"
                  style={{ width: `${uploadProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                </div>
              </div>
              <div className="flex justify-between mt-3">
                <p className="text-sm font-medium">Processing...</p>
                <p className="text-sm font-bold text-indigo-600">{Math.round(uploadProgress)}%</p>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-2">🔬 Analyzing Your Image</h3>
            <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Our AI is extracting visual features and patterns
            </p>
          </div>
        ) : image ? (
          <div className="relative z-10 flex flex-col items-center animate-fade-in">
            {/* Enhanced image preview */}
            <div className="relative mb-8 group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
              <div className="relative max-h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 backdrop-blur-sm">
                <img
                  src={image}
                  alt="Preview"
                  className="max-h-96 object-contain w-full transform group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x300?text=Image+Preview";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3">
                    <p className="text-sm font-semibold text-gray-800">✨ Image ready for AI analysis</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* FIXED: Static action buttons with proper event handling */}
            <div className="flex space-x-6">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  resetUploader();
                }}
                className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  darkMode
                    ? "bg-slate-700 text-white hover:bg-slate-600 shadow-xl border border-slate-600"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 shadow-xl border border-gray-200"
                } backdrop-blur-sm`}
              >
                🔄 Upload Different Image
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBrowseClick(e);
                }}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                📁 Browse More Files
              </button>
            </div>
          </div>
        ) : (
          <div className="relative z-10 py-16">
            {/* Static upload icon */}
            <div className="mb-8 relative pointer-events-none">
              <div className="mx-auto w-28 h-28 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center transform hover:scale-110 transition-transform duration-300 shadow-2xl">
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              {/* Subtle indicator dots */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-pink-400 rounded-full animate-pulse delay-500 shadow-lg"></div>
            </div>
            
            <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent pointer-events-none">
              Upload Product Image
            </h3>
            
            <p className={`text-xl mb-10 max-w-lg mx-auto leading-relaxed pointer-events-none ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Drag and drop your product image here, or click to browse files
            </p>
            
            {/* FIXED: Upload button with proper event handling */}
            <button
              onClick={handleBrowseClick}
              className="inline-flex items-center space-x-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl text-lg z-20 relative"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Choose Image File</span>
            </button>
            
            <p className={`mt-6 text-sm pointer-events-none ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              📄 Supports: PNG, JPG, JPEG, WebP • 📏 Maximum size: 10MB
            </p>

            {/* Enhanced format indicators */}
            <div className="mt-10 flex justify-center space-x-4 pointer-events-none">
              {[
                { name: "JPG", color: "from-orange-500 to-red-500", icon: "🖼️" },
                { name: "PNG", color: "from-blue-500 to-indigo-500", icon: "🎨" },
                { name: "WebP", color: "from-green-500 to-emerald-500", icon: "⚡" }
              ].map((format, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${format.color} shadow-lg transform hover:scale-105 transition-transform backdrop-blur-sm`}
                >
                  <span>{format.icon}</span>
                  <span>{format.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FIXED: Hidden file input with proper handling */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
      />

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes gradient-flow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-gradient-flow {
          background-size: 200% 200%;
          animation: gradient-flow 6s ease infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-reverse {
          animation: reverse 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ImageUploader;
