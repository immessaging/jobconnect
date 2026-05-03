import React from 'react';
import './StaticPages.css';

function About() {
  return (
    <div className="static-page">
      <div className="page-hero">
        <h1>About JobConnect Nigeria</h1>
        <p>Nigeria's Most Trusted Verified Job Connection Platform</p>
      </div>
      <div className="page-content">
        <section>
          <h2>Our Mission</h2>
          <p>To eliminate fake job postings and connect qualified Nigerians with verified job opportunities through trusted, vetted agents.</p>
        </section>
        <section>
          <h2>Our Vision</h2>
          <p>To become Africa's leading transparent job marketplace where every listing is verified and every transaction is secure.</p>
        </section>
        <section>
          <h2>Our Values</h2>
          <ul>
            <li><strong>Trust:</strong> Every agent verified with NIN, BVN, biometrics</li>
            <li><strong>Transparency:</strong> 83% to agent, 17% platform - No hidden fees</li>
            <li><strong>Security:</strong> Escrow-protected payments</li>
            <li><strong>Accountability:</strong> Full audit trail on all transactions</li>
          </ul>
        </section>
        <section>
          <h2>Built With Trusted Technology</h2>
          <div className="built-with-grid-about">
            <div className="tech-item"><span>⚛️</span> <strong>React + Vite</strong> - Modern frontend framework</div>
            <div className="tech-item"><span>🐍</span> <strong>Flask (Python)</strong> - Reliable backend API</div>
            <div className="tech-item"><span>🗄️</span> <strong>PostgreSQL + Supabase</strong> - Secure database</div>
            <div className="tech-item"><span>▲</span> <strong>Vercel + Render</strong> - Cloud hosting (free tier)</div>
            <div className="tech-item"><span>🏦</span> <strong>Access Bank</strong> - Escrow payment processing</div>
            <div className="tech-item"><span>🔓</span> <strong>Open Source</strong> - Transparent codebase on GitHub</div>
          </div>
          <p style={{marginTop:'15px'}}>
            View our code: <a href="https://github.com/immessaging/jobconnect" target="_blank" rel="noreferrer" style={{color:'#d4a843'}}>github.com/immessaging/jobconnect</a>
          </p>
        </section>
      </div>
    </div>
  );
}

export default About;