import React from 'react';
import './StaticPages.css';

function Podcast() {
  const episodes = [
    { title: 'Navigating Nigeria\'s Job Market', duration: '45 min', date: '2024-05-15' },
    { title: 'How to Spot Fake Job Adverts', duration: '30 min', date: '2024-05-10' },
    { title: 'Interview Success Tips', duration: '38 min', date: '2024-05-05' },
    { title: 'Career Growth Strategies', duration: '52 min', date: '2024-04-28' },
    { title: 'Financial Intelligence for Salary Earners', duration: '42 min', date: '2024-04-20' },
  ];

  return (
    <div className="static-page">
      <div className="page-hero">
        <h1>🎙️ Podcast</h1>
        <p>Career insights, job market trends, and professional development</p>
      </div>
      <div className="page-content">
        <div className="podcast-list">
          {episodes.map((ep, i) => (
            <div key={i} className="podcast-card">
              <div className="podcast-number">EP {i + 1}</div>
              <div className="podcast-info">
                <h3>{ep.title}</h3>
                <p>🕐 {ep.duration} | 📅 {ep.date}</p>
              </div>
              <button className="btn btn-gold">▶️ Play</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Podcast;