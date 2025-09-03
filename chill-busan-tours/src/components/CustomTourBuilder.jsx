import React, { useState, useEffect } from 'react';
import './CustomTourBuilder.css';

const CustomTourBuilder = () => {
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedLunch, setSelectedLunch] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [tourSummary, setTourSummary] = useState('');
  const [costBreakdown, setCostBreakdown] = useState('');

  const locationOptions = [
    { value: 'gamcheon', name: 'Gamcheon Culture Village', price: 49.99, icon: 'fas fa-mountain' },
    { value: 'gwangalli', name: 'Gwangalli Beach & Bridge', price: 49.99, icon: 'fas fa-bridge' },
    { value: 'haeundae', name: 'Haeundae Beach', price: 49.99, icon: 'fas fa-umbrella-beach' },
    { value: 'oryukdo', name: 'Oryukdo Island and Skywalk', price: 49.99, icon: 'fas fa-island' },
    { value: 'haedong', name: 'Haedong Yonggungsa Temple', price: 49.99, icon: 'fas fa-temple' },
    { value: 'hwamyeong', name: 'Hwamyeong Eco Park (Mountain night view)', price: 49.99, icon: 'fas fa-tree' },
    { value: 'songdo', name: 'Songdo Beach + Cable Car (Premium)', price: 49.99, icon: 'fas fa-cable-car', premium: true },
    { value: 'blueline', name: 'Blue Line Park (Capsule train) (Premium)', price: 49.99, icon: 'fas fa-train', premium: true },
    { value: 'jagalchi', name: 'Jagalchi Fish Market', price: 49.99, icon: 'fas fa-fish' },
    { value: 'dadaepo', name: 'Dadaepo Beach + Sunset', price: 49.99, icon: 'fas fa-sunset' }
  ];

  const lunchOptions = [
    { value: 'geumsubokguk', name: 'Geumsubokguk (금수복국)' },
    { value: 'obok', name: 'Obok Restaurant (오복미역)' },
    { value: 'ashley', name: 'Ashley Queens Buffet' },
    { value: 'haeundae-market', name: 'Haeundae Traditional Market Food Alley' },
    { value: 'baekhwa', name: 'Baekhwa-jumak (백화주막)' },
    { value: 'haeundae-bbq', name: 'Haeundae BBQ' }
  ];

  const serviceOptions = [
    { value: 'hanbok', name: 'Hanbok rental', price: 19 },
    { value: 'fireworks', name: 'Mini fireworks set', price: 15 },
    { value: 'souvenir', name: 'Chill Busan souvenir gift', price: 15 },
    { value: 'postcard', name: 'Postcard from Busan', price: 5 },
    { value: 'instagram', name: 'Instagram reel/video help', price: 10 },
    { value: 'picnic', name: 'Sunset picnic setup', price: 30 },
    { value: 'video-editing', name: 'Full video editing of the tour (1–2 min recap)', price: 50 }
  ];

  const handleLocationChange = (locationValue) => {
    setSelectedLocations(prev => {
      if (prev.includes(locationValue)) {
        return prev.filter(loc => loc !== locationValue);
      } else {
        if (prev.length >= 5) {
          alert('You can only select up to 5 locations!');
          return prev;
        }
        return [...prev, locationValue];
      }
    });
  };

  const handleServiceChange = (serviceValue) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceValue)) {
        return prev.filter(service => service !== serviceValue);
      } else {
        return [...prev, serviceValue];
      }
    });
  };

  const calculateTotalCost = () => {
    const locationCost = selectedLocations.length * 49.99;
    const serviceCost = selectedServices.reduce((total, service) => {
      const serviceOption = serviceOptions.find(s => s.value === service);
      return total + (serviceOption ? serviceOption.price : 0);
    }, 0);
    
    return locationCost + serviceCost;
  };

  const generateTourSummary = () => {
    if (selectedLocations.length === 0) {
      return 'Select your locations above to see your personalized tour summary.';
    }

    const locationNames = selectedLocations.map(loc => {
      const location = locationOptions.find(l => l.value === loc);
      return location ? location.name : loc;
    });

    const lunchName = lunchOptions.find(l => l.value === selectedLunch)?.name;
    const serviceNames = selectedServices.map(service => {
      const serviceOption = serviceOptions.find(s => s.value === service);
      return serviceOption ? serviceOption.name : service;
    });

    let summary = `Your Custom Busan Tour:\n\n`;
    summary += `📍 Selected Locations (${selectedLocations.length}):\n`;
    locationNames.forEach((name, index) => {
      summary += `${index + 1}. ${name}\n`;
    });

    if (selectedLunch) {
      summary += `\n🍽️ Lunch Option: ${lunchName}\n`;
    }

    if (selectedServices.length > 0) {
      summary += `\n�� Extra Services:\n`;
      serviceNames.forEach((name, index) => {
        summary += `${index + 1}. ${name}\n`;
      });
    }

    summary += `\n⏰ Estimated Duration: ${selectedLocations.length} hours + lunch + extras`;
    summary += `\n💰 Total Cost: $${totalCost.toFixed(2)}`;

    return summary;
  };

  const generateCostBreakdown = () => {
    if (selectedLocations.length === 0) {
      return 'Select locations to see cost breakdown.';
    }

    let breakdown = 'Cost Breakdown:\n\n';
    
    // Locations
    breakdown += `📍 Locations (${selectedLocations.length} × $49.99): $${(selectedLocations.length * 49.99).toFixed(2)}\n`;
    
    // Services
    if (selectedServices.length > 0) {
      breakdown += '\n🎁 Extra Services:\n';
      selectedServices.forEach(service => {
        const serviceOption = serviceOptions.find(s => s.value === service);
        if (serviceOption) {
          breakdown += `  • ${serviceOption.name}: $${serviceOption.price.toFixed(2)}\n`;
        }
      });
    }
    
    breakdown += `\n💳 Total: $${totalCost.toFixed(2)}`;
    
    return breakdown;
  };

  const contactAboutCustomTour = () => {
    const summary = generateTourSummary();
    const breakdown = generateCostBreakdown();
    
    const emailSubject = 'Custom Busan Tour Inquiry';
    const emailBody = `Hello Chill Busan Tours,\n\nI'm interested in booking a custom tour with the following details:\n\n${summary}\n\n${breakdown}\n\nPlease contact me to arrange this tour.\n\nBest regards`;
    
    const mailtoLink = `mailto:theofficialali05@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    if (window.confirm('Are you sure you want to send this tour inquiry? You cannot change the tour once sent!')) {
      window.location.href = mailtoLink;
      showSuccessAnimation();
    }
  };

  const showSuccessAnimation = () => {
    // Create success animation element
    const animationContainer = document.createElement('div');
    animationContainer.className = 'success-animation-container';
    animationContainer.innerHTML = `
      <div class="success-animation">
        <div class="plane">
          <i class="fas fa-paper-plane"></i>
        </div>
        <div class="message">
          <h3>Message Sent!</h3>
          <p>We'll get back to you soon with your custom tour details.</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(animationContainer);
    
    // Remove animation after 3 seconds
    setTimeout(() => {
      document.body.removeChild(animationContainer);
    }, 3000);
  };

  useEffect(() => {
    const newTotalCost = calculateTotalCost();
    setTotalCost(newTotalCost);
    setTourSummary(generateTourSummary());
    setCostBreakdown(generateCostBreakdown());
  }, [selectedLocations, selectedLunch, selectedServices]);

  return (
    <section className="custom-tour section" id="custom-tour">
      <h2>🎨 Build Your Perfect Tour</h2>
      <p className="section-intro">
        Create your own personalized Busan experience! Choose up to 5 locations and customize your tour with lunch and extra services.
      </p>
      
      <div className="custom-tour-container">
        <div className="tour-builder">
          {/* Step 1: Locations */}
          <div className="builder-step">
            <h3>Step 1: Choose Your Locations (4-5 locations, $49.99 each)</h3>
            <div className="location-options">
              {locationOptions.map((location) => (
                <label 
                  key={location.value} 
                  className={`location-option ${location.premium ? 'premium' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(location.value)}
                    onChange={() => handleLocationChange(location.value)}
                  />
                  <span className="option-content">
                    <i className={location.icon}></i>
                    <span>{location.name}</span>
                    <span className="price">${location.price}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="location-limit">
              <p><strong>Note:</strong> Choose 4-5 locations maximum. Each location takes approximately 1 hour.</p>
            </div>
          </div>

          {/* Step 2: Lunch */}
          <div className="builder-step">
            <h3>Step 2: Choose Your Lunch Option (Self-covered)</h3>
            <div className="lunch-options">
              {lunchOptions.map((lunch) => (
                <label key={lunch.value} className="lunch-option">
                  <input
                    type="radio"
                    name="lunch"
                    value={lunch.value}
                    checked={selectedLunch === lunch.value}
                    onChange={(e) => setSelectedLunch(e.target.value)}
                  />
                  <span className="option-content">
                    <i className="fas fa-utensils"></i>
                    <span>{lunch.name}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Step 3: Extra Services */}
          <div className="builder-step">
            <h3>Step 3: Extra Services (Optional - Self-covered)</h3>
            <div className="extra-services">
              {serviceOptions.map((service) => (
                <label key={service.value} className="service-option">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.value)}
                    onChange={() => handleServiceChange(service.value)}
                  />
                  <span className="option-content">
                    <i className="fas fa-gift"></i>
                    <span>{service.name}</span>
                    <span className="price">${service.price}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Tour Summary */}
          <div className="tour-summary">
            <h3>Your Custom Tour Summary</h3>
            <div id="tour-summary-content">
              <pre>{tourSummary}</pre>
            </div>
            <div className="cost-calculator">
              <div className="cost-breakdown">
                <h4>💰 Cost Breakdown</h4>
                <div id="cost-breakdown-content">
                  <pre>{costBreakdown}</pre>
                </div>
              </div>
              <div className="total-cost">
                <h4>💳 Total Cost</h4>
                <div id="total-cost">${totalCost.toFixed(2)}</div>
              </div>
            </div>
            <div className="summary-actions">
              <button className="summary-button" onClick={() => setTourSummary(generateTourSummary())}>
                Generate Detailed Summary
              </button>
              <button className="contact-button" onClick={contactAboutCustomTour}>
                Contact Us About This Tour
              </button>
            </div>
          </div>
        </div>

        <div className="custom-tour-info">
          <div className="info-card">
            <i className="fas fa-magic"></i>
            <h4>Personalized Experience</h4>
            <p>Choose 4-5 locations from our curated list of Busan's best spots.</p>
          </div>
          <div className="info-card">
            <i className="fas fa-clock"></i>
            <h4>Flexible Timing</h4>
            <p>Each location takes about 1 hour. Total tour time: 4-5 hours + lunch + extras.</p>
          </div>
          <div className="info-card">
            <i className="fas fa-map-marked-alt"></i>
            <h4>Premium Options</h4>
            <p>Special premium locations like Songdo Cable Car and Blue Line Park available.</p>
          </div>
          <div className="info-card">
            <i className="fas fa-comments"></i>
            <h4>Extra Services</h4>
            <p>Enhance your experience with optional services like Hanbok rental, video editing, and more.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomTourBuilder;
