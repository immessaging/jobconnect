import React from 'react';
import { Link } from 'react-router-dom';
import './StaticPages.css';

function About() {
  return (
    <div className="static-page">
      {/* Hero Section */}
      <div className="page-hero">
        <h1>About JobConnect Nigeria</h1>
        <p>Nigeria's Most Trusted Verified Job Connection Platform</p>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="stat-number">100%</span>
            <span className="stat-label">Verified Agents</span>
          </div>
          <div className="hero-stat">
            <span className="stat-number">83%</span>
            <span className="stat-label">Agent Commission</span>
          </div>
          <div className="hero-stat">
            <span className="stat-number">21-Day</span>
            <span className="stat-label">Money-Back Guarantee</span>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Mission & Vision */}
        <section className="about-section">
          <div className="about-grid">
            <div className="about-card">
              <div className="about-icon">🎯</div>
              <h2>Our Mission</h2>
              <p>
                To eliminate fake job postings and connect qualified Nigerians with 
                verified job opportunities through trusted, vetted agents. We believe 
                every Nigerian deserves access to genuine employment without fear of scams.
              </p>
            </div>
            <div className="about-card">
              <div className="about-icon">🔭</div>
              <h2>Our Vision</h2>
              <p>
                To become Africa's leading transparent job marketplace where every listing 
                is verified, every agent is vetted, and every transaction is secure. 
                Building trust in Nigeria's job market, one placement at a time.
              </p>
            </div>
          </div>
        </section>

        {/* The Problem We Solve */}
        <section className="about-section problem-section">
          <h2>🇳🇬 The Problem We're Solving</h2>
          <div className="problem-grid">
            <div className="problem-card">
              <span className="problem-icon">🚫</span>
              <h4>Fake Job Listings</h4>
              <p>Thousands of Nigerians fall victim to fake job postings yearly. We verify every listing.</p>
            </div>
            <div className="problem-card">
              <span className="problem-icon">💰</span>
              <h4>Untrusted Agents</h4>
              <p>Unverified agents collect fees without delivering. Our agents are verified with NIN, BVN & biometrics.</p>
            </div>
            <div className="problem-card">
              <span className="problem-icon">🔒</span>
              <h4>No Payment Protection</h4>
              <p>Job seekers lose money to fraudulent agents. We hold all payments in secure escrow.</p>
            </div>
            <div className="problem-card">
              <span className="problem-icon">📋</span>
              <h4>Lack of Transparency</h4>
              <p>Hidden fees and unclear terms. We show exactly where every naira goes.</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="about-section">
          <h2>🔄 How JobConnect Works</h2>
          <div className="steps-vertical">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Agents Post Verified Jobs</h4>
                <p>Vetted agents post job listings with full details - salary, requirements, and commission structure.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Job Seekers Browse & Apply</h4>
                <p>Browse verified listings, sign the commission agreement, and pay the one-time commission.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Payment Held in Escrow</h4>
                <p>Your payment is securely held. Agent only gets paid after you confirm starting the job.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Get Hired & Release Payment</h4>
                <p>Start your new job, then release the commission to the agent from your dashboard.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="about-section">
          <h2>💎 Our Core Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🛡️</div>
              <h4>Trust & Verification</h4>
              <p>Every agent undergoes NIN, BVN, biometric, and address verification before listing jobs.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🔍</div>
              <h4>Complete Transparency</h4>
              <p>83% goes to the agent, 17% to the platform. No hidden fees, no surprises. Full breakdown provided.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🔒</div>
              <h4>Payment Security</h4>
              <p>All payments held in escrow. Refund available within 21 days if job is not secured.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">📊</div>
              <h4>Accountability</h4>
              <p>Full audit trail on all transactions. Every agreement digitally signed and timestamped.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h4>Fair Commission</h4>
              <p>Agents set their commission (5-35%). Job seekers know exactly what they're paying upfront.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🇳🇬</div>
              <h4>Built for Nigeria</h4>
              <p>Designed specifically for the Nigerian job market. Supports NIN, BVN, and local banks.</p>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="about-section tech-section">
          <h2>🛠️ Built With Trusted Technology</h2>
          <p className="section-subtitle">Our platform is built on modern, secure, and reliable technology</p>
          <div className="tech-grid">
            <div className="tech-card">
              <span className="tech-icon">⚛️</span>
              <strong>React + Vite</strong>
              <p>Modern, fast frontend framework</p>
            </div>
            <div className="tech-card">
              <span className="tech-icon">🐍</span>
              <strong>Flask (Python)</strong>
              <p>Reliable, secure backend API</p>
            </div>
            <div className="tech-card">
              <span className="tech-icon">🗄️</span>
              <strong>PostgreSQL + Supabase</strong>
              <p>Enterprise-grade secure database</p>
            </div>
            <div className="tech-card">
              <span className="tech-icon">▲</span>
              <strong>Vercel + Render</strong>
              <p>Global cloud hosting infrastructure</p>
            </div>
            <div className="tech-card">
              <span className="tech-icon">🔐</span>
              <strong>SSL/TLS Encryption</strong>
              <p>Bank-grade security for all data</p>
            </div>
            <div className="tech-card">
              <span className="tech-icon">🔓</span>
              <strong>Open Source</strong>
              <p>Transparent codebase on GitHub</p>
            </div>
          </div>
          <p className="github-link">
            View our code: {' '}
            <a href="https://github.com/immessaging/jobconnect" target="_blank" rel="noreferrer">
              github.com/immessaging/jobconnect
            </a>
          </p>
        </section>

        {/* Commission Transparency */}
        <section className="about-section commission-section">
          <h2>💰 Transparent Commission Structure</h2>
          <p className="section-subtitle">We believe in complete transparency. Here's exactly how commissions work:</p>
          <div className="commission-breakdown-about">
            <div className="breakdown-visual">
              <div className="breakdown-bar">
                <div className="bar-segment agent" style={{width: '83%'}}>
                  <span>Agent: 83%</span>
                </div>
                <div className="bar-segment platform" style={{width: '17%'}}>
                  <span>Platform: 17%</span>
                </div>
              </div>
            </div>
            <ul className="breakdown-notes">
              <li>✅ Agent sets commission percentage (5-35% of first month salary)</li>
              <li>✅ Of that commission: 83% goes to the agent, 17% to the platform</li>
              <li>✅ Job seeker pays ONLY the commission - no hidden charges</li>
              <li>✅ Commission is a ONE-TIME payment, not monthly</li>
              <li>✅ Payment held in escrow until job seeker confirms employment</li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="about-section cta-section">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of Nigerians finding verified jobs through trusted agents.</p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn btn-red">Create Free Account</Link>
            <Link to="/jobs" className="btn btn-gold">Browse Verified Jobs</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;