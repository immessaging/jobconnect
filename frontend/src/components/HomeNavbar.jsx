import React from 'react';
import { Link } from 'react-router-dom';

function HomeNavbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">🇳🇬 JobConnect</Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/jobs" className="nav-link">Find Jobs</Link>
          <Link to="/about" className="nav-link">About Us</Link>
          <Link to="/contact" className="nav-link">Contact Us</Link>
          <Link to="/services" className="nav-link">Services</Link>
          <div className="nav-dropdown">
            <span className="nav-link">Media ▾</span>
            <div className="dropdown-content">
              <Link to="/gallery">Gallery</Link>
              <Link to="/podcast">Podcast</Link>
              <Link to="/courses">Courses</Link>
            </div>
          </div>
          <Link to="/signup" className="nav-link">Sign Up</Link>
          <Link to="/signin" className="nav-link">Sign In</Link>
          <Link to="/dashboard/seeker" className="nav-link nav-btn">Dashboard</Link>
        </div>
      </div>
    </nav>
  );
}

export default HomeNavbar;