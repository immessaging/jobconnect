import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    // Check for admin login
    if (formData.email === 'admin@jobconnect.com' && formData.password === 'admin123') {
      setTimeout(() => {
        localStorage.setItem('user', JSON.stringify({ 
          email: formData.email, 
          type: 'super_admin' 
        }));
        navigate('/dashboard/admin');
        setLoading(false);
      }, 1000);
      return;
    }

    // Check for agent login
    if (formData.email === 'agent1@example.com' && formData.password === 'password123') {
      setTimeout(() => {
        localStorage.setItem('user', JSON.stringify({ 
          email: formData.email, 
          type: 'agent' 
        }));
        navigate('/dashboard/agent');
        setLoading(false);
      }, 1000);
      return;
    }

    // Check for job seeker login
    if (formData.email === 'seeker1@example.com' && formData.password === 'password123') {
      setTimeout(() => {
        localStorage.setItem('user', JSON.stringify({ 
          email: formData.email, 
          type: 'job_seeker' 
        }));
        navigate('/dashboard/seeker');
        setLoading(false);
      }, 1000);
      return;
    }

    // Regular user login
    setTimeout(() => {
      localStorage.setItem('user', JSON.stringify({ email: formData.email }));
      navigate('/dashboard/seeker');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-left">
          <div className="auth-image">👋</div>
          <h2>Welcome Back!</h2>
          <p>Sign in to your account to continue your job search journey with verified opportunities.</p>
          <div style={{marginTop: '20px', fontSize: '13px', opacity: '0.8'}}>
            
          </div>
        </div>

        <div className="auth-right">
          <h2>Sign In</h2>
          <p className="subtitle">Access your JobConnect account</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{textAlign: 'right', marginBottom: '15px'}}>
              <Link to="/reset-password" style={{color: '#d42027', fontSize: '13px', textDecoration: 'none'}}>
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-link">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;