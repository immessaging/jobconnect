import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJobs, getTestimonials } from '../services/api';
import './Home.css';

// Import images
import adJobcon from '../assets/images/ad_jobcon.png';
import secureImg from '../assets/images/secure.png';
import trustImg from '../assets/images/trust.png';
import transparentImg from '../assets/images/transparent.png';
import commissionImg from '../assets/images/commission.png';
import highSecurityImg from '../assets/images/high_security.png';
import veriProcessImg from '../assets/images/veri_process.png';
import stepToTakeImg from '../assets/images/step_to_take.png';
import goodCustomercareImg from '../assets/images/good_customercare.png';

function Home() {
  const [stats, setStats] = useState({ jobs: 0 });
  const [testimonials, setTestimonials] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { img: adJobcon, title: 'Find Verified Jobs', text: 'Your dream job is just a click away' },
    { img: secureImg, title: '100% Secure', text: 'Your payments are protected with escrow' },
    { img: trustImg, title: 'Trusted Agents', text: 'Every agent is verified with NIN & BVN' },
    { img: transparentImg, title: 'Transparent Process', text: 'No hidden fees, full transparency' },
  ];

  useEffect(() => {
    getJobs().then(res => setStats({ jobs: res.data.count })).catch(console.log);
    getTestimonials().then(res => setTestimonials(res.data.testimonials || [])).catch(console.log);
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home">
      {/* Hero Section with Image Slideshow */}
      <section className="hero">
        <div className="hero-slideshow">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.img})` }}
            >
              <div className="hero-overlay"></div>
              <div className="hero-slide-content">
                <h2>{slide.title}</h2>
                <p>{slide.text}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="hero-content">
          <h1>Find <span className="gold-text">Verified Jobs</span> in Nigeria</h1>
          <p>Connect with trusted job agents. Every job is verified. Every agent is vetted with NIN, BVN, and biometric verification.</p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-red">Get Started Now</Link>
            <Link to="/jobs" className="btn btn-outline">Browse Jobs</Link>
          </div>
        </div>

        <div className="slide-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`slide-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        {/* HONEST Stats - No fake numbers */}
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
        <div className="steps-wrapper">
          <div className="steps-image-container">
            <img src={stepToTakeImg} alt="Steps to take" className="steps-main-image" />
          </div>
          <div className="steps">
            <div className="step"><div className="step-number">1</div><div className="step-icon">🔍</div><h3>Find a Job</h3><p>Browse verified job listings from trusted agents across Nigeria</p></div>
            <div className="step"><div className="step-number">2</div><div className="step-icon">📝</div><h3>Apply & Sign Agreement</h3><p>Review commission terms (5-35%) and sign the transparent agreement</p></div>
            <div className="step"><div className="step-number">3</div><div className="step-icon">💳</div><h3>Pay Commission</h3><p>One-time payment held in secure escrow for your protection</p></div>
            <div className="step"><div className="step-number">4</div><div className="step-icon">🎉</div><h3>Get the Job</h3><p>Commission released to agent only after you confirm employment</p></div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section features">
        <h2 className="section-title">Why <span className="gold-text">JobConnect?</span></h2>
        <p className="section-subtitle">Nigeria's most trusted job connection platform</p>
        <div className="feature-grid">
          <div className="feature-card"><img src={secureImg} alt="Verified Jobs" className="feature-card-img" /><h3>100% Verified Jobs</h3><p>Every job posting is verified by our team before it goes live. No fake jobs, no scams.</p></div>
          <div className="feature-card"><img src={highSecurityImg} alt="Secure Escrow" className="feature-card-img" /><h3>Secure Escrow</h3><p>Your commission is held safely until you confirm you've gotten the job at the agreed salary.</p></div>
          <div className="feature-card"><img src={trustImg} alt="Trusted Agents" className="feature-card-img" /><h3>Trusted Agents</h3><p>Agents verified with NIN, BVN, face recognition, fingerprint, and guarantor details.</p></div>
          <div className="feature-card"><img src={commissionImg} alt="Quality Jobs" className="feature-card-img" /><h3>Quality Jobs</h3><p>Only genuine, well-paying positions from verified organizations across Nigeria.</p></div>
          <div className="feature-card"><img src={transparentImg} alt="Transparent Fees" className="feature-card-img" /><h3>Transparent Fees</h3><p>5-35% commission. 83% to agent, 17% platform fee. No hidden charges.</p></div>
          <div className="feature-card"><img src={veriProcessImg} alt="Fast Process" className="feature-card-img" /><h3>Fast Process</h3><p>Apply, sign agreement, and pay commission in minutes. Start your new job journey today!</p></div>
        </div>
      </section>

      {/* Customer Care Section */}
      <section className="section customer-care">
        <div className="customer-care-grid">
          <div className="customer-care-image"><img src={goodCustomercareImg} alt="Customer Care" /></div>
          <div className="customer-care-content">
            <h2 className="section-title">Excellent <span className="gold-text">Customer Support</span></h2>
            <p>Our dedicated team is available to help you through every step of your job search journey.</p>
            <ul><li>📞 24/7 Phone Support</li><li>💬 Live Chat Assistance</li><li>📧 Email Response within 2 hours</li><li>⚖️ Dispute Resolution Team</li></ul>
          </div>
        </div>
      </section>

      {/* Built With Section */}
      <section className="section built-with">
        <h2 className="section-title">Built With <span className="gold-text">Trusted Technology</span></h2>
        <p className="section-subtitle">Open-source tools powering our transparent platform</p>
        <div className="built-with-grid">
          <div className="tech-card"><span className="tech-icon">⚛️</span><h4>React + Vite</h4><p>Modern frontend</p></div>
          <div className="tech-card"><span className="tech-icon">🐍</span><h4>Flask (Python)</h4><p>Backend API</p></div>
          <div className="tech-card"><span className="tech-icon">🗄️</span><h4>PostgreSQL</h4><p>Supabase Database</p></div>
          <div className="tech-card"><span className="tech-icon">▲</span><h4>Vercel + Render</h4><p>Cloud Hosting</p></div>
          <div className="tech-card"><span className="tech-icon">🏦</span><h4>Access Bank</h4><p>Escrow Payments</p></div>
          <div className="tech-card"><span className="tech-icon">🔓</span><h4>Open Source</h4><p>Transparent Code</p></div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section testimonials">
        <h2 className="section-title">What Our <span className="gold-text">Users Say</span></h2>
        <p className="section-subtitle">Real stories from real people who found jobs through JobConnect</p>
        <div className="testimonial-grid">
          {testimonials.length > 0 ? (
            testimonials.map(testimonial => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-header">
                  <div className="testimonial-avatar">{testimonial.name.charAt(0)}{testimonial.name.split(' ')[1]?.charAt(0) || ''}</div>
                  <div><h4>{testimonial.name}</h4><p className="testimonial-role">{testimonial.role} at {testimonial.company}</p></div>
                  <div className="testimonial-rating">{'⭐'.repeat(testimonial.rating)}</div>
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-badge"><span className="badge badge-gold">✓ Verified User</span></div>
              </div>
            ))
          ) : (
            <p className="loading-text">Loading testimonials...</p>
          )}
        </div>
      </section>

      {/* CTA Section */}
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