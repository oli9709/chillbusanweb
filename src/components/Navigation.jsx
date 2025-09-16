import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="main-nav">
      <div className="nav-brand">
        <Link to="/" className="nav-logo">Chill Busan Tours</Link>
      </div>
      
      {/* Desktop Navigation */}
      <ul className="nav-links desktop-nav">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/#tours">Tours</Link></li>
        <li><Link to="/custom-tour">Custom Tour</Link></li>
        <li><Link to="/#gallery">Gallery</Link></li>
        <li><Link to="/#events">Events</Link></li>
        <li><Link to="/#contact">Contact</Link></li>
        
        {/* Auth Buttons - Always visible */}
        <li className="auth-buttons">
          <div className="auth-links">
            <Link to="/login" className="login-button">Login</Link>
            <Link to="/signup" className="signup-button">Sign Up</Link>
          </div>
        </li>
      </ul>

      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        ☰
      </button>

      {/* Mobile Navigation */}
      <ul className={`nav-links mobile-nav ${isMobileMenuOpen ? 'mobile-nav-open' : ''}`}>
        <li><Link to="/" onClick={toggleMobileMenu}>Home</Link></li>
        <li><Link to="/#tours" onClick={toggleMobileMenu}>Tours</Link></li>
        <li><Link to="/custom-tour" onClick={toggleMobileMenu}>Custom Tour</Link></li>
        <li><Link to="/#gallery" onClick={toggleMobileMenu}>Gallery</Link></li>
        <li><Link to="/#events" onClick={toggleMobileMenu}>Events</Link></li>
        <li><Link to="/#contact" onClick={toggleMobileMenu}>Contact</Link></li>
        
        {/* Mobile Auth Buttons */}
        <li className="auth-buttons mobile-auth">
          <div className="auth-links">
            <Link to="/login" className="login-button" onClick={toggleMobileMenu}>Login</Link>
            <Link to="/signup" className="signup-button" onClick={toggleMobileMenu}>Sign Up</Link>
          </div>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation; 