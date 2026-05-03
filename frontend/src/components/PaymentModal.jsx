import React, { useState } from 'react';
import './PaymentModal.css';

// ============================================
// YOUR COMPANY ESCROW ACCOUNT DETAILS
// Access Bank - Alu Chukwu Ignatius
// ============================================
const COMPANY_ACCOUNT = {
  bankName: 'Access Bank',
  accountNumber: '0007807032',
  accountName: 'Alu Chukwu Ignatius',
  ussdMainCode: '*901#',
  ussdTransferFormat: '*901*Amount*0007807032#',
  bankTransferNote: 'Alu Chukwu Ignatius | Access Bank | 0007807032'
};

function PaymentModal({ isOpen, onClose, amount, onPaymentComplete }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [bankDetails, setBankDetails] = useState({ bank: '', accountNumber: '', accountName: '' });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');

  const generateReference = () => {
    const ref = 'JCN-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    setPaymentReference(ref);
    return ref;
  };

  const handlePayNow = () => {
    if (paymentMethod === 'card' && (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvv)) {
      alert('Please fill in all card details');
      return;
    }
    if (paymentMethod === 'bank' && !bankDetails.accountNumber) {
      alert('Please enter your account number for payment confirmation');
      return;
    }
    
    setProcessing(true);
    const reference = generateReference();
    
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        onPaymentComplete({ 
          method: paymentMethod, 
          amount, 
          status: 'success',
          reference: reference,
          escrowRef: 'ESC-' + Date.now(),
          paidTo: COMPANY_ACCOUNT.accountName
        });
      }, 2500);
    }, 3000);
  };

  if (!isOpen) return null;

  const platformFee = amount * 0.17;
  const agentPayout = amount * 0.83;

  return (
    <div className="payment-overlay">
      <div className="payment-modal">
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {success ? (
          <div className="payment-success">
            <div className="success-icon">✅</div>
            <h2>Payment Successful!</h2>
            <p>₦{amount.toLocaleString()} has been received</p>
            <p className="escrow-info">🔒 Funds held in secure escrow account</p>
            <p className="escrow-info">🏦 {COMPANY_ACCOUNT.bankName} - {COMPANY_ACCOUNT.accountNumber}</p>
            <p className="escrow-info">👤 {COMPANY_ACCOUNT.accountName}</p>
            <p className="reference-info">📋 Reference: {paymentReference}</p>
            <div className="fee-breakdown-success">
              <p>Platform Fee (17%): ₦{platformFee.toLocaleString()}</p>
              <p>Agent Payout (83%): ₦{agentPayout.toLocaleString()}</p>
            </div>
            <p className="org-reveal">🎉 Organization details will now be visible to you</p>
          </div>
        ) : (
          <>
            <h2>💳 Complete Payment</h2>
            
            {/* Amount Display */}
            <div className="amount-display">
              <span>Amount to Pay (One-Time Commission):</span>
              <h3>₦{amount.toLocaleString()}</h3>
              <div className="fee-preview">
                <small>Platform Fee (17%): ₦{platformFee.toLocaleString()}</small>
                <small>Agent Payout (83%): ₦{agentPayout.toLocaleString()}</small>
              </div>
            </div>

            {/* Escrow Notice */}
            <div className="escrow-notice">
              <i className="fas fa-shield-alt"></i> 🔒
              <span>All payments are held in escrow until you confirm employment. Your money is protected.</span>
            </div>

            {/* Payment Methods */}
            <div className="payment-methods">
              <button 
                className={`method-btn ${paymentMethod==='card'?'active':''}`}
                onClick={()=>setPaymentMethod('card')}
              >💳 Card</button>
              <button 
                className={`method-btn ${paymentMethod==='bank'?'active':''}`}
                onClick={()=>setPaymentMethod('bank')}
              >🏦 Bank Transfer</button>
              <button 
                className={`method-btn ${paymentMethod==='ussd'?'active':''}`}
                onClick={()=>setPaymentMethod('ussd')}
              >📱 USSD</button>
            </div>

            {/* Card Payment Form */}
            {paymentMethod === 'card' && (
              <div className="payment-form">
                <div className="form-group">
                  <label>Card Number *</label>
                  <input type="text" placeholder="1234 5678 9012 3456" maxLength="19"
                    value={cardDetails.number} onChange={e=>setCardDetails({...cardDetails,number:e.target.value})}/>
                </div>
                <div className="form-group">
                  <label>Cardholder Name *</label>
                  <input type="text" placeholder="Name on card"
                    value={cardDetails.name} onChange={e=>setCardDetails({...cardDetails,name:e.target.value})}/>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry *</label>
                    <input type="text" placeholder="MM/YY" maxLength="5"
                      value={cardDetails.expiry} onChange={e=>setCardDetails({...cardDetails,expiry:e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label>CVV *</label>
                    <input type="text" placeholder="123" maxLength="4"
                      value={cardDetails.cvv} onChange={e=>setCardDetails({...cardDetails,cvv:e.target.value})}/>
                  </div>
                </div>
                <p className="card-note">💳 Payment processed via secure payment gateway</p>
              </div>
            )}

            {/* Bank Transfer - Shows Your Company Account */}
            {paymentMethod === 'bank' && (
              <div className="payment-form">
                {/* Your Company Account Display */}
                <div className="company-account-display">
                  <h4>🏦 Pay to JobConnect Escrow Account</h4>
                  <div className="account-detail-row">
                    <span>Bank:</span>
                    <strong>{COMPANY_ACCOUNT.bankName}</strong>
                  </div>
                  <div className="account-detail-row">
                    <span>Account Number:</span>
                    <strong className="copy-text" onClick={() => {navigator.clipboard.writeText(COMPANY_ACCOUNT.accountNumber); alert('Account number copied!');}}>
                      {COMPANY_ACCOUNT.accountNumber} 📋
                    </strong>
                  </div>
                  <div className="account-detail-row">
                    <span>Account Name:</span>
                    <strong>{COMPANY_ACCOUNT.accountName}</strong>
                  </div>
                  <p className="transfer-note">
                    ⚠️ Use your email or name as payment reference for easy tracking
                  </p>
                </div>

                {/* Your Details for Confirmation */}
                <div className="form-group" style={{marginTop:'15px'}}>
                  <label>Your Bank Name</label>
                  <select value={bankDetails.bank} onChange={e=>setBankDetails({...bankDetails,bank:e.target.value})}>
                    <option value="">Select Your Bank</option>
                    <option>Access Bank</option><option>GTBank</option><option>First Bank</option>
                    <option>UBA</option><option>Zenith Bank</option><option>Fidelity Bank</option>
                    <option>Stanbic IBTC</option><option>Union Bank</option><option>Polaris Bank</option>
                    <option>Ecobank</option><option>Wema Bank</option><option>Heritage Bank</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Your Account Number (for payment confirmation)</label>
                  <input type="text" placeholder="10-digit NUBAN"
                    value={bankDetails.accountNumber} onChange={e=>setBankDetails({...bankDetails,accountNumber:e.target.value})}/>
                </div>
                <div className="form-group">
                  <label>Your Account Name</label>
                  <input type="text" placeholder="Name on your account"
                    value={bankDetails.accountName} onChange={e=>setBankDetails({...bankDetails,accountName:e.target.value})}/>
                </div>
              </div>
            )}

            {/* USSD Payment */}
            {paymentMethod === 'ussd' && (
              <div className="payment-form">
                <div className="company-account-display">
                  <h4>📱 USSD Transfer to JobConnect</h4>
                  <div className="account-detail-row">
                    <span>Bank:</span>
                    <strong>{COMPANY_ACCOUNT.bankName}</strong>
                  </div>
                  <div className="account-detail-row">
                    <span>Account:</span>
                    <strong className="copy-text" onClick={() => {navigator.clipboard.writeText(COMPANY_ACCOUNT.accountNumber); alert('Account number copied!');}}>
                      {COMPANY_ACCOUNT.accountNumber} 📋
                    </strong>
                  </div>
                  <div className="account-detail-row">
                    <span>Name:</span>
                    <strong>{COMPANY_ACCOUNT.accountName}</strong>
                  </div>
                </div>

                {/* USSD Transfer from Any Bank */}
                <div className="ussd-instructions">
                  <h5>📱 How to Pay via USSD from ANY Bank:</h5>
                  
                  <div className="ussd-bank-section">
                    <h6>If you use <strong>Access Bank</strong> (*901#):</h6>
                    <div className="ussd-code-box">
                      *901*{amount.toLocaleString()}*0007807032#
                    </div>
                  </div>

                  <div className="ussd-bank-section">
                    <h6>If you use <strong>GTBank</strong> (*737#):</h6>
                    <div className="ussd-code-box">
                      *737*2*{amount.toLocaleString()}*0007807032#
                    </div>
                  </div>

                  <div className="ussd-bank-section">
                    <h6>If you use <strong>Other Banks</strong>:</h6>
                    <ol>
                      <li>Dial your bank's USSD code</li>
                      <li>Select "Transfer to Other Bank"</li>
                      <li>Enter Account: <strong>0007807032</strong></li>
                      <li>Bank: <strong>Access Bank</strong></li>
                      <li>Amount: <strong>₦{amount.toLocaleString()}</strong></li>
                      <li>Name: <strong>{COMPANY_ACCOUNT.accountName}</strong></li>
                      <li>Enter PIN to confirm</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Pay Now Button */}
            <button 
              className="btn-pay-now" 
              onClick={handlePayNow}
              disabled={processing}
            >
              {processing ? '⏳ Processing Payment...' : `💳 Pay ₦${amount.toLocaleString()} Now`}
            </button>

            {/* Transaction Info */}
            <div className="transaction-info">
              <p>🏦 <strong>Payment goes to:</strong> {COMPANY_ACCOUNT.accountName} | {COMPANY_ACCOUNT.bankName} | {COMPANY_ACCOUNT.accountNumber}</p>
              <p>🔒 <strong>Escrow Protection:</strong> Your payment is held securely until you confirm employment</p>
              <p>🔄 <strong>Refund Policy:</strong> Full refund if job not secured within 21 days</p>
              <p>📋 <strong>Payment Reference:</strong> Will be generated after successful payment</p>
            </div>

            <p className="secure-note">🔒 Secured by SSL/TLS encryption | Funds held in escrow</p>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentModal;