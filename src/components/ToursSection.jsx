import React from 'react';
import './ToursSection.css';

const ToursSection = () => {
  const tours = [
    {
      id: 'hidden-gems',
      badge: 'Hidden Gems',
      title: '🌟 Busan Hidden Gems, Beaches & Local Food',
      duration: '6-7 hours',
      guests: 'Up to 4 guests',
      price: '$222 per group',
      includes: 'Private driver-guide • Hotel pickup/drop-off • All entrance fees • Water & snacks • Photo service',
      highlights: [
        '🏘️ Gamcheon Culture Village - Artistic alleyways & murals',
        '🐚 Songdo Skywalk & Beach - Scenic glass-floored bridge',
        '🛕 Haedong Yonggungsa Temple - Seaside temple',
        '🍜 Authentic Korean Lunch - Your choice of local favorites',
        '🏞️ Secret Scenic Spots & Markets - Guide\'s special picks!'
      ],
      bookingUrl: 'https://www.getyourguide.com/gamcheon-culture-village-l91316/busan-hidden-gems-beaches-and-local-food-private-tour-t942375/?utm_source=getyourguide&utm_medium=sharing&utm_campaign=activity_details'
    },
    {
      id: 'k-drama',
      badge: 'Featured Tour',
      title: '🌟 K-Drama Day Tour with Pet Café & Picnic',
      duration: '6-7 hours',
      guests: 'Up to 4 guests',
      price: '$222 per group',
      includes: 'Private driver-guide • Hotel pickup/drop-off • All entrance fees • Water & snacks • Photo service',
      highlights: [
        '📺 Visit famous K-Drama filming locations',
        '🐱 Enjoy time at a charming pet café',
        '🌸 Instagram-worthy photo spots',
        '🍱 Picnic with Korean snacks',
        '🎬 Recreate your favorite K-Drama scenes!'
      ],
      bookingUrl: 'https://www.getyourguide.com/gamcheon-culture-village-l91316/busan-guided-k-drama-day-tour-with-pet-cafe-picnic-t996462/?utm_source=getyourguide&utm_medium=sharing&utm_campaign=activity_details'
    }
  ];

  const handleBooking = (url) => {
    window.open(url, '_blank');
  };

  return (
    <section className="tours section" id="tours">
      <h2>Our Tours</h2>
      
      <div className="tour-cards featured-tours">
        {tours.map((tour) => (
          <div key={tour.id} className={`tour-card featured ${tour.id}`}>
            <div className="tour-content">
              <div className="featured-badge">{tour.badge}</div>
              <h3>{tour.title}</h3>
              <div className="tour-highlights">
                <span><i className="far fa-clock"></i> {tour.duration}</span>
                <span><i className="fas fa-users"></i> {tour.guests}</span>
                <span><i className="fas fa-dollar-sign"></i> {tour.price}</span>
              </div>
              <p className="price-note">All prices in USD.</p>
              <div className="tour-includes">
                <p>Includes: {tour.includes}</p>
              </div>
              <div className="tour-stops">
                <p>Tour Highlights:</p>
                <ol>
                  {tour.highlights.map((highlight, index) => (
                    <li key={index}>{highlight}</li>
                  ))}
                </ol>
              </div>
              <button 
                className="details-button" 
                onClick={() => handleBooking(tour.bookingUrl)}
              >
                Book This Tour
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ToursSection; 