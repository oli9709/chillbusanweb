import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import GallerySection from './components/GallerySection';
import ToursSection from './components/ToursSection';
import CustomTourBuilder from './components/CustomTourBuilder';
import SpecialEventsSection from './components/SpecialEventsSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import Login from './components/Login';
import SignUp from './components/SignUp';
import './App.css';

function App() {
  return (
    <Router basename="/">
      <AuthProvider>
        <div className="App">
          <Navigation />
          
          {/* Main Home Page */}
          <Routes>
            <Route path="/" element={
              <>
                <HeroSection />
                <GallerySection />
                <ToursSection />
                <SpecialEventsSection />
                <ContactSection />
                <Footer />
              </>
            } />
            
            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* Custom Tour Route - No authentication required */}
            <Route 
              path="/custom-tour" 
              element={<CustomTourBuilder />} 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App; 