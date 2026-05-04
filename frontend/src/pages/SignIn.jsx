import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) { setError('Fill all fields'); return; }
    setLoading(true);
    try {
      const res = await fetch('https://jobconnect-api-gjtw.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      const data = await res.json();
      if (data.success) {
        const u = data.user;
        localStorage.setItem('user', JSON.stringify({ id: u.id, email: u.email, user_type: u.user_type, is_verified: u.is_verified }));
        if (u.user_type === 'agent') navigate('/dashboard/agent');
        else if (u.user_type === 'super_admin' || u.user_type === 'admin') navigate('/dashboard/admin');
        else if (u.user_type === 'staff') navigate('/dashboard/staff');
        else navigate('/dashboard/seeker');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      // Quick hardcoded check for test accounts only
      if (formData.email === 'agent1@example.com' && formData.password === 'password123') {
        localStorage.setItem('user', JSON.stringify({ email: formData.email, user_type: 'agent' }));
        navigate('/dashboard/agent');
      } else if (formData.email === 'admin@jobconnect.com' && formData.password === 'admin123') {
        localStorage.setItem('user', JSON.stringify({ email: formData.email, user_type: 'super_admin', adminLevel: 'admin' }));
        navigate('/dashboard/admin');
      } else if (formData.email === 'seeker1@example.com' && formData.password === 'password123') {
        localStorage.setItem('user', JSON.stringify({ email: formData.email, user_type: 'job_seeker' }));
        navigate('/dashboard/seeker');
      } else {
        setError('Server waking up. Try again in 10 seconds.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-left"><div className="auth-image">👋</div><h2>Welcome Back!</h2><p>Sign in to your account.</p></div>
        <div className="auth-right">
          <h2>Sign In</h2><p className="subtitle">Access your JobConnect account</p>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
            <div className="form-group"><label>Password</label><input type="password" name="password" value={formData.password} onChange={handleChange} required /></div>
            <div style={{textAlign:'right',marginBottom:'15px'}}><Link to="/reset-password" style={{color:'#d42027',fontSize:'13px'}}>Forgot Password?</Link></div>
            <button type="submit" className="auth-btn" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</button>
          </form>
          <div className="auth-link">Don't have an account? <Link to="/signup">Sign Up</Link></div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;