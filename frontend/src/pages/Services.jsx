import React from 'react';
import { Link } from 'react-router-dom';
import './StaticPages.css';

function Services() {
  const services = [
    { icon:'📄', title:'CV & Cover Letter Upgrade', desc:'Professional CV rewriting and cover letter crafting by experts.', price:'₦5,000' },
    { icon:'🎯', title:'Interview Preparation', desc:'Mock interviews with industry professionals and personalized feedback.', price:'₦10,000' },
    { icon:'📝', title:'Exam Preparation', desc:'Study materials, past questions, and tutoring for job entry exams.', price:'₦7,500' },
    { icon:'📜', title:'Certification Training', desc:'Professional certification courses to boost your employability.', price:'₦15,000' },
  ];

  return (
    <div className="static-page">
      <div className="page-hero"><h1>Our Services</h1><p>Professional development services to boost your career</p></div>
      <div className="page-content">
        <div className="grid-2">
          {services.map((s,i) => (
            <div key={i} className="service-card">
              <span className="service-icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <p className="service-price">{s.price}</p>
              <Link to="/signup" className="btn btn-gold">Get Started</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Services;