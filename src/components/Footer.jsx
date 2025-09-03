import React from 'react';
import './Footer.css';

const Footer = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <h3>Chill Busan Tours</h3>
          <p>Private. Relaxed. Unforgettable.</p>
        </div>
        
        <div className="footer-social">
          <a 
            href="https://instagram.com/chilltours_busan" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-icon"
            aria-label="Follow us on Instagram"
          >
            <i className="fab fa-instagram"></i>
          </a>
          <a 
            href="https://www.tiktok.com/@chilltours_busan?_t=ZS-8wtxduMO4Cv&_r=1" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-icon"
            aria-label="Follow us on TikTok"
          >
            <i className="fab fa-tiktok"></i>
          </a>
        </div>
        
        <div className="footer-info">
          <p>© 2024 Chill Busan Tours. All rights reserved.</p>
          <p>Tour Agency • Busan, South Korea</p>
          <nav className="footer-nav">
            <button onClick={() => scrollToSection('hero')}>Home</button>
            <button onClick={() => scrollToSection('tours')}>Tours</button>
            <button onClick={() => scrollToSection('gallery')}>Gallery</button>
            <button onClick={() => scrollToSection('events')}>Events</button>
            <button onClick={() => scrollToSection('contact')}>Contact</button>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 