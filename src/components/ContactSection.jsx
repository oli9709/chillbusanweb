import React, { useState } from 'react';
import './ContactSection.css';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tourDate: '',
    numPeople: '',
    tourType: '',
    contactMethod: '',
    contactInfo: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // For now, we'll use a simple mailto link
      // Later you can integrate EmailJS or Firebase
      const subject = 'New Tour Inquiry from Website';
      const body = `
Name: ${formData.name}
Email: ${formData.email}
Tour Date: ${formData.tourDate}
Number of People: ${formData.numPeople}
Tour Type: ${formData.tourType}
Contact Method: ${formData.contactMethod}
Contact Info: ${formData.contactInfo}
Message: ${formData.message}
      `;

      const mailtoLink = `mailto:theofficialali_05@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;

      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        tourDate: '',
        numPeople: '',
        tourType: '',
        contactMethod: '',
        contactInfo: '',
        message: ''
      });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setMinDate = () => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  };

  return (
    <section className="contact section" id="contact">
      <h2>Book Your Busan Adventure</h2>
      
      <div className="booking-cta">
        <p>Ready to explore Busan with us?</p>
        <div className="action-buttons">
          <a 
            href="https://instagram.com/chilltours_busan" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="plan-button instagram"
          >
            <i className="fab fa-instagram"></i> Plan via Instagram DM
          </a>
          <a 
            href="mailto:theofficialali_05@gmail.com?subject=Chill Busan Tours Booking Request" 
            className="plan-button email"
          >
            <i className="fas fa-envelope"></i> Plan via Email
          </a>
        </div>
      </div>

      <div className="contact-container">
        <div className="contact-info">
          <h3>Connect With Us</h3>
          <div className="social-links">
            <a 
              href="https://instagram.com/chilltours_busan" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <i className="fab fa-instagram"></i>
              <span>@chilltours_busan</span>
            </a>
            <a 
              href="https://wa.me/8201039732052" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <i className="fab fa-whatsapp"></i>
              <span>+82 010-3973-2052</span>
            </a>
            <a href="mailto:theofficialali_05@gmail.com">
              <i className="fas fa-envelope"></i>
              <span>theofficialali_05@gmail.com</span>
            </a>
            <a 
              href="https://maps.app.goo.gl/123" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <i className="fas fa-map-marker-alt"></i>
              <span>Busan, South Korea</span>
            </a>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h3>Quick Inquiry Form</h3>
          
          {submitStatus === 'success' && (
            <div className="form-message success">
              <i className="fas fa-check-circle"></i>
              <span>Thank you for your message! We will get back to you soon.</span>
            </div>
          )}
          
          {submitStatus === 'error' && (
            <div className="form-message error">
              <i className="fas fa-exclamation-circle"></i>
              <span>Oops! There was a problem submitting your form. Please try again or contact us directly.</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tourDate">Tour Date *</label>
            <input
              type="date"
              id="tourDate"
              name="tourDate"
              value={formData.tourDate}
              onChange={handleInputChange}
              min={setMinDate()}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="numPeople">Number of People *</label>
            <select
              id="numPeople"
              name="numPeople"
              value={formData.numPeople}
              onChange={handleInputChange}
              required
            >
              <option value="">Select number of people</option>
              <option value="1">1 Person</option>
              <option value="2">2 People</option>
              <option value="3">3 People</option>
              <option value="4">4 People</option>
              <option value="5+">5+ People</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tourType">Tour Type *</label>
            <select
              id="tourType"
              name="tourType"
              value={formData.tourType}
              onChange={handleInputChange}
              required
            >
              <option value="">Select your tour</option>
              <option value="hidden_gems">Hidden Gems, Beaches & Local Food</option>
              <option value="kdrama">K-Drama Day Tour with Pet Café</option>
              <option value="custom">Custom Tour</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="contactMethod">Preferred Contact Method *</label>
            <select
              id="contactMethod"
              name="contactMethod"
              value={formData.contactMethod}
              onChange={handleInputChange}
              required
            >
              <option value="">Select contact method</option>
              <option value="instagram">Instagram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="contactInfo">Contact Info *</label>
            <input
              type="text"
              id="contactInfo"
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleInputChange}
              placeholder="Your Instagram / WhatsApp / Email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message (Optional)</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows="3"
              placeholder="Any special requests or questions?"
            />
          </div>

          <button type="submit" className="submit-button" disabled={isSubmitting}>
            <span className="button-text">
              {isSubmitting ? 'Sending...' : 'Send Tour Request'}
            </span>
            {isSubmitting && (
              <span className="button-loader">
                <i className="fas fa-spinner fa-spin"></i>
              </span>
            )}
          </button>
        </form>

        <div className="quick-contact">
          <h4>Or Contact Us Directly:</h4>
          <div className="quick-contact-buttons">
            <a 
              href="https://www.instagram.com/chilltours_busan" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="quick-contact-btn instagram"
            >
              <i className="fab fa-instagram"></i>
              <span>Instagram</span>
            </a>
            <a 
              href="https://wa.me/821039732052" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="quick-contact-btn whatsapp"
            >
              <i className="fab fa-whatsapp"></i>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection; 