import React from 'react';
import './SpecialEventsSection.css';

const SpecialEventsSection = () => {
  const events = [
    {
      id: 'birthday-picnic',
      icon: '🎂',
      title: 'Birthday Picnic Setup',
      description: 'Celebrate your special day with a perfectly arranged picnic at Busan\'s most scenic spots.',
      price: 150,
      features: ['Custom decoration', 'Birthday cake', 'Photo service', '2-hour setup']
    },
    {
      id: 'proposal-yacht',
      icon: '💍',
      title: 'Proposal on Yacht',
      description: 'Pop the question with style against the backdrop of Busan\'s stunning coastline.',
      price: 300,
      features: ['Private yacht', 'Champagne service', 'Professional photos', 'Custom decoration']
    },
    {
      id: 'beach-party',
      icon: '🎊',
      title: 'Custom Beach Party',
      description: 'Your perfect beach celebration, customized just the way you want it.',
      price: 200,
      features: ['Beach setup', 'Sound system', 'Catering options', 'Party decorations']
    },
    {
      id: 'sunset-picnic',
      icon: '🌅',
      title: 'Sunset Picnic Experience',
      description: 'Romantic sunset picnic with Korean snacks and breathtaking views.',
      price: 120,
      features: ['Premium location', 'Korean snacks', 'Wine service', 'Blanket setup']
    },
    {
      id: 'anniversary-celebration',
      icon: '💕',
      title: 'Anniversary Celebration',
      description: 'Make your anniversary unforgettable with a personalized celebration package.',
      price: 180,
      features: ['Romantic dinner', 'Flower arrangement', 'Photo session', 'Custom itinerary']
    },
    {
      id: 'group-celebration',
      icon: '👥',
      title: 'Group Celebration',
      description: 'Perfect for birthdays, graduations, or any group celebration in Busan.',
      price: 250,
      features: ['Group activities', 'Catering for 10+', 'Transportation', 'Event coordination']
    }
  ];

  const handleInquiry = (event) => {
    const subject = `Special Event Inquiry: ${event.title}`;
    const body = `Hello Chill Busan Tours,\n\nI'm interested in booking the ${event.title} package for $${event.price}.\n\nPlease contact me to arrange this special event.\n\nBest regards`;
    
    const mailtoLink = `mailto:theofficialali05@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  return (
    <section className="special-events section parallax-section" id="events">
      <h2>Special Occasions</h2>
      <p className="section-intro">Make your special moments in Busan unforgettable</p>
      
      <div className="events-container">
        {events.map((event) => (
          <div key={event.id} className="event-card">
            <div className="event-icon">{event.icon}</div>
            <h3>{event.title}</h3>
            <p className="event-description">{event.description}</p>
            <div className="event-price">
              <span className="price-amount">${event.price}</span>
              <span className="price-label">USD</span>
            </div>
            <div className="event-features">
              {event.features.map((feature, index) => (
                <span key={index} className="feature-tag">{feature}</span>
              ))}
            </div>
            <button 
              className="event-inquiry-btn"
              onClick={() => handleInquiry(event)}
            >
              Inquire About This Event
            </button>
          </div>
        ))}
      </div>

      <div className="events-info">
        <div className="info-cards">
          <div className="info-card">
            <i className="far fa-clock"></i>
            <h4>Advance Booking</h4>
            <p>Book at least 24 hours ahead</p>
          </div>
          <div className="info-card">
            <i className="fas fa-tag"></i>
            <h4>Custom Pricing</h4>
            <p>Prices vary by event type and requirements</p>
          </div>
          <div className="info-card">
            <i className="fas fa-camera"></i>
            <h4>Photo Service</h4>
            <p>Optional professional photo/video service</p>
          </div>
          <div className="info-card">
            <i className="fas fa-heart"></i>
            <h4>Personalized</h4>
            <p>Every event is customized to your preferences</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpecialEventsSection; 