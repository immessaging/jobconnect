import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
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

// ============================================
// PROTECTED ROUTE COMPONENT
// ============================================
function ProtectedRoute({ children, allowedTypes }) {
  const location = useLocation();
  const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
  
  if (!userData) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  try {
    const user = JSON.parse(userData);
    
    // Check user type if specified
    if (allowedTypes && !allowedTypes.includes(user.user_type)) {
      // Redirect to correct dashboard
      if (user.user_type === 'agent') return <Navigate to="/dashboard/agent" replace />;
      if (user.user_type === 'super_admin' || user.email === 'admin@jobconnect.com') return <Navigate to="/dashboard/admin" replace />;
      if (user.user_type === 'staff') return <Navigate to="/dashboard/staff" replace />;
      return <Navigate to="/dashboard/seeker" replace />;
    }
    
    return children;
  } catch {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    return <Navigate to="/signin" replace />;
  }
}

// ============================================
// NAVIGATION COMPONENT
// ============================================
function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mediaDropdownOpen, setMediaDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);

  // Check for logged in user
  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser(null);
      }
    }
  }, [location]);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMediaDropdownOpen(false);
  }, [location]);

  const isActive = (path) => location.pathname === path ? 'active' : '';
  const isDashboard = location.pathname.startsWith('/dashboard');

  // Don't show nav on dashboard pages
  if (isDashboard) return null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  const getDashboardLink = () => {
    if (!user) return '/signin';
    if (user.user_type === 'agent') return '/dashboard/agent';
    if (user.user_type === 'super_admin' || user.email === 'admin@jobconnect.com') return '/dashboard/admin';
    if (user.user_type === 'staff') return '/dashboard/staff';
    return '/dashboard/seeker';
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <img src={logoImg} alt="JobConnect" className="nav-logo-img" />
          <span>JobConnect</span>
        </Link>

        {/* Mobile Menu Toggle */}
        <button 
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Nav Links */}
        <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
          <Link to="/jobs" className={`nav-link ${isActive('/jobs')}`}>Find Jobs</Link>
          <Link to="/about" className={`nav-link ${isActive('/about')}`}>About Us</Link>
          <Link to="/contact" className={`nav-link ${isActive('/contact')}`}>Contact Us</Link>
          <Link to="/services" className={`nav-link ${isActive('/services')}`}>Services</Link>
          
          {/* Media Dropdown */}
          <div 
            className="nav-dropdown"
            onMouseEnter={() => setMediaDropdownOpen(true)}
            onMouseLeave={() => setMediaDropdownOpen(false)}
          >
            <span className={`nav-link ${mediaDropdownOpen ? 'active' : ''}`}>
              Media ▾
            </span>
            <div className={`dropdown-content ${mediaDropdownOpen ? 'show' : ''}`}>
              <Link to="/gallery">📸 Gallery</Link>
              <Link to="/podcast">🎙️ Podcast</Link>
              <Link to="/courses">📚 Courses</Link>
            </div>
          </div>

          {/* Auth Links */}
          {user ? (
            <>
              <Link to={getDashboardLink()} className="nav-link nav-dashboard">
                📊 Dashboard
              </Link>
              <button onClick={handleLogout} className="nav-link nav-logout">
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signup" className={`nav-link nav-signup ${isActive('/signup')}`}>
                Sign Up
              </Link>
              <Link to="/signin" className={`nav-link nav-signin ${isActive('/signin')}`}>
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ============================================
// FOOTER COMPONENT
// ============================================
function Footer() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  
  // Don't show footer on dashboard pages
  if (isDashboard) return null;

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>JobConnect Nigeria</h3>
          <p>Verified Jobs Through Trusted Agents</p>
          <p style={{fontSize:'13px',marginTop:'10px'}}>
            Nigeria's most trusted platform connecting job seekers with verified opportunities through vetted agents.
          </p>
          <div className="footer-social">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">📘</a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">🐦</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">📷</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">💼</a>
          </div>
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
          <Link to="/reset-password">Reset Password</Link>
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
          <Link to="/privacy">Privacy Policy</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} JobConnect Nigeria. All rights reserved. |{' '}
          <Link to="/privacy">Privacy Policy</Link> |{' '}
          <Link to="/terms">Terms of Service</Link> |{' '}
          <Link to="/refund">Refund Policy</Link>
        </p>
      </div>
    </footer>
  );
}

// ============================================
// SCROLL TO TOP COMPONENT
// ============================================
function ScrollToTop() {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

// ============================================
// APP COMPONENT
// ============================================
function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="App">
        <Navigation />
        
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
              <ProtectedRoute allowedTypes={['job_seeker']}>
                <JobSeekerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/agent" element={
              <ProtectedRoute allowedTypes={['agent']}>
                <AgentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/admin" element={
              <ProtectedRoute allowedTypes={['super_admin', 'admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/staff" element={
              <ProtectedRoute allowedTypes={['staff']}>
                <StaffDashboard />
              </ProtectedRoute>
            } />
            
            {/* 404 Page */}
            <Route path="*" element={
              <div style={{
                textAlign: 'center',
                padding: '100px 20px',
                minHeight: '60vh'
              }}>
                <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🔍</div>
                <h1>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <Link to="/" style={{
                  display: 'inline-block',
                  marginTop: '20px',
                  padding: '12px 24px',
                  background: '#d4a843',
                  color: '#0a1628',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold'
                }}>
                  ← Back to Home
                </Link>
              </div>
            } />
          </Routes>
        </main>

        <Footer />
        <CookieConsent />
      </div>
    </Router>
  );
}

export default App;