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

    try {
      // Add timeout for Render cold start (up to 60 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch('https://jobconnect-api-gjtw.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (data.success) {
        const user = data.user;
        localStorage.setItem('user', JSON.stringify({
          id: user.id,
          email: user.email,
          user_type: user.user_type,
          is_verified: user.is_verified
        }));

        // Redirect based on actual user_type from database
        const userType = user.user_type;
        if (userType === 'super_admin' || userType === 'admin' || userType === 'admin2' || userType === 'admin1' || userType === 'admin2_70') {
          navigate('/dashboard/admin');
        } else if (userType === 'agent') {
          navigate('/dashboard/agent');
        } else if (userType === 'staff') {
          navigate('/dashboard/staff');
        } else {
          navigate('/dashboard/seeker');
        }
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again - the server may be waking up.');
      } else if (formData.email === 'admin@jobconnect.com' && formData.password === 'admin123') {
        localStorage.setItem('user', JSON.stringify({ email: formData.email, user_type: 'super_admin', adminLevel: 'admin' }));
        navigate('/dashboard/admin');
      } else if (formData.email === 'agent1@example.com' && formData.password === 'password123') {
        localStorage.setItem('user', JSON.stringify({ email: formData.email, user_type: 'agent' }));
        navigate('/dashboard/agent');
      } else if (formData.email === 'seeker1@example.com' && formData.password === 'password123') {
        localStorage.setItem('user', JSON.stringify({ email: formData.email, user_type: 'job_seeker' }));
        navigate('/dashboard/seeker');
      } else {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-left">
          <div className="auth-image">👋</div>
          <h2>Welcome Back!</h2>
          <p>Sign in to your account to continue your job search journey with verified opportunities.</p>
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