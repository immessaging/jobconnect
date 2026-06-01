import React from 'react';

function KYCCost({ type, onProceed }) {
  const costs = {
    bvn: { amount: 150, label: 'BVN Verification' },
    vnin: { amount: 100, label: 'NIN Verification' },
    address: { amount: 2000, label: 'Address Verification' }
  };
  
  const cost = costs[type];
  
  return (
    <div className="kyc-cost-card">
      <h4>🔐 {cost.label}</h4>
      <p>Cost: <strong>₦{cost.amount}</strong></p>
      <p className="text-muted">This fee is charged by the verification provider.</p>
      <button onClick={onProceed} className="btn btn-gold">
        Proceed (₦{cost.amount})
      </button>
    </div>
  );
}

export default KYCCost;