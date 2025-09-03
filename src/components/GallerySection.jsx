import React, { useState, useEffect, useRef } from 'react';
import './GallerySection.css';

const GallerySection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef(null);
  const autoPlayRef = useRef(null);

  const images = [
    {
      src: '/blue line.jpg',
      alt: 'Blue Line Park in Busan',
      caption: 'Experience the scenic Blue Line Park'
    },
    {
      src: '/busan photo spot.jpg',
      alt: 'Popular photo spot in Busan',
      caption: 'Discover Instagram-worthy photo spots'
    },
    {
      src: '/gamchon.jpg',
      alt: 'Colorful Gamcheon Culture Village',
      caption: 'Explore vibrant Gamcheon Culture Village'
    },
    {
      src: '/gwangan-bridge.jpg',
      alt: 'Gwangan Bridge illuminated at night',
      caption: 'Marvel at Gwangan Bridge\'s night lights'
    },
    {
      src: '/heundae night.jpg',
      alt: 'Haeundae Beach at night',
      caption: 'Experience Haeundae\'s vibrant nightlife'
    },
    {
      src: '/street-food.jpg',
      alt: 'Traditional Korean street food',
      caption: 'Savor authentic Korean street food'
    },
    {
      src: '/temple-korea.jpg',
      alt: 'Traditional Korean temple',
      caption: 'Visit serene Korean temples'
    },
    {
      src: '/tourist 1.jpg',
      alt: 'Happy tourists in Busan',
      caption: 'Create unforgettable memories in Busan'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(nextSlide, 5000);
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying]);

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  return (
    <section className="gallery section parallax-section" id="gallery">
      <h2>📸 Moments & Memories</h2>
      <div className="carousel-container">
        <div 
          className="carousel" 
          ref={carouselRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="carousel-slide">
              <img src={image.src} alt={image.alt} loading="lazy" />
              <div className="caption">{image.caption}</div>
            </div>
          ))}
        </div>
        
        <button 
          className="carousel-button prev" 
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <button 
          className="carousel-button next" 
          onClick={nextSlide}
          aria-label="Next slide"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
        
        <div className="carousel-dots" role="tablist" aria-label="Slide dots">
          {images.map((_, index) => (
            <div
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              role="tab"
              aria-selected={index === currentSlide}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection; 