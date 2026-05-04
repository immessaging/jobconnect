import React, { useEffect, useState } from 'react';
import { trackGPS } from '../services/api';

function GPSMap({ userId, userEmail }) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [tracking, setTracking] = useState(false);

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      return;
    }

    setTracking(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
        
        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy,
          altitude,
          speed,
          heading
        });

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`
          );
          const data = await response.json();
          
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          const state = data.address?.state || '';
          const country = data.address?.country || 'Nigeria';
          const locationStr = [city, state, country].filter(Boolean).join(', ');

          // Save to backend
          await trackGPS({
            user_id: userId,
            email: userEmail,
            latitude,
            longitude,
            accuracy,
            altitude,
            speed,
            heading,
            city,
            state,
            country,
            location_string: locationStr
          });

          setLocation(prev => ({ ...prev, city, state, country, locationStr }));
        } catch (err) {
          console.log('Reverse geocode failed:', err);
        }

        setTracking(false);
      },
      (err) => {
        setError(
          err.code === 1 ? 'Location denied. Enable GPS in browser settings.' :
          err.code === 2 ? 'Location unavailable. Check GPS/WiFi.' :
          'Timeout. Try again.'
        );
        setTracking(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  // Auto-track on mount
  useEffect(() => {
    getCurrentPosition();
  }, []);

  return (
    <div className="gps-map-container">
      <div className="gps-header">
        <h3>📍 Real-Time GPS Location</h3>
        <button 
          onClick={getCurrentPosition} 
          disabled={tracking}
          className="btn btn-sm"
          style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}}
        >
          {tracking ? '📍 Getting Location...' : '🔄 Refresh Location'}
        </button>
      </div>

      {error && (
        <div className="gps-error">{error}</div>
      )}

      {location && (
        <div className="gps-info">
          <div className="gps-coords">
            <p><strong>Latitude:</strong> {location.lat.toFixed(6)}</p>
            <p><strong>Longitude:</strong> {location.lng.toFixed(6)}</p>
            <p><strong>Accuracy:</strong> {Math.round(location.accuracy)}m</p>
            {location.altitude && <p><strong>Altitude:</strong> {Math.round(location.altitude)}m</p>}
            {location.speed && <p><strong>Speed:</strong> {Math.round(location.speed * 3.6)} km/h</p>}
          </div>
          <div className="gps-address">
            <p><strong>📍 Address:</strong> {location.locationStr || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</p>
            <p><strong>🏙️ City:</strong> {location.city || 'Detecting...'}</p>
            <p><strong>🗺️ State:</strong> {location.state || 'Detecting...'}</p>
          </div>
        </div>
      )}

      {location && (
        <div className="gps-map">
          <iframe
            src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=16&output=embed`}
            width="100%"
            height="300"
            style={{border:'none',borderRadius:'8px'}}
            title="GPS Map"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}

export default GPSMap;