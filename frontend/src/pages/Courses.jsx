import React from 'react';
import { Link } from 'react-router-dom';
import './StaticPages.css';

function Courses() {
  const courses = [
    { icon:'🧠', title:'Mental Health at Work', desc:'Managing stress, anxiety, and building resilience', price:'Free', category:'Wellness' },
    { icon:'⚖️', title:'Work & Family Life Balance', desc:'Strategies for balancing career and family', price:'₦3,000', category:'Lifestyle' },
    { icon:'💰', title:'Financial Intelligence', desc:'Budgeting, saving, and smart money management', price:'₦5,000', category:'Finance' },
    { icon:'🏢', title:'Business Fundamentals', desc:'Starting and growing your own business', price:'₦7,500', category:'Business' },
    { icon:'📈', title:'Investment for Salary Earners', desc:'Building wealth through smart investments', price:'₦10,000', category:'Investment' },
    { icon:'🏖️', title:'Retirement Planning', desc:'Secure your future with proper retirement planning', price:'₦8,000', category:'Finance' },
  ];

  return (
    <div className="static-page">
      <div className="page-hero">
        <h1>📚 Courses</h1>
        <p>Professional development and life skills for career success</p>
      </div>
      <div className="page-content">
        <div className="course-grid">
          {courses.map((c, i) => (
            <div key={i} className="service-card">
              <span className="service-icon">{c.icon}</span>
              <span className="badge badge-gold" style={{marginBottom:'8px'}}>{c.category}</span>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <p className="service-price">{c.price}</p>
              <Link to="/signup" className="btn btn-gold">Enroll Now</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Courses;