import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getJobDetail } from '../services/api';
import ContractAgreement from '../components/ContractAgreement';
import PaymentModal from '../components/PaymentModal';
import './JobDetail.css';

function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [user, setUser] = useState(null);

  // Contract & Payment states
  const [showContract, setShowContract] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [commissionPercent, setCommissionPercent] = useState(15);
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [agreementData, setAgreementData] = useState(null);
  const [orgRevealed, setOrgRevealed] = useState(false);
  const [orgDetails, setOrgDetails] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    getJobDetail(id)
      .then(res => {
        const jobData = res.data.job;
        setJob(jobData);
        // Get commission from job data or default
        if (jobData) {
          setCommissionPercent(jobData.commission_percentage || 15);
          setIsNegotiable(jobData.is_negotiable !== false);
        }
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });
  }, [id]);

  const handleApply = () => {
    if (!user) {
      setShowAuthPrompt(true);
    } else {
      setShowContract(true);
    }
  };

  const handleAgreementSigned = (data) => {
    setAgreementData(data);
    setShowContract(false);
    // Small delay before showing payment
    setTimeout(() => setShowPayment(true), 500);
  };

  const handlePaymentComplete = (paymentData) => {
    setShowPayment(false);
    setOrgRevealed(true);
    // Reveal organization details
    setOrgDetails({
      name: job?.organization_name || 'Tech Corp Nigeria',
      contactPerson: job?.organization_contact_person || 'HR Manager',
      email: job?.organization_email || 'hr@techcorp.ng',
      phone: job?.organization_phone || '080-XXXX-XXXX'
    });
    
    // Save agreement to localStorage for tracking
    const agreements = JSON.parse(localStorage.getItem('agreements') || '[]');
    agreements.push({
      jobId: id,
      jobTitle: job?.title,
      ...data,
      orgDetails: orgDetails,
      paymentDate: new Date().toISOString(),
      status: 'paid',
      agentId: '00000000-0000-0000-0000-000000000010'
    });
    localStorage.setItem('agreements', JSON.stringify(agreements));
  };

  const formatSalary = (min, max, type) => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    });
    return `${formatter.format(min)} - ${formatter.format(max)} / ${type}`;
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading job details...</p>
    </div>
  );

  if (!job) return (
    <div className="error-container">
      <p>Job not found</p>
      <Link to="/jobs" className="btn btn-gold">Back to Jobs</Link>
    </div>
  );

  return (
    <div className="job-detail-page">
      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button className="modal-close" onClick={() => setShowAuthPrompt(false)}>✕</button>
            <div className="modal-icon">🔒</div>
            <h2>Sign In Required</h2>
            <p>You need to sign in or create an account to apply for this job and access full details.</p>
            <div className="modal-buttons">
              <Link to="/signin" className="btn btn-red">Sign In</Link>
              <Link to="/signup" className="btn btn-gold">Create Account</Link>
            </div>
          </div>
        </div>
      )}

      {/* Contract Agreement Modal */}
      <ContractAgreement
        job={job}
        isOpen={showContract}
        onClose={() => setShowContract(false)}
        onAgree={handleAgreementSigned}
        commissionPercentage={commissionPercent}
        isNegotiable={isNegotiable}
        monthlySalary={job.salary_max || 300000}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={agreementData?.commissionAmount || 0}
        onPaymentComplete={handlePaymentComplete}
      />

      <div className="job-detail-container">
        <Link to="/jobs" className="back-link">← Back to Jobs</Link>
        
        <div className="job-detail-header">
          <div className="job-title-section">
            <h1>{job.title}</h1>
            <div className="job-badges">
              {job.verified_badge && <span className="badge badge-verified">✓ Verified Job</span>}
              <span className="badge badge-gold">{job.status}</span>
            </div>
          </div>
          <div className="job-salary-large">
            💰 {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
          </div>
        </div>

        <div className="job-detail-grid">
          <div className="job-detail-main">
            <div className="detail-card">
              <h3>📋 Job Description</h3>
              <div className="detail-item">
                <span className="detail-label">Qualification:</span>
                <span>{job.qualification}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Experience:</span>
                <span>{job.experience}</span>
              </div>
              {job.skills && (
                <div className="detail-item">
                  <span className="detail-label">Required Skills:</span>
                  <span>{job.skills}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Salary Type:</span>
                <span className="badge badge-gold">{job.salary_type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Commission:</span>
                <span className="badge badge-gold">{commissionPercent}% {isNegotiable ? '(Negotiable)' : '(Fixed)'}</span>
              </div>
            </div>

            <div className="detail-card">
              <h3>💼 How It Works</h3>
              <div className="commission-info">
                <div className="commission-step">
                  <span className="step-dot">1</span>
                  <p>Click <strong>"I'm Available"</strong> to express interest</p>
                </div>
                <div className="commission-step">
                  <span className="step-dot">2</span>
                  <p>Read, accept terms, and sign the commission agreement</p>
                </div>
                <div className="commission-step">
                  <span className="step-dot">3</span>
                  <p>Pay one-time commission (held in secure escrow)</p>
                </div>
                <div className="commission-step">
                  <span className="step-dot">4</span>
                  <p>Organization details revealed - Contact them directly</p>
                </div>
                <div className="commission-step">
                  <span className="step-dot">5</span>
                  <p>Agent preps you for interview/exam if required</p>
                </div>
                <div className="commission-step">
                  <span className="step-dot">6</span>
                  <p>Start the job & release commission to agent</p>
                </div>
              </div>
            </div>

            {/* Organization Details Revealed After Payment */}
            {orgRevealed && orgDetails && (
              <div className="org-revealed-card">
                <h3>🎉 Organization Contact Details</h3>
                <div className="org-details-grid">
                  <div className="org-detail-item">
                    <span className="org-label">🏢 Company:</span>
                    <span className="org-value">{orgDetails.name}</span>
                  </div>
                  <div className="org-detail-item">
                    <span className="org-label">👤 Contact Person:</span>
                    <span className="org-value">{orgDetails.contactPerson}</span>
                  </div>
                  <div className="org-detail-item">
                    <span className="org-label">📧 Email:</span>
                    <span className="org-value">{orgDetails.email}</span>
                  </div>
                  <div className="org-detail-item">
                    <span className="org-label">📞 Phone:</span>
                    <span className="org-value">{orgDetails.phone}</span>
                  </div>
                </div>
                <div className="org-instructions">
                  <h4>📋 Next Steps:</h4>
                  <ol>
                    <li>Contact the organization using the details above</li>
                    <li>Your agent will prepare you for any interview or exam</li>
                    <li>Follow up with the agent for guidance</li>
                    <li>Once you start the job, go to your dashboard to release the commission</li>
                  </ol>
                </div>
                <Link to="/dashboard/seeker" className="btn btn-gold" style={{display:'inline-block',marginTop:'15px'}}>
                  Go to Dashboard →
                </Link>
              </div>
            )}
          </div>

          <div className="job-detail-sidebar">
            <div className="sidebar-card apply-card">
              <h3>Interested in this job?</h3>
              <p className="apply-info">
                {user ? (
                  <>Signed in as <strong>{user.email}</strong></>
                ) : (
                  <>Sign in to apply and view full job details</>
                )}
              </p>
              <button onClick={handleApply} className="btn btn-red apply-btn">
                {user ? '🚀 I\'m Available for This Job' : '🔒 Sign In to Apply'}
              </button>
              {!user && (
                <p className="signup-prompt">
                  Don't have an account? <Link to="/signup">Sign Up Now</Link>
                </p>
              )}
            </div>

            <div className="sidebar-card">
              <h3>🛡️ JobConnect Guarantee</h3>
              <ul className="guarantee-list">
                <li>✅ Verified job posting</li>
                <li>✅ Secure escrow payment</li>
                <li>✅ Transparent commission</li>
                <li>✅ Full refund within 21 days</li>
                <li>✅ Agent prepares you for interview</li>
              </ul>
            </div>

            <div className="sidebar-card fee-card">
  <h3>💰 Fee Breakdown</h3>
  <p style={{fontSize:'13px',color:'#666',marginBottom:'10px'}}>
    Commission is {commissionPercent}% of first month's salary (₦{Number(job?.salary_max).toLocaleString()})
  </p>
  <div className="fee-row">
    <span>Total Commission ({commissionPercent}%):</span>
    <span>₦{((Number(job?.salary_max) * commissionPercent) / 100).toLocaleString()}</span>
  </div>
  <div className="fee-row">
    <span>Platform Fee (17% of commission):</span>
    <span>₦{((Number(job?.salary_max) * commissionPercent * 0.17) / 100).toLocaleString()}</span>
  </div>
  <div className="fee-row">
    <span>Agent Payout (83% of commission):</span>
    <span>₦{((Number(job?.salary_max) * commissionPercent * 0.83) / 100).toLocaleString()}</span>
  </div>
  <p className="fee-note" style={{marginTop:'10px'}}>
    ⚠️ You ONLY pay the commission. Agent's 83% and platform's 17% are split from the commission you pay.
  </p>
</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetail;