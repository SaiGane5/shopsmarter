import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ImageUpload from "./pages/ImageUpload";
import Results from "./pages/Results";
import Checkout from "./pages/Checkout";
import LandingPage from "./pages/LandingPage";
import SearchResultsBar from "./pages/SearchResults"; 
import TrendingViewAll from "./pages/TrendingViewAll"; 
import LatestViewAll from "./pages/LatestViewAll"; 
import About from "./pages/About";
import Contact from "./pages/Contact";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./context/ThemeContext";
import ProductDetail from './pages/ProductDetail';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <div className="pt-16">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/search" element={<ImageUpload />} />
              <Route path="/search-results" element={<SearchResultsBar />} />
              <Route path="/trending-products" element={<TrendingViewAll />} />
              <Route path="/latest-arrivals" element={<LatestViewAll />} />
              
              <Route path="/product-detail" element={<ProductDetail />} />
              <Route path="/results" element={<Results />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/success" element={<CheckoutSuccess />} />
              <Route path="/cancel" element={<CheckoutCancel />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
