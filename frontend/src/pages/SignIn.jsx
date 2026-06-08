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

    if (!formData.email.trim()) { setError('Please enter your email address'); return; }
    if (!formData.email.includes('@')) { setError('Please enter a valid email address'); return; }
    if (!formData.password) { setError('Please enter your password'); return; }

    setLoading(true);

    try {
      const res = await fetch('https://jobconnect-api-gjtw.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase(), password: formData.password })
      });

      const data = await res.json();

      // Handle nested API response: { data: { user: {...} }, success: true }
      const user = data.data?.user || data.user;

      if (data.success && user) {
        const userToStore = {
          id: user.id,
          email: user.email,
          user_type: user.user_type,
          is_verified: user.is_verified || false,
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
        setError(data.error || 'Invalid email or password.');
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
          <p>Sign in to access verified jobs.</p>
        </div>
        <div className="auth-right">
          <h2>Sign In</h2>
          <p className="subtitle">Access your JobConnect account</p>
          {error && <div className="error-message">⚠️ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="your@email.com" value={formData.email} onChange={handleChange} required autoFocus />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</button>
          </form>
          <div className="demo-accounts">
            <details>
              <summary>🔑 Demo Accounts</summary>
              <div className="demo-accounts-list">
                <div><strong>Admin:</strong> admin@jobconnect.com / JobC@Admin01</div>
                <div><strong>Agent:</strong> agent1@example.com / password123</div>
              </div>
            </details>
          </div>
          <div className="auth-link">Don't have an account? <Link to="/signup">Sign Up Now</Link></div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;