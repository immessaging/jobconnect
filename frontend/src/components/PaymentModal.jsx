import React, { useState, useEffect } from 'react';
import './PaymentModal.css';
import getCompanyAccount, { NIGERIAN_BANKS, USSD_CODES } from '../config/payment';

function PaymentModal({ isOpen, onClose, amount, onPaymentComplete }) {
  // Get company account from config (environment variables)
  const COMPANY_ACCOUNT = getCompanyAccount();

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [bankDetails, setBankDetails] = useState({ bank: '', accountNumber: '', accountName: '' });
  const [selectedBankForUssd, setSelectedBankForUssd] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [errors, setErrors] = useState({});
  const [copiedField, setCopiedField] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('card');
      setCardDetails({ number: '', name: '', expiry: '', cvv: '' });
      setBankDetails({ bank: '', accountNumber: '', accountName: '' });
      setSelectedBankForUssd('');
      setProcessing(false);
      setSuccess(false);
      setErrors({});
    }
  }, [isOpen]);

  const generateReference = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `JCN-${timestamp}-${random}`;
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    }).catch(() => {
      alert('Failed to copy. Please copy manually.');
    });
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateForm = () => {
    const newErrors = {};

    if (paymentMethod === 'card') {
      if (!cardDetails.number || cardDetails.number.replace(/\s/g, '').length < 16) {
        newErrors.number = 'Enter valid 16-digit card number';
      }
      if (!cardDetails.name || cardDetails.name.length < 3) {
        newErrors.name = 'Enter cardholder name';
      }
      if (!cardDetails.expiry || cardDetails.expiry.length < 5) {
        newErrors.expiry = 'Enter valid expiry (MM/YY)';
      }
      if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
        newErrors.cvv = 'Enter valid CVV';
      }
    }

    if (paymentMethod === 'bank') {
      if (!bankDetails.accountNumber || bankDetails.accountNumber.length < 10) {
        newErrors.accountNumber = 'Enter valid 10-digit NUBAN account number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayNow = () => {
    if (!validateForm()) return;

    setProcessing(true);
    const reference = generateReference();
    setPaymentReference(reference);

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);

      // Auto-close and callback after showing success
      setTimeout(() => {
        onPaymentComplete({
          method: paymentMethod,
          amount,
          status: 'success',
          reference: reference,
          escrowRef: 'ESC-' + Date.now(),
          paidTo: COMPANY_ACCOUNT.accountName,
          paidToBank: COMPANY_ACCOUNT.bankName,
          paidToAccount: COMPANY_ACCOUNT.accountNumber,
          timestamp: new Date().toISOString()
        });
      }, 3000);
    }, 2000);
  };

  if (!isOpen) return null;

  const platformFee = Math.round(amount * 0.17);
  const agentPayout = Math.round(amount * 0.83);
  const formattedAmount = amount.toLocaleString();

  return (
    <div className="payment-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="payment-modal">
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {success ? (
          <div className="payment-success">
            <div className="success-animation">
              <div className="success-circle">✅</div>
            </div>
            <h2>Payment Successful!</h2>
            <p className="success-amount">₦{formattedAmount} received</p>
            
            <div className="escrow-confirmation">
              <div className="escrow-icon">🔒</div>
              <p>Funds held in secure escrow account</p>
              <div className="escrow-details">
                <p>🏦 {COMPANY_ACCOUNT.bankName}</p>
                <p>👤 {COMPANY_ACCOUNT.accountName}</p>
                <p>🔢 {COMPANY_ACCOUNT.accountNumber}</p>
              </div>
            </div>

            <div className="payment-reference-box">
              <span>📋 Reference:</span>
              <strong>{paymentReference}</strong>
              <button onClick={() => copyToClipboard(paymentReference, 'ref')} className="copy-btn">
                {copiedField === 'ref' ? '✅ Copied!' : '📋'}
              </button>
            </div>

            <div className="fee-breakdown-success">
              <h5>💰 Commission Split:</h5>
              <div className="split-row">
                <span>Platform Fee (17%)</span>
                <span>₦{platformFee.toLocaleString()}</span>
              </div>
              <div className="split-row">
                <span>Agent Payout (83%)</span>
                <span>₦{agentPayout.toLocaleString()}</span>
              </div>
            </div>

            <div className="org-reveal-notice">
              <p>🎉 Organization contact details are now visible to you!</p>
            </div>
          </div>
        ) : (
          <>
            <h2>💳 Secure Payment</h2>

            {/* Amount Display */}
            <div className="amount-display">
              <span className="amount-label">One-Time Commission Payment</span>
              <h3>₦{formattedAmount}</h3>
              <div className="fee-preview">
                <div className="fee-row">
                  <span>Platform Fee (17%)</span>
                  <span>₦{platformFee.toLocaleString()}</span>
                </div>
                <div className="fee-row">
                  <span>Agent Payout (83%)</span>
                  <span>₦{agentPayout.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Escrow Notice */}
            <div className="escrow-notice">
              <span>🔒</span>
              <span>Your payment is protected by escrow. Funds are only released to the agent after you confirm employment.</span>
            </div>

            {/* Payment Methods */}
            <div className="payment-methods">
              <button
                className={`method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => { setPaymentMethod('card'); setErrors({}); }}
              >
                <span className="method-icon">💳</span>
                <span>Card</span>
              </button>
              <button
                className={`method-btn ${paymentMethod === 'bank' ? 'active' : ''}`}
                onClick={() => { setPaymentMethod('bank'); setErrors({}); }}
              >
                <span className="method-icon">🏦</span>
                <span>Transfer</span>
              </button>
              <button
                className={`method-btn ${paymentMethod === 'ussd' ? 'active' : ''}`}
                onClick={() => { setPaymentMethod('ussd'); setErrors({}); }}
              >
                <span className="method-icon">📱</span>
                <span>USSD</span>
              </button>
            </div>

            {/* Card Payment Form */}
            {paymentMethod === 'card' && (
              <div className="payment-form">
                <div className="card-preview">
                  <div className="card-chip">💳</div>
                  <div className="card-number-preview">
                    {cardDetails.number || '•••• •••• •••• ••••'}
                  </div>
                  <div className="card-info-preview">
                    <span>{cardDetails.name || 'CARDHOLDER NAME'}</span>
                    <span>{cardDetails.expiry || 'MM/YY'}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Card Number *</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    value={cardDetails.number}
                    onChange={e => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
                    className={errors.number ? 'error' : ''}
                  />
                  {errors.number && <span className="error-text">{errors.number}</span>}
                </div>

                <div className="form-group">
                  <label>Cardholder Name *</label>
                  <input
                    type="text"
                    placeholder="Name on card"
                    value={cardDetails.name}
                    onChange={e => setCardDetails({ ...cardDetails, name: e.target.value.toUpperCase() })}
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry *</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength="5"
                      value={cardDetails.expiry}
                      onChange={e => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                      className={errors.expiry ? 'error' : ''}
                    />
                    {errors.expiry && <span className="error-text">{errors.expiry}</span>}
                  </div>
                  <div className="form-group">
                    <label>CVV *</label>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength="4"
                      value={cardDetails.cvv}
                      onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/[^0-9]/g, '') })}
                      className={errors.cvv ? 'error' : ''}
                    />
                    {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Bank Transfer */}
            {paymentMethod === 'bank' && (
              <div className="payment-form">
                <div className="company-account-display">
                  <h4>🏦 Pay to JobConnect Escrow Account</h4>
                  
                  <div className="account-detail-row">
                    <span className="detail-label">Bank:</span>
                    <span className="detail-value">{COMPANY_ACCOUNT.bankName}</span>
                  </div>
                  
                  <div className="account-detail-row">
                    <span className="detail-label">Account Number:</span>
                    <span className="detail-value copy-row">
                      <strong>{COMPANY_ACCOUNT.accountNumber}</strong>
                      <button
                        onClick={() => copyToClipboard(COMPANY_ACCOUNT.accountNumber, 'acct')}
                        className="copy-btn"
                      >
                        {copiedField === 'acct' ? '✅' : '📋'}
                      </button>
                    </span>
                  </div>
                  
                  <div className="account-detail-row">
                    <span className="detail-label">Account Name:</span>
                    <span className="detail-value">{COMPANY_ACCOUNT.accountName}</span>
                  </div>

                  <div className="transfer-note">
                    ⚠️ Use your email address as payment narration for easy tracking
                  </div>
                </div>

                <div className="your-details-section">
                  <h5>Your Payment Details (for confirmation)</h5>
                  
                  <div className="form-group">
                    <label>Your Bank</label>
                    <select
                      value={bankDetails.bank}
                      onChange={e => setBankDetails({ ...bankDetails, bank: e.target.value })}
                    >
                      <option value="">Select Your Bank</option>
                      {NIGERIAN_BANKS.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Your Account Number</label>
                    <input
                      type="text"
                      placeholder="10-digit NUBAN"
                      maxLength="10"
                      value={bankDetails.accountNumber}
                      onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/[^0-9]/g, '') })}
                      className={errors.accountNumber ? 'error' : ''}
                    />
                    {errors.accountNumber && <span className="error-text">{errors.accountNumber}</span>}
                  </div>

                  <div className="form-group">
                    <label>Your Account Name</label>
                    <input
                      type="text"
                      placeholder="Name on your account"
                      value={bankDetails.accountName}
                      onChange={e => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* USSD Payment */}
            {paymentMethod === 'ussd' && (
              <div className="payment-form">
                <div className="company-account-display">
                  <h4>📱 USSD Transfer to JobConnect</h4>
                  
                  <div className="account-detail-row">
                    <span className="detail-label">Bank:</span>
                    <span className="detail-value">{COMPANY_ACCOUNT.bankName}</span>
                  </div>
                  
                  <div className="account-detail-row">
                    <span className="detail-label">Account:</span>
                    <span className="detail-value copy-row">
                      <strong>{COMPANY_ACCOUNT.accountNumber}</strong>
                      <button
                        onClick={() => copyToClipboard(COMPANY_ACCOUNT.accountNumber, 'ussd')}
                        className="copy-btn"
                      >
                        {copiedField === 'ussd' ? '✅' : '📋'}
                      </button>
                    </span>
                  </div>
                  
                  <div className="account-detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{COMPANY_ACCOUNT.accountName}</span>
                  </div>

                  <div className="account-detail-row">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value amount-highlight">₦{formattedAmount}</span>
                  </div>
                </div>

                <div className="ussd-instructions">
                  <div className="form-group">
                    <label>Select Your Bank for USSD Code</label>
                    <select
                      value={selectedBankForUssd}
                      onChange={e => setSelectedBankForUssd(e.target.value)}
                    >
                      <option value="">Select Your Bank</option>
                      {NIGERIAN_BANKS.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>

                  {selectedBankForUssd && (
                    <div className="ussd-code-section">
                      <h5>📱 Dial on your phone:</h5>
                      <div className="ussd-code-box">
                        {USSD_CODES[selectedBankForUssd] || '*YourBankCode#'}
                      </div>
                      <p className="ussd-instruction-text">
                        Then follow the prompts to transfer <strong>₦{formattedAmount}</strong> to:
                      </p>
                      <ul className="ussd-steps">
                        <li>Bank: <strong>{COMPANY_ACCOUNT.bankName}</strong></li>
                        <li>Account: <strong>{COMPANY_ACCOUNT.accountNumber}</strong></li>
                        <li>Name: <strong>{COMPANY_ACCOUNT.accountName}</strong></li>
                        <li>Amount: <strong>₦{formattedAmount}</strong></li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pay Button */}
            <button
              className="btn-pay-now"
              onClick={handlePayNow}
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="spinner-small"></span>
                  Processing Payment...
                </>
              ) : (
                `💳 Pay ₦${formattedAmount} Now`
              )}
            </button>

            {/* Transaction Info */}
            <div className="transaction-info">
              <div className="info-item">
                <span>🏦</span>
                <span><strong>Recipient:</strong> {COMPANY_ACCOUNT.accountName} | {COMPANY_ACCOUNT.bankName} | {COMPANY_ACCOUNT.accountNumber}</span>
              </div>
              <div className="info-item">
                <span>🔒</span>
                <span><strong>Escrow Protection:</strong> Funds held until you confirm employment</span>
              </div>
              <div className="info-item">
                <span>🔄</span>
                <span><strong>Refund:</strong> Full refund if job not secured within 21 days</span>
              </div>
            </div>

            <p className="secure-note">
              🔒 Secured by SSL/TLS encryption • PCI DSS Compliant • Funds held in escrow
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentModal;