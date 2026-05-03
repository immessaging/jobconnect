import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJobs, getTestimonials } from '../services/api';
import './Home.css';

function Home() {
  const [stats, setStats] = useState({ jobs: 0 });
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    getJobs().then(res => setStats({ jobs: res.data.count })).catch(console.log);
    getTestimonials().then(res => setTestimonials(res.data.testimonials || [])).catch(console.log);
  }, []);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Find <span className="gold-text">Verified Jobs</span> in Nigeria</h1>
          <p>Connect with trusted job agents. Every job is verified. Every agent is vetted with NIN, BVN, and biometric verification.</p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-red">Get Started Now</Link>
            <Link to="/jobs" className="btn btn-outline">Browse Jobs</Link>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card"><span className="stat-icon">💼</span><h3>{stats.jobs}</h3><p>Active Jobs</p></div>
          <div className="stat-card"><span className="stat-icon">✓</span><h3>100%</h3><p>Verified</p></div>
          <div className="stat-card"><span className="stat-icon">🔒</span><h3>Secure</h3><p>Escrow Protection</p></div>
          <div className="stat-card"><span className="stat-icon">🛡️</span><h3>Trusted</h3><p>Transparent Process</p></div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section how-it-works">
        <h2 className="section-title">How It <span className="gold-text">Works</span></h2>
        <p className="section-subtitle">Get your dream job in 4 simple steps</p>
        <div className="steps">
          <div className="step"><div className="step-number">1</div><h3>Find a Job</h3><p>Browse verified job listings from trusted agents across Nigeria</p></div>
          <div className="step"><div className="step-number">2</div><h3>Apply & Sign Agreement</h3><p>Review commission terms (5-35%) and sign the transparent agreement</p></div>
          <div className="step"><div className="step-number">3</div><h3>Pay Commission</h3><p>One-time payment held in secure escrow for your protection</p></div>
          <div className="step"><div className="step-number">4</div><h3>Get the Job</h3><p>Commission released to agent only after you confirm employment</p></div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section features">
        <h2 className="section-title">Why <span className="gold-text">JobConnect?</span></h2>
        <p className="section-subtitle">Nigeria's most trusted job connection platform</p>
        <div className="feature-grid">
          <div className="feature-card"><span className="feature-icon">🛡️</span><h3>100% Verified Jobs</h3><p>Every job posting is verified by our team before it goes live. No fake jobs, no scams.</p></div>
          <div className="feature-card"><span className="feature-icon">🔒</span><h3>Secure Escrow</h3><p>Your commission is held safely until you confirm you've gotten the job.</p></div>
          <div className="feature-card"><span className="feature-icon">🤝</span><h3>Trusted Agents</h3><p>Agents verified with NIN, BVN, face recognition, fingerprint, and guarantor details.</p></div>
          <div className="feature-card"><span className="feature-icon">💼</span><h3>Quality Jobs</h3><p>Only genuine, well-paying positions from verified organizations across Nigeria.</p></div>
          <div className="feature-card"><span className="feature-icon">💰</span><h3>Transparent Fees</h3><p>5-35% commission. 83% to agent, 17% platform fee. No hidden charges.</p></div>
          <div className="feature-card"><span className="feature-icon">⚡</span><h3>Fast Process</h3><p>Apply, sign, and pay in minutes. Start your new job journey today!</p></div>
        </div>
      </section>

      {/* Built With Section */}
      <section className="section built-with">
        <h2 className="section-title">Built With <span className="gold-text">Trusted Technology</span></h2>
        <p className="section-subtitle">Open-source tools powering our transparent platform</p>
        <div className="built-with-grid">
          <div className="tech-card"><span className="tech-icon">⚛️</span><h4>React + Vite</h4><p>Modern Frontend</p></div>
          <div className="tech-card"><span className="tech-icon">🐍</span><h4>Flask (Python)</h4><p>Backend API</p></div>
          <div className="tech-card"><span className="tech-icon">🗄️</span><h4>PostgreSQL</h4><p>Supabase Database</p></div>
          <div className="tech-card"><span className="tech-icon">▲</span><h4>Vercel + Render</h4><p>Cloud Hosting</p></div>
          <div className="tech-card"><span className="tech-icon">🏦</span><h4>Access Bank</h4><p>Escrow Payments</p></div>
          <div className="tech-card"><span className="tech-icon">🔓</span><h4>Open Source</h4><p>Transparent Code</p></div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section testimonials">
        <h2 className="section-title">What Our <span className="gold-text">Users Say</span></h2>
        <p className="section-subtitle">Real stories from real people who found jobs through JobConnect</p>
        <div className="testimonial-grid">
          {testimonials.length > 0 ? testimonials.map(t => (
            <div key={t.id} className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">{t.name.charAt(0)}{t.name.split(' ')[1]?.charAt(0)||''}</div>
                <div><h4>{t.name}</h4><p className="testimonial-role">{t.role} at {t.company}</p></div>
                <div className="testimonial-rating">{'⭐'.repeat(t.rating)}</div>
              </div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-badge"><span className="badge badge-gold">✓ Verified User</span></div>
            </div>
          )) : <p className="loading-text">Be the first to share your success story!</p>}
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="cta-content">
          <h2>Ready to Find Your <span className="gold-text">Dream Job?</span></h2>
          <p>Join verified job seekers who trust our transparent process</p>
          <Link to="/signup" className="btn btn-red">Get Started Now - It's Free</Link>
        </div>
      </section>
    </div>
  );
}

export default Home;