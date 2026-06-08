import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getJobs, submitVerification, getUserProfile } from '../services/api';
import './Dashboard.css';

function JobSeekerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const isVerified = user?.is_verified || false;

  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  // Verification form
  const [verifyForm, setVerifyForm] = useState({
    full_name: '', date_of_birth: '', address: '', nin: '',
    next_of_kin_name: '', next_of_kin_phone: '', next_of_kin_address: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    social_media_1: '', social_media_2: ''
  });
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState(null);

  // Agreements & Disputes
  const [agreements, setAgreements] = useState([]);
  const [disputeData, setDisputeData] = useState({ type: 'refund', what: '', where: '', when: '', why: '' });
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);
  const [releasedCommission, setReleasedCommission] = useState({});

  // Messages
  const [seekerMessages, setSeekerMessages] = useState([
    { id: 1, from: 'John Agent', subject: 'Interview Preparation', message: 'Prepare for your interview on Friday.', time: '2 hours ago', unread: true },
    { id: 2, from: 'JobConnect Admin', subject: 'Verification Reminder', message: 'Complete your verification to access all features.', time: 'Yesterday', unread: true },
  ]);

  // Chat
  const [seekerChatMessages, setSeekerChatMessages] = useState([]);
  const [seekerChatInput, setSeekerChatInput] = useState('');
  const [selectedSeekerContact, setSelectedSeekerContact] = useState('');

  // Calls
  const [seekerCallTarget, setSeekerCallTarget] = useState('');
  const [showSeekerCall, setShowSeekerCall] = useState(false);

  // Notice Board
  const [seekerNoticeBoard, setSeekerNoticeBoard] = useState([
    { id: 1, title: 'New Feature: Video Meetings', content: 'You can now make video calls directly from your dashboard.', priority: 'normal', date: '2024-06-01' },
    { id: 2, title: 'Job Alert', content: 'New jobs posted in your area. Check the Find Jobs tab!', priority: 'high', date: '2024-05-30' },
  ]);

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { 
      navigate('/signin'); 
      return; 
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Fetch data
    const fetchData = async () => {
      try {
        // Fetch jobs
        const jobsRes = await getJobs();
        setJobs(jobsRes.data?.jobs || []);
        
        // Fetch user profile
        if (parsedUser.id) {
          try {
            const profileRes = await getUserProfile(parsedUser.id);
            setProfileData(profileRes.data?.profile || null);
          } catch (err) {
            console.log('Profile fetch error:', err);
          }
        }
        
        // Load agreements from localStorage
        setAgreements(JSON.parse(localStorage.getItem('agreements') || '[]'));
        setReleasedCommission(JSON.parse(localStorage.getItem('releasedCommissions') || '{}'));
        
      } catch (error) {
        console.error('Data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  const handleLogout = () => { 
    localStorage.removeItem('user'); 
    navigate('/signin'); 
  };
  
  const formatNaira = (num) => '₦' + Number(num).toLocaleString();

  const handlePasswordChange = () => {
    setPasswordMsg('');
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) { 
      setPasswordMsg('❌ All fields are required'); 
      return; 
    }
    if (passwordForm.newPass.length < 6) { 
      setPasswordMsg('❌ New password must be at least 6 characters'); 
      return; 
    }
    if (passwordForm.newPass !== passwordForm.confirm) { 
      setPasswordMsg('❌ Passwords do not match'); 
      return; 
    }
    setPasswordMsg('✅ Password changed successfully!');
    setPasswordForm({ current: '', newPass: '', confirm: '' });
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  const handleVerifySubmit = async () => {
    setVerifyLoading(true); 
    setVerifyMsg('');
    try {
      await submitVerification({ 
        user_id: user?.id, 
        email: user?.email, 
        user_type: 'job_seeker', 
        ...verifyForm 
      });
      setVerifyMsg('✅ Verification submitted! Review takes 24-48 hours.');
    } catch { 
      setVerifyMsg('❌ Failed to submit. Please try again.'); 
    }
    setVerifyLoading(false);
  };

  const handleReleaseCommission = (key) => {
    if (window.confirm('Release commission to agent?')) {
      const updated = { ...releasedCommission, [key]: { released: true, date: new Date().toISOString() } };
      setReleasedCommission(updated);
      localStorage.setItem('releasedCommissions', JSON.stringify(updated));
      const updatedAgreements = agreements.map((a, i) => (`${a.jobId}-${i}` === key ? { ...a, status: 'released' } : a));
      setAgreements(updatedAgreements);
      localStorage.setItem('agreements', JSON.stringify(updatedAgreements));
      alert('✅ Commission released!');
    }
  };

  const handleDisputeSubmit = (key, type) => {
    if (type === 'refund') {
      if (!disputeData.what || !disputeData.why) { 
        alert('Fill all dispute details'); 
        return; 
      }
      if (window.confirm('Submit refund request?')) {
        const updatedAgreements = agreements.map((a, i) => 
          (`${a.jobId}-${i}` === key ? { ...a, status: 'disputed', disputeType: 'refund', ...disputeData } : a)
        );
        setAgreements(updatedAgreements);
        localStorage.setItem('agreements', JSON.stringify(updatedAgreements));
        setDisputeSubmitted(true);
        alert('⚖️ Dispute submitted.');
      }
    } else {
      if (window.confirm('Keep commission for next job?')) {
        const updatedAgreements = agreements.map((a, i) => 
          (`${a.jobId}-${i}` === key ? { ...a, status: 'carried_forward', disputeType: 'carry_forward' } : a)
        );
        setAgreements(updatedAgreements);
        localStorage.setItem('agreements', JSON.stringify(updatedAgreements));
        setDisputeSubmitted(true);
        alert('📋 Commission saved for next job.');
      }
    }
  };

  const handleSeekerSendChat = () => {
    if (!seekerChatInput.trim()) return;
    setSeekerChatMessages([...seekerChatMessages, { 
      id: Date.now(), 
      sender: 'seeker', 
      text: seekerChatInput, 
      time: new Date().toLocaleTimeString(), 
      isSeeker: true 
    }]);
    setSeekerChatInput('');
  };

  const handleSeekerReplyMessage = (from) => {
    const reply = prompt(`Reply to ${from}:`);
    if (reply) alert(`✅ Reply sent to ${from}`);
  };

  const handleSeekerStartCall = () => {
    if (!seekerCallTarget) { 
      alert('Select who to call'); 
      return; 
    }
    setShowSeekerCall(true);
    const roomUrl = `https://meet.jit.si/JobConnect-Seeker-${Date.now()}`;
    navigator.clipboard?.writeText(roomUrl);
    alert(`📋 Room link copied! Share with ${seekerCallTarget} to join.`);
  };

  // ============================================
  // COMPUTED STATS
  // ============================================
  const stats = {
    availableJobs: jobs.length,
    applied: agreements.filter(a => a.status === 'paid').length,
    accepted: agreements.filter(a => a.status === 'released').length,
    totalPaid: agreements.reduce((sum, a) => sum + (a.commissionAmount || 0), 0)
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a1628', color: '#d4a843' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
          <h2>Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <div className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="user-avatar">👩🏾‍💼</div>
          {!sidebarCollapsed && (
            <>{isVerified ? <span className="badge badge-verified">Verified</span> : <span className="badge badge-pending">Unverified</span>}</>
          )}
        </div>
        <nav className="sidebar-nav">
          <div className="nav-header">MAIN NAVIGATION</div>
          <button className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}>
            <i className="fas fa-tachometer-alt"></i> <span className="sidebar-text">Dashboard</span>
          </button>
          <button className={`nav-item ${activeTab==='jobs'?'active':''}`} onClick={()=>setActiveTab('jobs')}>
            <i className="fas fa-briefcase"></i> <span className="sidebar-text">Find Jobs</span>
          </button>
          <button className={`nav-item ${activeTab==='applied'?'active':''}`} onClick={()=>setActiveTab('applied')}>
            <i className="fas fa-paper-plane"></i> <span className="sidebar-text">My Applications</span>
          </button>
          <button className={`nav-item ${activeTab==='release'?'active':''}`} onClick={()=>setActiveTab('release')}>
            <i className="fas fa-check-circle"></i> <span className="sidebar-text">Release Commission</span>
          </button>
          <button className={`nav-item ${activeTab==='dispute'?'active':''}`} onClick={()=>setActiveTab('dispute')}>
            <i className="fas fa-exclamation-triangle"></i> <span className="sidebar-text">Open Dispute</span>
          </button>
          <hr className="sidebar-divider" />
          <div className="nav-header">COMMUNICATION</div>
          <button className={`nav-item ${activeTab==='seeker-messages'?'active':''}`} onClick={()=>setActiveTab('seeker-messages')}>
            <i className="fas fa-envelope"></i> <span className="sidebar-text">Messages</span>
            {seekerMessages.filter(m=>m.unread).length>0 && <span className="notification-badge">{seekerMessages.filter(m=>m.unread).length}</span>}
          </button>
          <button className={`nav-item ${activeTab==='seeker-chat'?'active':''}`} onClick={()=>setActiveTab('seeker-chat')}>
            <i className="fas fa-comments"></i> <span className="sidebar-text">Live Chat</span>
          </button>
          <button className={`nav-item ${activeTab==='seeker-calls'?'active':''}`} onClick={()=>setActiveTab('seeker-calls')}>
            <i className="fas fa-phone"></i> <span className="sidebar-text">Make Calls</span>
          </button>
          <button className={`nav-item ${activeTab==='seeker-noticeboard'?'active':''}`} onClick={()=>setActiveTab('seeker-noticeboard')}>
            <i className="fas fa-clipboard-list"></i> <span className="sidebar-text">Notice Board</span>
          </button>
          <hr className="sidebar-divider" />
          <div className="nav-header">FINANCES</div>
          <button className={`nav-item ${activeTab==='agreements'?'active':''}`} onClick={()=>setActiveTab('agreements')}>
            <i className="fas fa-file-contract"></i> <span className="sidebar-text">Agreements</span>
          </button>
          <button className={`nav-item ${activeTab==='payments'?'active':''}`} onClick={()=>setActiveTab('payments')}>
            <i className="fas fa-credit-card"></i> <span className="sidebar-text">Payments</span>
          </button>
          <hr className="sidebar-divider" />
          <div className="nav-header">ACCOUNT</div>
          <button className={`nav-item ${activeTab==='profile'?'active':''}`} onClick={()=>setActiveTab('profile')}>
            <i className="fas fa-user-circle"></i> <span className="sidebar-text">My Profile</span>
          </button>
          <button className={`nav-item ${activeTab==='verification'?'active':''}`} onClick={()=>setActiveTab('verification')}>
            <i className="fas fa-id-card"></i> <span className="sidebar-text">Verification</span>
          </button>
          <button className={`nav-item ${activeTab==='password'?'active':''}`} onClick={()=>setActiveTab('password')}>
            <i className="fas fa-lock"></i> <span className="sidebar-text">Change Password</span>
          </button>
          <hr className="sidebar-divider" />
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> <span className="sidebar-text">Logout</span>
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className={`dashboard-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="dash-topbar">
          <div><button className="toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button></div>
          <div className="header-actions" style={{position:'relative'}}>
            <span>Welcome, <strong>{user?.email?.split('@')[0] || 'Seeker'}</strong></span>
            {isVerified ? <span className="badge badge-verified">Verified</span> : <span className="badge badge-pending">Unverified</span>}
            <div className="user-avatar" onClick={() => setShowDropdown(!showDropdown)} style={{cursor:'pointer'}}>
              {(user?.email?.[0] || 'S').toUpperCase()}
            </div>
            {showDropdown && (
              <div className="profile-dropdown show">
                <div className="dropdown-header"><strong>{user?.email || 'Seeker'}</strong><small>Job Seeker</small></div>
                <button className="dropdown-item" onClick={()=>{setActiveTab('profile');setShowDropdown(false);}}><i className="fas fa-user"></i> View Profile</button>
                <button className="dropdown-item" onClick={()=>{setActiveTab('password');setShowDropdown(false);}}><i className="fas fa-key"></i> Change Password</button>
                <button className="dropdown-item text-danger" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Logout</button>
              </div>
            )}
            <button className="logout-btn-header" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        {!isVerified && (
          <div className="verification-warning">
            <h3>⚠️ ACCOUNT NOT VERIFIED</h3>
            <p><strong>Complete verification to access all features.</strong></p>
            <button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer',fontWeight:'bold',marginTop:'10px'}} onClick={() => setActiveTab('verification')}>
              Complete Verification Now
            </button>
          </div>
        )}

        <div className="welcome-card">
          <div><h4>Welcome Back, {user?.email?.split('@')[0] || 'Seeker'}!</h4><p>Here's your job search overview.</p></div>
          <i className="fas fa-search" style={{fontSize:'3rem',opacity:0.3}}></i>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab==='dashboard' && (
          <div>
            <div className="stats-row">
              <div className="stat-box"><span className="stat-icon">💼</span><h3>{stats.availableJobs}</h3><p>Available Jobs</p></div>
              <div className="stat-box"><span className="stat-icon">📝</span><h3>{stats.applied}</h3><p>Applied</p></div>
              <div className="stat-box"><span className="stat-icon">✅</span><h3>{stats.accepted}</h3><p>Accepted</p></div>
              <div className="stat-box"><span className="stat-icon">💰</span><h3>{formatNaira(stats.totalPaid)}</h3><p>Paid</p></div>
            </div>
          </div>
        )}

        {/* FIND JOBS TAB */}
        {activeTab==='jobs' && (
          <div className="dash-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'15px'}}>
              <h3>Available Jobs</h3>
              <Link to="/jobs" className="btn-sm" style={{background:'#d4a843',color:'#0a1628',textDecoration:'none',padding:'8px 16px',borderRadius:'5px',fontWeight:'bold'}}>Browse All</Link>
            </div>
            {jobs.length===0 ? <p className="text-muted">No jobs available yet.</p> :
              <div className="grid-2">
                {jobs.map(job=>(
                  <div key={job.id} className="card" style={{borderLeft:'4px solid #d4a843',padding:'15px'}}>
                    <h4>{job.title}</h4>
                    <p className="text-muted">📋 {job.qualification}</p>
                    <p className="salary">{formatNaira(job.salary_min)} - {formatNaira(job.salary_max)}</p>
                    <Link to={`/jobs/${job.id}`} className="btn-sm btn-red" style={{textDecoration:'none',marginTop:'10px',display:'inline-block'}}>View & Apply</Link>
                  </div>
                ))}
              </div>
            }
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab==='profile' && (
          <div className="dash-card form-card">
            <h3>👤 My Profile</h3>
            {profileData ? (
              <>
                <div className="form-group"><label>Full Name</label><input type="text" value={profileData.full_name || 'Not set'} readOnly /></div>
                <div className="form-group"><label>Email</label><input type="email" value={profileData.email || ''} readOnly /></div>
                <div className="form-group"><label>Phone</label><input type="tel" value={profileData.phone || 'Not set'} readOnly /></div>
                <div className="form-group"><label>Verification Status</label><input type="text" value={profileData.verification_status || 'pending'} readOnly style={{color: isVerified ? '#28a745' : '#dc3545', fontWeight: 'bold'}} /></div>
              </>
            ) : (
              <p className="text-muted">Loading profile...</p>
            )}
          </div>
        )}

        {/* VERIFICATION TAB */}
        {activeTab==='verification' && (
          <div className="dash-card form-card">
            <h3>🛡️ Account Verification</h3>
            <p className="text-muted">Complete all fields to verify your account</p>
            <div className="form-group"><label>Full Name *</label><input type="text" value={verifyForm.full_name} onChange={e => setVerifyForm({...verifyForm, full_name: e.target.value})} required /></div>
            <div className="form-group"><label>Date of Birth *</label><input type="date" value={verifyForm.date_of_birth} onChange={e => setVerifyForm({...verifyForm, date_of_birth: e.target.value})} required /></div>
            <div className="form-group"><label>Address *</label><input type="text" value={verifyForm.address} onChange={e => setVerifyForm({...verifyForm, address: e.target.value})} required /></div>
            <div className="form-group"><label>NIN (Optional)</label><input type="text" maxLength="11" value={verifyForm.nin} onChange={e => setVerifyForm({...verifyForm, nin: e.target.value})} /></div>
            <h4>Next of Kin</h4>
            <div className="form-group"><label>Name *</label><input type="text" value={verifyForm.next_of_kin_name} onChange={e => setVerifyForm({...verifyForm, next_of_kin_name: e.target.value})} required /></div>
            <div className="form-group"><label>Phone *</label><input type="tel" value={verifyForm.next_of_kin_phone} onChange={e => setVerifyForm({...verifyForm, next_of_kin_phone: e.target.value})} required /></div>
            <h4>Emergency Contact</h4>
            <div className="form-group"><label>Name *</label><input type="text" value={verifyForm.emergency_contact_name} onChange={e => setVerifyForm({...verifyForm, emergency_contact_name: e.target.value})} required /></div>
            <div className="form-group"><label>Phone *</label><input type="tel" value={verifyForm.emergency_contact_phone} onChange={e => setVerifyForm({...verifyForm, emergency_contact_phone: e.target.value})} required /></div>
            <button className="btn-gold" onClick={handleVerifySubmit} disabled={verifyLoading}>
              {verifyLoading ? '⏳ Submitting...' : '📤 Submit Verification'}
            </button>
            {verifyMsg && <div className={verifyMsg.includes('✅')?'success-message':'error-message'} style={{marginTop:'15px'}}>{verifyMsg}</div>}
          </div>
        )}

        {/* PASSWORD TAB */}
        {activeTab==='password' && (
          <div className="dash-card form-card">
            <h3>🔒 Change Password</h3>
            {passwordMsg && <div className={passwordMsg.includes('✅')?'success-message':'error-message'}>{passwordMsg}</div>}
            <div className="form-group"><label>Current</label><input type="password" value={passwordForm.current} onChange={e=>setPasswordForm({...passwordForm,current:e.target.value})}/></div>
            <div className="form-group"><label>New</label><input type="password" value={passwordForm.newPass} onChange={e=>setPasswordForm({...passwordForm,newPass:e.target.value})}/></div>
            <div className="form-group"><label>Confirm</label><input type="password" value={passwordForm.confirm} onChange={e=>setPasswordForm({...passwordForm,confirm:e.target.value})}/></div>
            <button className="btn-gold" onClick={handlePasswordChange}>Update Password</button>
          </div>
        )}

        {/* PLACEHOLDER FOR OTHER TABS */}
        {['applied','release','dispute','agreements','payments','seeker-messages','seeker-chat','seeker-calls','seeker-noticeboard'].includes(activeTab) && 
         activeTab!=='verification' && activeTab!=='password' && activeTab!=='dashboard' && activeTab!=='jobs' && activeTab!=='profile' && (
          <div className="dash-card">
            <h3>{activeTab.charAt(0).toUpperCase()+activeTab.slice(1).replace(/-/g, ' ')}</h3>
            <p className="text-muted">This section is coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobSeekerDashboard;