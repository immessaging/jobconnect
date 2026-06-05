import React, { useState, useEffect } from 'react';
import './CookieConsent.css';

function CookieConsent() {
  const [accepted, setAccepted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Check if consent was already given
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Small delay before showing for better UX
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setFadingOut(true);
    setTimeout(() => {
      setAccepted(true);
      setVisible(false);
    }, 300);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setFadingOut(true);
    setTimeout(() => {
      setAccepted(true);
      setVisible(false);
    }, 300);
  };

  if (!visible) return null;

  return (
    <div className={`cookie-consent ${fadingOut ? 'fade-out' : 'fade-in'}`}>
      <div className="cookie-container">
        <div className="cookie-icon">🍪</div>
        <div className="cookie-content">
          <h4>Cookie Consent</h4>
          <p>
            We use cookies to enhance your browsing experience, serve personalized content, 
            and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
          </p>
          <p className="cookie-links">
            <a href="/privacy">Privacy Policy</a>
            <span className="separator">|</span>
            <a href="/terms">Terms of Service</a>
            <span className="separator">|</span>
            <a href="/cookies">Cookie Settings</a>
          </p>
        </div>
        <div className="cookie-buttons">
          <button 
            onClick={handleAccept} 
            className="cookie-btn cookie-btn-accept"
            aria-label="Accept all cookies"
          >
            ✅ Accept All
          </button>
          <button 
            onClick={handleDecline} 
            className="cookie-btn cookie-btn-decline"
            aria-label="Decline optional cookies"
          >
            ❌ Decline
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;