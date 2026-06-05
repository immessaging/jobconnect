import React, { useState } from 'react';
import './StaticPages.css';

function Podcast() {
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const episodes = [
    { 
      id: 1,
      title: 'Navigating Nigeria\'s Job Market in 2024', 
      duration: '45 min', 
      date: '2024-05-15',
      host: 'Chukwu Emeka',
      guest: 'Dr. Amina Ibrahim (HR Expert)',
      description: 'Expert insights on the current Nigerian job landscape, emerging sectors, and how to position yourself for success.',
      category: 'Career',
      tags: ['job market', 'career', '2024 trends']
    },
    { 
      id: 2,
      title: 'How to Spot Fake Job Adverts & Scams', 
      duration: '30 min', 
      date: '2024-05-10',
      host: 'Chukwu Emeka',
      guest: 'DSP Oluwaseun Adeyemi (EFCC)',
      description: 'Learn to identify red flags in job postings, common scam tactics, and how JobConnect verifies listings.',
      category: 'Safety',
      tags: ['scams', 'safety', 'verification']
    },
    { 
      id: 3,
      title: 'Interview Success Tips from Hiring Managers', 
      duration: '38 min', 
      date: '2024-05-05',
      host: 'Chukwu Emeka',
      guest: 'Funke Adebayo (HR Director, Access Bank)',
      description: 'Top interview tips from those who hire. What Nigerian employers look for and how to stand out.',
      category: 'Interview',
      tags: ['interview', 'tips', 'preparation']
    },
    { 
      id: 4,
      title: 'Career Growth Strategies for Young Professionals', 
      duration: '52 min', 
      date: '2024-04-28',
      host: 'Ngozi Okonkwo',
      guest: 'Tunde Onakoya (Chess in Slums Founder)',
      description: 'Building a successful career in Nigeria: skills development, networking, and personal branding.',
      category: 'Career',
      tags: ['growth', 'skills', 'networking']
    },
    { 
      id: 5,
      title: 'Financial Intelligence for Salary Earners', 
      duration: '42 min', 
      date: '2024-04-20',
      host: 'Chukwu Emeka',
      guest: 'Kalu Aja (Financial Educator)',
      description: 'Managing your salary, saving, investing in Nigeria, and building wealth on a 9-5 income.',
      category: 'Finance',
      tags: ['money', 'savings', 'investment']
    },
    { 
      id: 6,
      title: 'Remote Work Opportunities for Nigerians', 
      duration: '35 min', 
      date: '2024-04-15',
      host: 'Ngozi Okonkwo',
      guest: 'David O. (Remote Work Advocate)',
      description: 'Finding legitimate remote jobs, platforms that pay Nigerians, and tools you need.',
      category: 'Remote',
      tags: ['remote work', 'online jobs', 'freelance']
    },
    { 
      id: 7,
      title: 'Agent vs Direct Application: Which is Better?', 
      duration: '28 min', 
      date: '2024-04-10',
      host: 'Chukwu Emeka',
      guest: 'Multiple Verified Agents',
      description: 'Understanding the role of job agents, commission structure, and when to use an agent.',
      category: 'Jobs',
      tags: ['agents', 'commission', 'job search']
    },
    { 
      id: 8,
      title: 'Nigerian Tech Ecosystem: Breaking In', 
      duration: '55 min', 
      date: '2024-04-05',
      host: 'Ngozi Okonkwo',
      guest: 'Ire Aderinokun (Tech Leader)',
      description: 'How to transition into tech, available bootcamps, and entry-level opportunities.',
      category: 'Tech',
      tags: ['tech', 'coding', 'career change']
    },
  ];

  const categories = [...new Set(episodes.map(ep => ep.category))];

  const filteredEpisodes = episodes.filter(ep => 
    ep.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ep.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ep.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePlay = (episodeId) => {
    setCurrentlyPlaying(currentlyPlaying === episodeId ? null : episodeId);
  };

  return (
    <div className="static-page">
      {/* Hero */}
      <div className="page-hero">
        <h1>🎙️ JobConnect Podcast</h1>
        <p>Career insights, job market trends, and professional development for Nigerians</p>
        
        {/* Search */}
        <div className="podcast-search">
          <input
            type="text"
            placeholder="🔍 Search episodes by title, topic, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="podcast-search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="podcast-search-clear">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Categories */}
        <div className="podcast-categories">
          <button 
            className={`category-btn ${!searchTerm ? 'active' : ''}`}
            onClick={() => setSearchTerm('')}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-btn ${searchTerm === cat ? 'active' : ''}`}
              onClick={() => setSearchTerm(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Episodes List */}
        <div className="podcast-list">
          {filteredEpisodes.length === 0 ? (
            <div className="no-episodes">
              <p>🎧 No episodes found. Try a different search.</p>
              <button onClick={() => setSearchTerm('')} className="btn btn-gold">Clear Search</button>
            </div>
          ) : (
            filteredEpisodes.map((ep, i) => (
              <div 
                key={ep.id} 
                className={`podcast-card ${currentlyPlaying === ep.id ? 'playing' : ''}`}
              >
                <div className="podcast-number">
                  <span className="ep-number">EP {filteredEpisodes.length - i}</span>
                  <span className="ep-category">{ep.category}</span>
                </div>
                
                <div className="podcast-info">
                  <h3>{ep.title}</h3>
                  <div className="podcast-meta">
                    <span>🕐 {ep.duration}</span>
                    <span>📅 {ep.date}</span>
                    <span>🎤 {ep.host}</span>
                  </div>
                  {ep.guest && (
                    <p className="podcast-guest">👤 Guest: <strong>{ep.guest}</strong></p>
                  )}
                  
                  {currentlyPlaying === ep.id && (
                    <div className="podcast-expanded">
                      <p className="podcast-description">{ep.description}</p>
                      
                      {/* Audio Player */}
                      <div className="audio-player">
                        <div className="player-controls">
                          <button className="player-btn">⏮️</button>
                          <button className="player-btn play-btn">▶️</button>
                          <button className="player-btn">⏭️</button>
                        </div>
                        <div className="player-progress">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{width: '0%'}}></div>
                          </div>
                          <div className="progress-time">
                            <span>0:00</span>
                            <span>{ep.duration}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div className="podcast-tags">
                        {ep.tags.map(tag => (
                          <span key={tag} className="podcast-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="podcast-actions">
                  <button 
                    className={`btn btn-gold play-btn ${currentlyPlaying === ep.id ? 'playing' : ''}`}
                    onClick={() => handlePlay(ep.id)}
                  >
                    {currentlyPlaying === ep.id ? '⏸️ Pause' : '▶️ Play'}
                  </button>
                  <button className="btn btn-outline download-btn">
                    ⬇️
                  </button>
                  <button className="btn btn-outline share-btn">
                    🔗
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Newsletter CTA */}
        <div className="podcast-newsletter">
          <h3>📧 Never Miss an Episode</h3>
          <p>Subscribe to get new episodes delivered to your inbox weekly.</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email" className="newsletter-input" />
            <button className="btn btn-red">Subscribe</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Podcast;