import React, { useState } from 'react';
import './CookieConsent.css';

function CookieConsent() {
  const [accepted, setAccepted] = useState(
    localStorage.getItem('cookieConsent') === 'accepted'
  );

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setAccepted(true);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className="cookie-consent">
      <div className="cookie-content">
        <p>🍪 We use cookies to improve your experience. By using JobConnect, you agree to our <a href="/privacy">Privacy Policy</a>.</p>
        <div className="cookie-buttons">
          <button onClick={handleAccept} className="btn btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}}>Accept</button>
          <button onClick={handleDecline} className="btn btn-sm" style={{background:'#666',color:'white',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}}>Decline</button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;