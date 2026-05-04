import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import ResetPassword from './pages/ResetPassword';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import Podcast from './pages/Podcast';
import Courses from './pages/Courses';
import Privacy from './pages/Privacy';
import CookieConsent from './components/CookieConsent';
import logoImg from './assets/images/job_connect_logo.png';

// Protected Route Component
function ProtectedRoute({ children }) {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navigation Bar */}
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <img src={logoImg} alt="JobConnect" className="nav-logo-img" />
              <span>JobConnect</span>
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/jobs" className="nav-link">Find Jobs</Link>
              <Link to="/about" className="nav-link">About Us</Link>
              <Link to="/contact" className="nav-link">Contact Us</Link>
              <Link to="/services" className="nav-link">Services</Link>
              
              {/* Media Dropdown */}
              <div className="nav-dropdown">
                <span className="nav-link">Media ▾</span>
                <div className="dropdown-content">
                  <Link to="/gallery">📸 Gallery</Link>
                  <Link to="/podcast">🎙️ Podcast</Link>
                  <Link to="/courses">📚 Courses</Link>
                </div>
              </div>
              
              <Link to="/signup" className="nav-link">Sign Up</Link>
              <Link to="/signin" className="nav-link">Sign In</Link>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <main className="main-content">
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Services />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/podcast" element={<Podcast />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/privacy" element={<Privacy />} />
            
            {/* Protected Dashboard Routes */}
            <Route path="/dashboard/seeker" element={
              <ProtectedRoute><JobSeekerDashboard /></ProtectedRoute>
            } />
            <Route path="/dashboard/agent" element={
              <ProtectedRoute><AgentDashboard /></ProtectedRoute>
            } />
            <Route path="/dashboard/admin" element={
              <ProtectedRoute><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/dashboard/staff" element={
              <ProtectedRoute><StaffDashboard /></ProtectedRoute>
            } />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-section">
              <h3>JobConnect Nigeria</h3>
              <p>Verified Jobs Through Trusted Agents</p>
              <p style={{fontSize:'13px',marginTop:'10px'}}>
                Nigeria's most trusted platform connecting job seekers with verified opportunities through vetted agents.
              </p>
            </div>
            <div className="footer-section">
              <h4>For Job Seekers</h4>
              <Link to="/jobs">Browse Jobs</Link>
              <Link to="/signup">Create Account</Link>
              <Link to="/signin">Sign In</Link>
              <Link to="/services">Our Services</Link>
              <Link to="/courses">Courses</Link>
            </div>
            <div className="footer-section">
              <h4>For Agents</h4>
              <Link to="/signup">Register as Agent</Link>
              <Link to="/signin">Agent Login</Link>
              <Link to="/dashboard/agent">Agent Dashboard</Link>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact Us</Link>
              <Link to="/gallery">Gallery</Link>
              <Link to="/podcast">Podcast</Link>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <p>📧 eitsolutions556@gmail.com</p>
              <p>📞 +2348163464557</p>
              <p>📍 Lagos, Nigeria</p>
              <Link to="/reset-password">Reset Password</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 JobConnect Nigeria. All rights reserved. | <Link to="/privacy">Privacy Policy</Link> | Terms of Service | Refund Policy</p>
          </div>
        </footer>

        {/* Cookie Consent Banner */}
        <CookieConsent />
      </div>
    </Router>
  );
}

export default App;