import React, { useState } from 'react';
import './ContractAgreement.css';

function ContractAgreement({ 
  job, 
  isOpen, 
  onClose, 
  onAgree, 
  commissionPercentage, 
  isNegotiable,
  monthlySalary 
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

  const commissionAmount = (monthlySalary * commissionPercentage) / 100;
  const platformFee = (commissionAmount * 17) / 100;
  const agentPayout = (commissionAmount * 83) / 100;

  const handleAgree = () => {
    if (step === 1) setStep(2);
    else if (step === 2 && Object.values(checkedTerms).every(v => v)) setStep(3);
    else if (step === 3 && signature.trim()) {
      onAgree({
        commissionAmount,
        platformFee,
        agentPayout,
        percentage: commissionPercentage,
        signature,
        timestamp: new Date().toISOString()
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="contract-overlay">
      <div className="contract-modal">
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        
        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>
        <div className="step-labels">
          <span>Read Contract</span>
          <span>Accept Terms</span>
          <span>Sign & Submit</span>
        </div>

        {/* Step 1: Full Contract */}
        {step === 1 && (
          <div className="contract-step">
            <h2>📋 Commission Agreement Contract</h2>
            <div className="contract-content">
              <div className="contract-header">
                <h3>JobConnect Nigeria - Commission Agreement</h3>
                <p>Agreement Date: {new Date().toLocaleDateString()}</p>
              </div>

              <div className="contract-section">
                <h4>1. PARTIES INVOLVED</h4>
                <p><strong>Job Agent:</strong> Verified Agent (Agent ID: Hidden for privacy)</p>
                <p><strong>Job Seeker:</strong> You (Identity verified by JobConnect)</p>
                <p><strong>Platform:</strong> JobConnect Nigeria (Escrow & Mediation)</p>
              </div>

              <div className="contract-section">
                <h4>2. JOB DETAILS</h4>
                <p><strong>Position:</strong> {job?.title}</p>
                <p><strong>Organization:</strong> [Revealed after payment confirmation]</p>
                <p><strong>Monthly Salary:</strong> ₦{monthlySalary.toLocaleString()}</p>
                <p><strong>Salary Type:</strong> {job?.salary_type || 'Monthly'}</p>
              </div>

              <div className="contract-section">
                <h4>3. COMMISSION STRUCTURE</h4>
                <div className="commission-breakdown">
                  <div className="breakdown-row">
                    <span>Monthly Salary</span>
                    <span>₦{monthlySalary.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Commission Rate</span>
                    <span>{commissionPercentage}%</span>
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
                {isNegotiable && (
                  <p className="negotiable-badge">🔄 This commission is NEGOTIABLE - You may discuss with the agent</p>
                )}
                {!isNegotiable && (
                  <p className="non-negotiable-badge">🔒 This commission is FIXED - Non-negotiable</p>
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

            <button className="btn-contract" onClick={handleAgree}>
              Next: Accept Terms →
            </button>
          </div>
        )}

        {/* Step 2: Accept Terms */}
        {step === 2 && (
          <div className="contract-step">
            <h2>📝 Accept Terms & Conditions</h2>
            <p className="terms-intro">Please check all boxes to confirm your understanding:</p>
            
            <div className="checkbox-list">
              <label className="checkbox-item">
                <input 
                  type="checkbox" 
                  checked={checkedTerms.understood}
                  onChange={e => setCheckedTerms({...checkedTerms, understood: e.target.checked})}
                />
                <span>I have read and fully understand all the terms herein stated as binding to me</span>
              </label>

              <label className="checkbox-item">
                <input 
                  type="checkbox" 
                  checked={checkedTerms.binding}
                  onChange={e => setCheckedTerms({...checkedTerms, binding: e.target.checked})}
                />
                <span>I agree that this contract is legally binding and enforceable</span>
              </label>

              <label className="checkbox-item">
                <input 
                  type="checkbox" 
                  checked={checkedTerms.refund}
                  onChange={e => setCheckedTerms({...checkedTerms, refund: e.target.checked})}
                />
                <span>I understand the refund policy (21-day dispute window, agent confirmation required)</span>
              </label>

              <label className="checkbox-item">
                <input 
                  type="checkbox" 
                  checked={checkedTerms.transparent}
                  onChange={e => setCheckedTerms({...checkedTerms, transparent: e.target.checked})}
                />
                <span>I acknowledge that all fees are transparent with no hidden charges</span>
              </label>
            </div>

            <button 
              className="btn-contract" 
              onClick={handleAgree}
              disabled={!Object.values(checkedTerms).every(v => v)}
            >
              Next: Sign Agreement →
            </button>
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
              />
              <p className="signature-note">
                By typing your name, you are signing this agreement electronically. 
                This has the same legal effect as a handwritten signature.
              </p>
            </div>

            <div className="agreement-summary">
              <h4>Agreement Summary:</h4>
              <p>📋 Commission: {commissionPercentage}% of ₦{monthlySalary.toLocaleString()}</p>
              <p>💰 Total Amount: ₦{commissionAmount.toLocaleString()}</p>
              <p>🔄 {isNegotiable ? 'Negotiable' : 'Non-Negotiable'}</p>
            </div>

            <button 
              className="btn-contract btn-sign"
              onClick={handleAgree}
              disabled={!signature.trim()}
            >
              ✅ I Have Read & Agree - Sign & Continue to Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContractAgreement;