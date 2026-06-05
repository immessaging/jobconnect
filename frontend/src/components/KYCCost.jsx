import React, { useState } from 'react';
import './KYCCost.css';

function KYCCost({ type, onProceed, onCancel }) {
  const [agreed, setAgreed] = useState(false);

  const costs = {
    bvn: { 
      amount: 150, 
      label: 'BVN Verification',
      icon: '🏦',
      description: 'Bank Verification Number',
      provider: 'NIBSS (Nigeria Inter-Bank Settlement System)',
      details: [
        'Verify your identity via Bank Verification Number',
        'Confirms your name matches BVN records',
        'Required for agent verification',
        'One-time verification fee'
      ],
      processingTime: 'Instant',
      color: '#28a745'
    },
    vnin: { 
      amount: 100, 
      label: 'NIN Verification',
      icon: '🪪',
      description: 'National Identification Number',
      provider: 'NIMC (National Identity Management Commission)',
      details: [
        'Verify your identity via National ID',
        'Confirms your details match NIMC records',
        'Required for all verified users',
        'One-time verification fee'
      ],
      processingTime: '1-2 minutes',
      color: '#17a2b8'
    },
    address: { 
      amount: 2000, 
      label: 'Address Verification',
      icon: '📍',
      description: 'Physical Address Confirmation',
      provider: 'JobConnect Verification Agent',
      details: [
        'Physical verification of your address',
        'Agent visits your provided address',
        'Confirms you reside at the stated location',
        'Includes geolocation tagging'
      ],
      processingTime: '24-48 hours',
      color: '#d4a843'
    }
  };
  
  const cost = costs[type] || costs.bvn;

  if (!cost) {
    return (
      <div className="kyc-cost-card error">
        <p>❌ Invalid verification type selected.</p>
        {onCancel && <button onClick={onCancel} className="btn-back">Go Back</button>}
      </div>
    );
  }

  return (
    <div className="kyc-cost-card">
      {/* Header */}
      <div className="kyc-cost-header" style={{ borderTopColor: cost.color }}>
        <span className="kyc-icon">{cost.icon}</span>
        <div>
          <h4>{cost.label}</h4>
          <p className="kyc-description">{cost.description}</p>
        </div>
      </div>

      {/* Provider Info */}
      <div className="kyc-provider">
        <span className="provider-label">🔐 Verification Provider:</span>
        <span className="provider-name">{cost.provider}</span>
      </div>

      {/* Cost Display */}
      <div className="kyc-cost-display">
        <span className="cost-label">Verification Fee:</span>
        <span className="cost-amount">₦{cost.amount.toLocaleString()}</span>
      </div>

      <div className="kyc-processing">
        <span className="processing-label">⏱️ Processing Time:</span>
        <span className="processing-time">{cost.processingTime}</span>
      </div>

      {/* What's Included */}
      <div className="kyc-details">
        <h5>✅ What's Included:</h5>
        <ul>
          {cost.details.map((detail, index) => (
            <li key={index}>{detail}</li>
          ))}
        </ul>
      </div>

      {/* Important Note */}
      <div className="kyc-note">
        <p>⚠️ <strong>Important:</strong> This fee is charged by the verification provider and is non-refundable. 
        JobConnect does not profit from verification fees.</p>
      </div>

      {/* Agreement Checkbox */}
      <label className="kyc-agreement">
        <input 
          type="checkbox" 
          checked={agreed} 
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span>I understand that this is a verification fee paid to the provider and is non-refundable.</span>
      </label>

      {/* Action Buttons */}
      <div className="kyc-actions">
        {onCancel && (
          <button onClick={onCancel} className="btn-cancel">
            ← Cancel
          </button>
        )}
        <button 
          onClick={onProceed} 
          className="btn-proceed"
          disabled={!agreed}
          style={{ 
            background: agreed ? cost.color : '#ccc',
            cursor: agreed ? 'pointer' : 'not-allowed'
          }}
        >
          {cost.icon} Proceed with {cost.label} — ₦{cost.amount.toLocaleString()}
        </button>
      </div>

      {/* Breakdown */}
      <div className="kyc-breakdown">
        <p className="breakdown-title">💰 Fee Breakdown:</p>
        <div className="breakdown-row">
          <span>Verification Fee</span>
          <span>₦{cost.amount.toLocaleString()}</span>
        </div>
        <div className="breakdown-row">
          <span>JobConnect Service Fee</span>
          <span style={{ color: '#28a745' }}>₦0 (Free)</span>
        </div>
        <div className="breakdown-row total">
          <span>Total</span>
          <span>₦{cost.amount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default KYCCost;