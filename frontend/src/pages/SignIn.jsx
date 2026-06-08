import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.user_type === 'agent') navigate('/dashboard/agent');
        else if (user.user_type === 'super_admin' || user.email === 'admin@jobconnect.com') navigate('/dashboard/admin');
        else if (user.user_type === 'staff') navigate('/dashboard/staff');
        else navigate('/dashboard/seeker');
      } catch (e) {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!formData.password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('https://jobconnect-api-gjtw.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ 
    email: formData.email.trim().toLowerCase(), 
    password: formData.password 
})
      const data = await res.json();

      if (data.success && data.user) {
        const user = data.user;
        
        const userToStore = {
          id: user.id,
          email: user.email,
          user_type: user.user_type,
          is_verified: user.is_verified || false,
          verification_status: user.verification_status || 'pending',
          adminLevel: user.email === 'admin@jobconnect.com' ? 'admin' : user.adminLevel
        };

        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify(userToStore));
        } else {
          sessionStorage.setItem('user', JSON.stringify(userToStore));
        }

        console.log('✅ Login successful:', user.email, '| Type:', user.user_type);

        if (user.user_type === 'agent') {
          navigate('/dashboard/agent');
        } else if (user.user_type === 'super_admin' || user.email === 'admin@jobconnect.com') {
          navigate('/dashboard/admin');
        } else if (user.user_type === 'staff') {
          navigate('/dashboard/staff');
        } else {
          navigate('/dashboard/seeker');
        }
      } else {
        setError(data.error || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-left">
          <div className="auth-image">👋</div>
          <h2>Welcome Back!</h2>
          <p>Sign in to your account to access verified jobs and manage your applications.</p>
        </div>

        <div className="auth-right">
          <h2>Sign In</h2>
          <p className="subtitle">Access your JobConnect account</p>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
              <button onClick={() => setError('')} className="error-close">✕</button>
            </div>
          )}

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
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/reset-password" className="forgot-password">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="demo-accounts">
            <details>
              <summary>🔑 Demo Accounts (Click to expand)</summary>
              <div className="demo-accounts-list">
                <div className="demo-account">
                  <strong>Admin:</strong> admin@jobconnect.com / admin123
                </div>
                <div className="demo-account">
                  <strong>Agent:</strong> agent1@example.com / password123
                </div>
                <div className="demo-account">
                  <strong>Seeker:</strong> seeker1@example.com / password123
                </div>
              </div>
            </details>
          </div>

          <div className="auth-link">
            Don't have an account? <Link to="/signup">Sign Up Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;