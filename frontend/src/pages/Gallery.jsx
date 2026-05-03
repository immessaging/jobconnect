import React from 'react';
import './StaticPages.css';

function Gallery() {
  const images = [
    { title: 'Job Fair 2024', desc: 'JobConnect at Lagos Job Fair', icon: '📸' },
    { title: 'Agent Training', desc: 'Verified agents training session', icon: '🤝' },
    { title: 'Success Stories', desc: 'Job seekers who found jobs through us', icon: '🎉' },
    { title: 'Office Headquarters', desc: 'Our Lagos office', icon: '🏢' },
    { title: 'Community Outreach', desc: 'Connecting communities to jobs', icon: '🏘️' },
    { title: 'Award Ceremony', desc: 'Best Job Platform 2024', icon: '🏆' },
  ];

  return (
    <div className="static-page">
      <div className="page-hero">
        <h1>Gallery</h1>
        <p>Moments from our journey connecting Nigerians to verified jobs</p>
      </div>
      <div className="page-content">
        <div className="gallery-grid">
          {images.map((img, i) => (
            <div key={i} className="gallery-card">
              <div className="gallery-placeholder">{img.icon}</div>
              <h3>{img.title}</h3>
              <p>{img.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Gallery;