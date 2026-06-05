import React, { useState, useEffect } from 'react';
import './ContractAgreement.css';

function ContractAgreement({ 
  job, 
  isOpen, 
  onClose, 
  onAgree, 
  commissionPercentage, // Comes from job data (agent sets this)
  isNegotiable = true,
  monthlySalary = 0
}) {
  const [step, setStep] = useState(1); // 1=Read, 2=Terms, 3=Sign
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState('');
  const [checkedTerms, setCheckedTerms] = useState({
    understood: false,
    binding: false,
    refund: false,
    transparent: false
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSignature('');
      setCheckedTerms({
        understood: false,
        binding: false,
        refund: false,
        transparent: false
      });
    }
  }, [isOpen]);

  // Ensure valid numbers
  const salary = Number(monthlySalary) || 0;
  const percentage = Number(commissionPercentage) || 15;
  const commissionAmount = (salary * percentage) / 100;
  const platformFee = (commissionAmount * 17) / 100;
  const agentPayout = (commissionAmount * 83) / 100;

  const allTermsChecked = Object.values(checkedTerms).every(v => v);

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && allTermsChecked) {
      setStep(3);
    }
  };

  const handleSign = () => {
    if (step === 3 && signature.trim()) {
      onAgree({
        commissionAmount,
        platformFee,
        agentPayout,
        percentage: commissionPercentage,
        signature: signature.trim(),
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleClose = () => {
    setStep(1);
    setSignature('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="contract-overlay" onClick={(e) => {
      // Close only if clicking the overlay background
      if (e.target === e.currentTarget) handleClose();
    }}>
      <div className="contract-modal">
        <button className="modal-close-btn" onClick={handleClose}>✕</button>
        
        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>
            {step > 1 ? '✓' : '1'}
          </div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>
            {step > 2 ? '✓' : '2'}
          </div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>
        <div className="step-labels">
          <span className={step >= 1 ? 'active' : ''}>Read Contract</span>
          <span className={step >= 2 ? 'active' : ''}>Accept Terms</span>
          <span className={step >= 3 ? 'active' : ''}>Sign & Submit</span>
        </div>

        {/* Step 1: Full Contract */}
        {step === 1 && (
          <div className="contract-step">
            <h2>📋 Commission Agreement Contract</h2>
            <div className="contract-content">
              <div className="contract-header">
                <h3>JobConnect Nigeria - Commission Agreement</h3>
                <p>Agreement Date: {new Date().toLocaleDateString('en-NG', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>

              <div className="contract-section">
                <h4>1. PARTIES INVOLVED</h4>
                <p><strong>Job Agent:</strong> Verified Agent (Identity verified by JobConnect)</p>
                <p><strong>Job Seeker:</strong> You (Identity verified by JobConnect)</p>
                <p><strong>Platform:</strong> JobConnect Nigeria (Escrow & Mediation)</p>
              </div>

              <div className="contract-section">
                <h4>2. JOB DETAILS</h4>
                <p><strong>Position:</strong> {job?.title || 'Job Position'}</p>
                <p><strong>Organization:</strong> <span className="blurred-text">[Revealed after payment]</span></p>
                <p><strong>Monthly Salary:</strong> ₦{salary.toLocaleString()}</p>
                <p><strong>Salary Type:</strong> {job?.salary_type || 'Monthly'}</p>
              </div>

              <div className="contract-section">
                <h4>3. COMMISSION STRUCTURE</h4>
                <div className="commission-breakdown">
                  <div className="breakdown-row">
                    <span>Monthly Salary</span>
                    <span>₦{salary.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Commission Rate</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="breakdown-row total">
                    <span>Total Commission (One-Time)</span>
                    <span>₦{commissionAmount.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Platform Fee (17%)</span>
                    <span>₦{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Agent Payout (83%)</span>
                    <span>₦{agentPayout.toLocaleString()}</span>
                  </div>
                </div>
                {isNegotiable ? (
                  <p className="negotiable-badge">🔄 This commission is <strong>NEGOTIABLE</strong> - You may discuss with the agent</p>
                ) : (
                  <p className="non-negotiable-badge">🔒 This commission is <strong>FIXED</strong> - Non-negotiable</p>
                )}
              </div>

              <div className="contract-section">
                <h4>4. TRANSPARENCY & ACCOUNTABILITY</h4>
                <ul className="terms-list">
                  <li>✅ All fees are disclosed upfront with no hidden charges</li>
                  <li>✅ Commission is held in secure escrow until job confirmation</li>
                  <li>✅ Agent only receives payment after you confirm starting the job</li>
                  <li>✅ Full audit trail of all transactions available</li>
                  <li>✅ Both parties can track agreement status in real-time</li>
                </ul>
              </div>

              <div className="contract-section">
                <h4>5. REFUND & DISPUTE POLICY</h4>
                <ul className="terms-list">
                  <li>🔄 <strong>Full Refund:</strong> If job is not secured within 21 days of payment</li>
                  <li>🔄 <strong>Commission Carry-Forward:</strong> Option to apply commission to next job</li>
                  <li>⚖️ <strong>Dispute Resolution:</strong> Open dispute within 21 days with evidence</li>
                  <li>🛡️ <strong>Money-Back Guarantee:</strong> 100% refund if agent fails to deliver</li>
                  <li>📋 <strong>Agent Confirmation Required:</strong> Agent must confirm job outcome</li>
                </ul>
              </div>

              <div className="contract-section">
                <h4>6. JOB SECURITY & SUPPORT</h4>
                <ul className="terms-list">
                  <li>📝 Agent prepares you for interviews and exams if required</li>
                  <li>📞 Direct organization contact provided after payment</li>
                  <li>🎯 Agent guides you through the entire process</li>
                  <li>📊 Regular status updates on your application</li>
                </ul>
              </div>

              <div className="contract-section">
                <h4>7. PAYMENT TERMS</h4>
                <ul className="terms-list">
                  <li>💳 One-time payment (NOT monthly)</li>
                  <li>🔒 Held in secure escrow by JobConnect</li>
                  <li>✅ Released to agent only after you confirm starting the job</li>
                  <li>📅 Agent paid on 25th of each month (min ₦10,000 payout)</li>
                  <li>⏰ Agent payout processed 7 days after your confirmation</li>
                </ul>
              </div>

              <div className="contract-section warning-section">
                <h4>⚠️ IMPORTANT NOTICE</h4>
                <p>By signing this agreement, you acknowledge that:</p>
                <ul>
                  <li>This is a legally binding contract</li>
                  <li>Commission is non-refundable once job is secured</li>
                  <li>You have 21 days to report any issues</li>
                  <li>False claims will result in account suspension</li>
                </ul>
              </div>
            </div>

            <button className="btn-contract" onClick={handleNext}>
              I've Read the Contract - Next: Accept Terms →
            </button>
          </div>
        )}

        {/* Step 2: Accept Terms */}
        {step === 2 && (
          <div className="contract-step">
            <h2>📝 Accept Terms & Conditions</h2>
            <p className="terms-intro">Please check all boxes to confirm your understanding:</p>
            
            <div className="checkbox-list">
              <label className={`checkbox-item ${checkedTerms.understood ? 'checked' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={checkedTerms.understood}
                  onChange={e => setCheckedTerms({...checkedTerms, understood: e.target.checked})}
                />
                <span>I have read and fully understand all the terms herein stated as binding to me</span>
              </label>

              <label className={`checkbox-item ${checkedTerms.binding ? 'checked' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={checkedTerms.binding}
                  onChange={e => setCheckedTerms({...checkedTerms, binding: e.target.checked})}
                />
                <span>I agree that this contract is legally binding and enforceable</span>
              </label>

              <label className={`checkbox-item ${checkedTerms.refund ? 'checked' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={checkedTerms.refund}
                  onChange={e => setCheckedTerms({...checkedTerms, refund: e.target.checked})}
                />
                <span>I understand the refund policy (21-day dispute window, agent confirmation required)</span>
              </label>

              <label className={`checkbox-item ${checkedTerms.transparent ? 'checked' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={checkedTerms.transparent}
                  onChange={e => setCheckedTerms({...checkedTerms, transparent: e.target.checked})}
                />
                <span>I acknowledge that all fees are transparent with no hidden charges</span>
              </label>
            </div>

            <div className="step-navigation">
              <button className="btn-back" onClick={() => setStep(1)}>
                ← Back to Contract
              </button>
              <button 
                className="btn-contract" 
                onClick={handleNext}
                disabled={!allTermsChecked}
              >
                {allTermsChecked ? 'Next: Sign Agreement →' : 'Please check all boxes'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Sign */}
        {step === 3 && (
          <div className="contract-step">
            <h2>✍️ Sign Agreement</h2>
            <p>Type your full name as digital signature:</p>
            
            <div className="signature-area">
              <input 
                type="text" 
                placeholder="Type your full legal name"
                value={signature}
                onChange={e => setSignature(e.target.value)}
                className="signature-input"
                autoFocus
              />
              <p className="signature-note">
                By typing your name, you are signing this agreement electronically. 
                This has the same legal effect as a handwritten signature under the 
                Nigerian Evidence Act.
              </p>
            </div>

            <div className="agreement-summary">
              <h4>Agreement Summary:</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span>📋 Commission:</span>
                  <strong>{percentage}% of ₦{salary.toLocaleString()}</strong>
                </div>
                <div className="summary-item">
                  <span>💰 Total Amount:</span>
                  <strong>₦{commissionAmount.toLocaleString()}</strong>
                </div>
                <div className="summary-item">
                  <span>🔄 Type:</span>
                  <strong>{isNegotiable ? 'Negotiable' : 'Non-Negotiable'}</strong>
                </div>
                <div className="summary-item">
                  <span>📅 Date:</span>
                  <strong>{new Date().toLocaleDateString()}</strong>
                </div>
              </div>
            </div>

            <div className="step-navigation">
              <button className="btn-back" onClick={() => setStep(2)}>
                ← Back to Terms
              </button>
              <button 
                className="btn-contract btn-sign"
                onClick={handleSign}
                disabled={!signature.trim()}
              >
                {signature.trim() 
                  ? '✅ I Agree - Sign & Continue to Payment' 
                  : 'Please type your name to sign'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContractAgreement;