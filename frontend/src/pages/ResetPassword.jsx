import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function ResetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=Email, 2=OTP, 3=New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Generate 6-digit OTP
  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  // ============================================
  // STEP 1: SEND OTP TO EMAIL
  // ============================================
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // In production: Call backend API to send OTP email
      // const res = await api.post('/api/auth/forgot-password', { email });
      
      // Demo: Generate OTP locally
      const otpCode = generateOtp();
      setGeneratedOtp(otpCode);
      setCountdown(60);
      
      setMessage(`✅ A 6-digit code has been sent to ${email}`);
      
      // Demo: Show OTP (remove in production)
      console.log(`🔑 OTP for ${email}: ${otpCode}`);
      alert(`🔑 Demo Mode: Your OTP is: ${otpCode}\n\nIn production, this would be emailed to you.`);
      
      setStep(2);
    } catch (err) {
      setError('Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // STEP 2: VERIFY OTP
  // ============================================
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    // In production: Verify OTP with backend
    if (otp === generatedOtp) {
      setMessage('✅ Code verified! Set your new password.');
      setStep(3);
    } else {
      setError('❌ Invalid code. Please try again.');
    }
  };

  const handleResendOtp = () => {
    const otpCode = generateOtp();
    setGeneratedOtp(otpCode);
    setCountdown(60);
    setOtp('');
    setError('');
    setMessage(`✅ New code sent to ${email}`);
    
    // Demo: Show OTP
    alert(`🔑 Demo Mode: Your new OTP is: ${otpCode}`);
  };

  // ============================================
  // STEP 3: SET NEW PASSWORD
  // ============================================
  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // In production: Call backend API to reset password
      // const res = await api.post('/api/auth/reset-password', { 
      //   email, 
      //   otp: generatedOtp, 
      //   new_password: newPassword 
      // });

      // Demo: Simulate success
      setTimeout(() => {
        setMessage('🎉 Password reset successful! Redirecting to login...');
        setLoading(false);
        
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      }, 1500);
    } catch (err) {
      setError('Failed to reset password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Left Side */}
        <div className="auth-left">
          <div className="auth-image">
            {step === 1 ? '🔑' : step === 2 ? '📧' : '🔒'}
          </div>
          <h2>Reset Password</h2>
          <p>
            {step === 1 && "Enter your email address and we'll send you a code to reset your password."}
            {step === 2 && `Enter the 6-digit code sent to ${email}`}
            {step === 3 && 'Create your new password'}
          </p>
        </div>

        {/* Right Side */}
        <div className="auth-right">
          <h2>
            {step === 1 && 'Forgot Password?'}
            {step === 2 && 'Verify Code'}
            {step === 3 && 'New Password'}
          </h2>
          <p className="subtitle">
            {step === 1 && "We'll help you reset it"}
            {step === 2 && 'Check your email for the code'}
            {step === 3 && 'Choose a strong password'}
          </p>

          {/* Step Indicator */}
          <div className="verification-steps">
            <div className={`v-step ${step >= 1 ? 'completed' : ''}`}>
              <div className="v-step-number">{step > 1 ? '✓' : '1'}</div>
              <span>Email</span>
            </div>
            <div className={`v-step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`v-step ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}`}>
              <div className="v-step-number">{step > 2 ? '✓' : '2'}</div>
              <span>Verify</span>
            </div>
            <div className={`v-step-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`v-step ${step >= 3 ? 'active' : ''}`}>
              <div className="v-step-number">3</div>
              <span>Reset</span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
              <button onClick={() => setError('')} className="error-close">✕</button>
            </div>
          )}
          {message && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              <span>{message}</span>
            </div>
          )}

          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Sending...
                  </>
                ) : (
                  '📧 Send Reset Code'
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label>Enter 6-Digit Code</label>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="verification-input"
                  autoFocus
                />
                <small className="input-hint">
                  Enter the code sent to <strong>{email}</strong>
                </small>
              </div>

              <button type="submit" className="auth-btn" disabled={otp.length !== 6}>
                ✅ Verify Code
              </button>

              <div className="resend-section">
                <p>Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="resend-btn"
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : '📧 Resend Code'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="back-btn"
              >
                ← Change Email
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleSetPassword}>
              <div className="form-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    autoComplete="new-password"
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
                <small className="input-hint">At least 6 characters</small>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className={`strength-fill ${
                        newPassword.length < 6 ? 'weak' :
                        newPassword.length < 8 ? 'fair' :
                        newPassword.length < 10 ? 'good' : 'strong'
                      }`}
                      style={{ width: `${Math.min(newPassword.length * 10, 100)}%` }}
                    ></div>
                  </div>
                  <span className="strength-label">
                    {newPassword.length < 6 ? 'Too short' :
                     newPassword.length < 8 ? 'Fair' :
                     newPassword.length < 10 ? 'Good' : 'Strong'}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="auth-btn"
                disabled={loading || !newPassword || !confirmPassword}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Resetting...
                  </>
                ) : (
                  '🔒 Reset Password'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="back-btn"
              >
                ← Back
              </button>
            </form>
          )}

          <div className="auth-link">
            Remember your password? <Link to="/signin">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;