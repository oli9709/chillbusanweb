import React, { useEffect, useRef } from 'react';
import './HeroSection.css';

const HeroSection = () => {
  const videoRefs = useRef([]);
  const currentVideoIndex = useRef(0);

  useEffect(() => {
    const switchVideo = (index) => {
      // Hide all videos
      videoRefs.current.forEach((video, i) => {
        if (video) {
          video.style.opacity = i === index ? '1' : '0';
        }
      });
    };

    const nextVideo = () => {
      currentVideoIndex.current = (currentVideoIndex.current + 1) % videoRefs.current.length;
      switchVideo(currentVideoIndex.current);
    };

    // Initialize first video
    switchVideo(0);

    // Auto-switch videos every 8 seconds
    const interval = setInterval(nextVideo, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="hero section" id="hero">
      <div className="video-background">
        <div className="video-container active">
          <video 
            ref={el => videoRefs.current[0] = el}
            autoPlay 
            muted 
            loop 
            playsInline
          >
            <source src="/backgroundvideo.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="video-container">
          <video 
            ref={el => videoRefs.current[1] = el}
            autoPlay 
            muted 
            loop 
            playsInline
          >
            <source src="/backgroundvideo2.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="video-container">
          <video 
            ref={el => videoRefs.current[2] = el}
            autoPlay 
            muted 
            loop 
            playsInline
          >
            <source src="/backgroundvideo3.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1 className="brand-name">Chill Busan Tours</h1>
        <h2 className="tagline">Experience Busan's Hidden Beauty</h2>
        <a href="#tours" className="cta-button">Start Your Journey</a>
      </div>
    </header>
  );
};

export default HeroSection; 