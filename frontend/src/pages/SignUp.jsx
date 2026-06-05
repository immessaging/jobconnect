import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import './Auth.css';

function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=Form, 2=Email Verify, 3=Phone Verify
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    user_type: 'job_seeker'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Email verification
  const [emailCode, setEmailCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);

  // Phone verification
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneCountdown, setPhoneCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (emailCountdown > 0) {
      const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCountdown]);

  useEffect(() => {
    if (phoneCountdown > 0) {
      const timer = setTimeout(() => setPhoneCountdown(phoneCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneCountdown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Generate random 6-digit code
  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  // ============================================
  // EMAIL VERIFICATION
  // ============================================
  const handleSendEmailVerification = () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    const code = generateCode();
    // In production, this would call your backend API to send email
    // For demo, we show the code
    setEmailCode(code);
    setEmailSent(true);
    setEmailCountdown(60);
    setError('');
    setSuccess(`✅ Verification code sent to ${formData.email}`);

    // Demo: Show code in alert (remove in production)
    console.log(`📧 Email verification code for ${formData.email}: ${code}`);
    alert(`📧 Demo Mode: Your email verification code is: ${code}\n\nIn production, this would be sent to your email.`);
  };

  const handleVerifyEmail = () => {
    if (emailCode === '') {
      setError('Please enter the verification code');
      return;
    }
    // In production, verify with backend
    setEmailVerified(true);
    setSuccess('✅ Email verified successfully!');
    setError('');
  };

  // ============================================
  // PHONE VERIFICATION
  // ============================================
  const handleSendPhoneVerification = () => {
    if (!formData.phone || formData.phone.length < 11) {
      setError('Please enter a valid Nigerian phone number');
      return;
    }

    const code = generateCode();
    // In production, this would call your backend API to send SMS
    setPhoneCode(code);
    setPhoneSent(true);
    setPhoneCountdown(60);
    setError('');
    setSuccess(`📱 Verification code sent to ${formData.phone}`);

    // Demo: Show code in alert (remove in production)
    console.log(`📱 Phone verification code for ${formData.phone}: ${code}`);
    alert(`📱 Demo Mode: Your phone verification code is: ${code}\n\nIn production, this would be sent via SMS.`);
  };

  const handleVerifyPhone = () => {
    if (phoneCode === '') {
      setError('Please enter the verification code');
      return;
    }
    // In production, verify with backend
    setPhoneVerified(true);
    setSuccess('📱 Phone verified successfully!');
    setError('');
  };

  // ============================================
  // FORM SUBMISSION
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.email || !formData.phone || !formData.password) {
      setError('All fields are required');
      return;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!formData.phone.startsWith('0') && !formData.phone.startsWith('+234')) {
      setError('Please enter a valid Nigerian phone number (e.g., 08012345678)');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!emailVerified) {
      setError('Please verify your email address first');
      return;
    }
    if (!phoneVerified) {
      setError('Please verify your phone number first');
      return;
    }

    setLoading(true);
    try {
      const response = await registerUser({
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        user_type: formData.user_type
      });

      setSuccess('🎉 Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-left">
          <div className="auth-image">🚀</div>
          <h2>Start Your Journey</h2>
          <p>Create an account to access verified job listings and connect with trusted agents across Nigeria.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <span>✅</span> Email Verification
            </div>
            <div className="auth-feature">
              <span>📱</span> Phone Verification
            </div>
            <div className="auth-feature">
              <span>🔒</span> Secure Account
            </div>
          </div>
        </div>

        <div className="auth-right">
          <h2>Create Account</h2>
          <p className="subtitle">Join JobConnect Nigeria today</p>

          {/* Step Indicator */}
          <div className="verification-steps">
            <div className={`v-step ${step >= 1 ? 'active' : ''} ${emailVerified ? 'completed' : ''}`}>
              <div className="v-step-number">{emailVerified ? '✓' : '1'}</div>
              <span>Details</span>
            </div>
            <div className={`v-step-line ${emailVerified ? 'active' : ''}`}></div>
            <div className={`v-step ${emailVerified ? 'completed' : ''} ${step === 2 ? 'active' : ''}`}>
              <div className="v-step-number">{emailVerified ? '✓' : '2'}</div>
              <span>Email</span>
            </div>
            <div className={`v-step-line ${phoneVerified ? 'active' : ''}`}></div>
            <div className={`v-step ${phoneVerified ? 'completed' : ''} ${step === 3 ? 'active' : ''}`}>
              <div className="v-step-number">{phoneVerified ? '✓' : '3'}</div>
              <span>Phone</span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={emailVerified}
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="08012345678"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={phoneVerified}
                />
                <small className="input-hint">Nigerian phone number (11 digits)</small>
              </div>

              <div className="form-group">
                <label>I am a *</label>
                <select name="user_type" value={formData.user_type} onChange={handleChange}>
                  <option value="job_seeker">Job Seeker</option>
                  <option value="agent">Job Agent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <small className="input-hint">At least 6 characters</small>
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="auth-btn">
                Continue to Verification →
              </button>
            </form>
          )}

          {/* Step 2: Email Verification */}
          {step === 2 && (
            <div className="verification-section">
              <h3>📧 Verify Your Email</h3>
              <p>We've sent a verification code to <strong>{formData.email}</strong></p>

              {!emailSent ? (
                <button onClick={handleSendEmailVerification} className="auth-btn" disabled={emailCountdown > 0}>
                  {emailCountdown > 0 ? `Resend in ${emailCountdown}s` : '📧 Send Verification Code'}
                </button>
              ) : (
                <>
                  <div className="form-group">
                    <label>Enter 6-digit code</label>
                    <input
                      type="text"
                      placeholder="000000"
                      maxLength="6"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="verification-input"
                    />
                  </div>
                  <div className="verification-actions">
                    <button onClick={handleVerifyEmail} className="auth-btn" disabled={emailCode.length !== 6}>
                      ✅ Verify Email
                    </button>
                    <button onClick={handleSendEmailVerification} className="resend-btn" disabled={emailCountdown > 0}>
                      {emailCountdown > 0 ? `Resend in ${emailCountdown}s` : '📧 Resend Code'}
                    </button>
                  </div>
                </>
              )}

              {emailVerified && (
                <div className="verification-success">
                  <span>✅ Email Verified!</span>
                  <button onClick={() => setStep(3)} className="auth-btn">
                    Continue to Phone Verification →
                  </button>
                </div>
              )}

              <button onClick={() => setStep(1)} className="back-btn">← Back</button>
            </div>
          )}

          {/* Step 3: Phone Verification */}
          {step === 3 && (
            <div className="verification-section">
              <h3>📱 Verify Your Phone</h3>
              <p>We've sent an SMS to <strong>{formData.phone}</strong></p>

              {!phoneSent ? (
                <button onClick={handleSendPhoneVerification} className="auth-btn" disabled={phoneCountdown > 0}>
                  {phoneCountdown > 0 ? `Resend in ${phoneCountdown}s` : '📱 Send SMS Code'}
                </button>
              ) : (
                <>
                  <div className="form-group">
                    <label>Enter 6-digit code</label>
                    <input
                      type="text"
                      placeholder="000000"
                      maxLength="6"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="verification-input"
                    />
                  </div>
                  <div className="verification-actions">
                    <button onClick={handleVerifyPhone} className="auth-btn" disabled={phoneCode.length !== 6}>
                      ✅ Verify Phone
                    </button>
                    <button onClick={handleSendPhoneVerification} className="resend-btn" disabled={phoneCountdown > 0}>
                      {phoneCountdown > 0 ? `Resend in ${phoneCountdown}s` : '📱 Resend Code'}
                    </button>
                  </div>
                </>
              )}

              {phoneVerified && (
                <div className="verification-success">
                  <span>📱 Phone Verified!</span>
                  <p>Both email and phone verified. You can now create your account.</p>
                  <button onClick={handleSubmit} className="auth-btn" disabled={loading}>
                    {loading ? '⏳ Creating Account...' : '🚀 Create Account'}
                  </button>
                </div>
              )}

              <button onClick={() => setStep(2)} className="back-btn">← Back</button>
            </div>
          )}

          <div className="auth-link">
            Already have an account? <Link to="/signin">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;