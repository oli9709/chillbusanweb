import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  return (
    <nav className="main-nav">
      <div className="nav-brand">
        <Link to="/" className="nav-logo">Chill Busan Tours</Link>
      </div>
      
      <ul className="nav-links">
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
    </nav>
  );
};

export default Navigation; 