import React, { useEffect, useState, useCallback } from 'react';
import { trackGPS } from '../services/api';
import './GPSMap.css';

function GPSMap({ userId, userEmail }) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [tracking, setTracking] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [watchId, setWatchId] = useState(null);

  // Get GPS position using browser Geolocation API (real GPS, not IP)
  const getCurrentPosition = useCallback(() => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setError('⚠️ GPS not supported by your browser. Please use a modern browser.');
      return;
    }

    setTracking(true);
    setError('');

    // Request high-accuracy GPS position
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
        
        console.log('🛰️ GPS Position obtained:', {
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          accuracy: `${Math.round(accuracy)}m`,
          source: 'Device GPS'
        });
        
        const newLocation = {
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          altitude: altitude ? Math.round(altitude) : null,
          speed: speed ? Math.round(speed * 3.6) : null, // Convert m/s to km/h
          heading: heading ? Math.round(heading) : null,
          source: 'gps' // Mark as GPS source, not IP
        };

        setLocation(newLocation);
        setLastUpdated(new Date());

        // Try to get human-readable address from coordinates
        // This uses OpenStreetMap (free, no API key needed)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=18`,
            {
              headers: {
                'Accept-Language': 'en-NG,en;q=0.9',
                'User-Agent': 'JobConnect-Nigeria-GPS/1.0'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            
            const address = data.address || {};
            const road = address.road || address.street || '';
            const city = address.city || address.town || address.village || address.suburb || '';
            const state = address.state || address.region || '';
            const country = address.country || 'Nigeria';
            const displayName = data.display_name || '';
            
            const locationStr = [road, city, state].filter(Boolean).join(', ') || displayName;

            const updatedLocation = { 
              ...newLocation, 
              road,
              city, 
              state, 
              country, 
              displayName,
              locationStr: locationStr || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            };
            
            setLocation(updatedLocation);

            // Save GPS data to backend
            if (userId) {
              try {
                await trackGPS({
                  user_id: userId,
                  email: userEmail || '',
                  latitude,
                  longitude,
                  accuracy: Math.round(accuracy),
                  altitude: altitude || null,
                  speed: speed || null,
                  heading: heading || null,
                  city: city || '',
                  state: state || '',
                  country: country || 'Nigeria',
                  location_string: updatedLocation.locationStr
                });
                console.log('✅ GPS data saved to server');
              } catch (apiErr) {
                console.log('⚠️ GPS data saved locally, server sync pending');
              }
            }
          }
        } catch (geoErr) {
          console.log('⚠️ Address lookup unavailable, using coordinates only');
          setLocation(prev => ({
            ...prev,
            locationStr: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
        }

        setTracking(false);
      },
      (err) => {
        // GPS-specific error messages
        const errorMessages = {
          [err.PERMISSION_DENIED]: '📍 GPS access denied. Please enable location in your browser/device settings.',
          [err.POSITION_UNAVAILABLE]: '🛰️ GPS signal unavailable. Move to an open area with clear sky view.',
          [err.TIMEOUT]: '⏰ GPS timeout. Please try again in an area with better signal.',
        };
        setError(errorMessages[err.code] || `❌ GPS error (${err.code}): ${err.message}`);
        setTracking(false);
      },
      { 
        enableHighAccuracy: true,  // Force GPS (not IP/cell tower)
        timeout: 30000,            // 30 seconds for GPS fix
        maximumAge: 0              // Always get fresh position
      }
    );
  }, [userId, userEmail]);

  // Start continuous GPS tracking
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) return;

    // Clear existing watch
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
        
        const updatedLocation = {
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          altitude: altitude ? Math.round(altitude) : null,
          speed: speed ? Math.round(speed * 3.6) : null,
          heading: heading ? Math.round(heading) : null,
          source: 'gps'
        };

        setLocation(prev => ({ ...prev, ...updatedLocation }));
        setLastUpdated(new Date());
        setError('');
      },
      (err) => {
        console.log('GPS watch error:', err.message);
      },
      { 
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 5000 // Accept positions up to 5 seconds old
      }
    );

    setWatchId(id);
    return id;
  }, [watchId]);

  // Start GPS on mount
  useEffect(() => {
    getCurrentPosition();
    
    // Refresh GPS every 3 minutes
    const interval = setInterval(getCurrentPosition, 180000);
    
    return () => {
      clearInterval(interval);
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [getCurrentPosition]);

  const getAccuracyColor = (accuracy) => {
    if (!accuracy) return '#888';
    if (accuracy <= 5) return '#28a745';   // Excellent (GPS)
    if (accuracy <= 15) return '#4caf50';  // Very Good
    if (accuracy <= 30) return '#ffc107';  // Good
    if (accuracy <= 100) return '#ff9800'; // Fair
    return '#dc3545';                       // Poor (likely not GPS)
  };

  const getAccuracyLabel = (accuracy) => {
    if (!accuracy) return 'Unknown';
    if (accuracy <= 5) return '🎯 Excellent (GPS)';
    if (accuracy <= 15) return '✅ Very Good';
    if (accuracy <= 30) return '👍 Good';
    if (accuracy <= 100) return '⚠️ Fair';
    return '❌ Poor (Not GPS)';
  };

  const getTimeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="gps-map-container">
      {/* Header */}
      <div className="gps-header">
        <div className="gps-header-left">
          <h3>
            <span className="gps-icon">🛰️</span> 
            Device GPS Location
          </h3>
          {lastUpdated && (
            <span className="gps-last-updated">
              📡 {getTimeAgo(lastUpdated)}
            </span>
          )}
        </div>
        <div className="gps-header-actions">
          <button 
            onClick={startWatching}
            className={`gps-watch-btn ${watchId ? 'active' : ''}`}
            title="Continuous GPS tracking"
          >
            {watchId ? '🟢 Live' : '⭕ Live Track'}
          </button>
          <button 
            onClick={getCurrentPosition} 
            disabled={tracking}
            className={`gps-refresh-btn ${tracking ? 'tracking' : ''}`}
          >
            {tracking ? '🛰️ Getting GPS...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* GPS Status Banner */}
      {location && (
        <div className="gps-status" style={{
          borderLeftColor: getAccuracyColor(location.accuracy)
        }}>
          <span>
            {location.source === 'gps' ? '🛰️' : '📡'} 
            GPS Accuracy: {location.accuracy}m - {getAccuracyLabel(location.accuracy)}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="gps-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="error-close">✕</button>
        </div>
      )}

      {/* Location Data */}
      {location && (
        <div className="gps-info">
          {/* GPS Coordinates */}
          <div className="gps-coords">
            <h4 className="section-title">🛰️ GPS Coordinates</h4>
            <div className="coord-item">
              <span className="coord-label">Latitude</span>
              <span className="coord-value">{location.lat.toFixed(7)}°</span>
            </div>
            <div className="coord-item">
              <span className="coord-label">Longitude</span>
              <span className="coord-value">{location.lng.toFixed(7)}°</span>
            </div>
            <div className="coord-item">
              <span className="coord-label">GPS Accuracy</span>
              <span 
                className="coord-value"
                style={{ color: getAccuracyColor(location.accuracy) }}
              >
                {location.accuracy}m
              </span>
            </div>
            {location.altitude !== null && (
              <div className="coord-item">
                <span className="coord-label">Altitude</span>
                <span className="coord-value">{location.altitude}m</span>
              </div>
            )}
            {location.speed !== null && (
              <div className="coord-item">
                <span className="coord-label">Speed</span>
                <span className="coord-value">{location.speed} km/h</span>
              </div>
            )}
            {location.heading !== null && (
              <div className="coord-item">
                <span className="coord-label">Heading</span>
                <span className="coord-value">{location.heading}°</span>
              </div>
            )}
            <div className="coord-item">
              <span className="coord-label">Source</span>
              <span className="coord-value" style={{ color: '#28a745' }}>
                🛰️ Device GPS
              </span>
            </div>
          </div>

          {/* Physical Address (from GPS coordinates) */}
          <div className="gps-address">
            <h4 className="section-title">📍 Physical Location</h4>
            <div className="address-details">
              {location.road && (
                <p><strong>🛣️ Street:</strong> {location.road}</p>
              )}
              <p><strong>🏙️ City:</strong> {location.city || 'Resolving...'}</p>
              <p><strong>🗺️ State:</strong> {location.state || 'Resolving...'}</p>
              <p><strong>🌍 Country:</strong> {location.country || 'Nigeria'}</p>
              <p className="full-address">
                <strong>📍 Full Address:</strong> {location.locationStr || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Google Map showing GPS position */}
      {location && (
        <div className={`gps-map ${mapExpanded ? 'expanded' : ''}`}>
          <div className="map-controls">
            <button 
              onClick={() => setMapExpanded(!mapExpanded)}
              className="map-expand-btn"
            >
              {mapExpanded ? '🔽 Minimize Map' : '🔼 Expand Map'}
            </button>
            <a
              href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="map-open-btn"
            >
              🗺️ Open in Google Maps
            </a>
          </div>
          <iframe
            src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=18&output=embed`}
            width="100%"
            height={mapExpanded ? '500' : '300'}
            style={{
              border: 'none',
              borderRadius: '8px',
              transition: 'height 0.3s ease'
            }}
            title="GPS Location Map"
            loading="lazy"
            allowFullScreen
          />
          <p className="map-note">
            🛰️ Position from device GPS • Accuracy: {location.accuracy}m • Not IP-based
          </p>
        </div>
      )}

      {/* Empty State */}
      {!location && !tracking && !error && (
        <div className="gps-empty">
          <div className="empty-icon">🛰️</div>
          <h3>GPS Location Required</h3>
          <p>Enable GPS on your device to share your precise location.</p>
          <p className="gps-note">
            This uses your device's GPS hardware, not your IP address.
          </p>
          <button onClick={getCurrentPosition} className="btn-gold">
            🛰️ Get GPS Location
          </button>
        </div>
      )}
    </div>
  );
}

export default GPSMap;