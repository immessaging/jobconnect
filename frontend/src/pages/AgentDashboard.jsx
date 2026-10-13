import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAgentJobs, postJob, submitVerification, uploadToCloudinary, getUserProfile } from '../services/api';
import './Dashboard.css';

function AgentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [agentProfileId, setAgentProfileId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLocationOverlay, setShowLocationOverlay] = useState(true);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [locationDisplay, setLocationDisplay] = useState('Waiting for GPS location...');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    agent_id: '',
    job_title: '',
    qualification_requirements: '',
    experience_requirements: '',
    required_skills: '',
    salary_range_min: '',
    salary_range_max: '',
    salary_type: 'monthly',
    organization_name: '',
    organization_contact_person: '',
    organization_email: '',
    organization_phone: '',
    commission_percentage: 25,
    is_negotiable: true,
    has_exam: false,
    has_interview: false
  });

  const isVerified = user?.is_verified || false;

  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  const [agentMessages, setAgentMessages] = useState([]);

  const [verifyForm, setVerifyForm] = useState({
    full_name: '', date_of_birth: '', address: '', nin: '', bvn: '',
    bank_name: '', account_number: '',
    guarantor_name: '', guarantor_phone: '', guarantor_address: '',
    next_of_kin_name: '', next_of_kin_phone: '', next_of_kin_address: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    social_media_1: '', social_media_2: ''
  });
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [commissionPercent, setCommissionPercent] = useState(15);
  const [isNegotiable, setIsNegotiable] = useState(true);

  const [earnings, setEarnings] = useState([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [nextPayout, setNextPayout] = useState('');

  const [agentDisputes, setAgentDisputes] = useState([]);
  const [applications, setApplications] = useState([]);

  const [agentChatMessages, setAgentChatMessages] = useState([]);
  const [agentChatInput, setAgentChatInput] = useState('');
  const [selectedChatContact, setSelectedChatContact] = useState('');
  const [agentCallTarget, setAgentCallTarget] = useState('');
  const [agentNoticeBoard, setAgentNoticeBoard] = useState([
    { id: 1, title: 'System Maintenance', content: 'Scheduled maintenance on May 5th, 2AM-4AM WAT', priority: 'high', date: '2024-05-03' },
    { id: 2, title: 'New Feature: Video Meetings', content: 'Video meetings now available', priority: 'normal', date: '2024-05-01' },
  ]);
  const [showAgentCall, setShowAgentCall] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // ============================================
  // HELPER: Unwrap nested API responses
  // ============================================
  const unwrap = (res) => res?.data?.data || res?.data || {};

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userData) {
      navigate('/signin');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Use user.id as the agent_id (backend expects users.id for job_listings.agent_id)
    setAgentProfileId(parsedUser.id);
    setForm(prev => ({ ...prev, agent_id: parsedUser.id }));

    const initDashboard = async () => {
      setLoading(true);
      try {
        await loadJobs(parsedUser.id);

        if (parsedUser.id) {
          try {
            const profileRes = await getUserProfile(parsedUser.id);
            setProfileData(unwrap(profileRes).profile || null);
          } catch (err) {
            console.log('Profile fetch error:', err);
          }
        }

        loadEarnings();
        calculateNextPayout();
      } catch (error) {
        console.error('Dashboard init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
    setTimeout(() => requestLocationAccess(), 1000);
  }, []);

  // ============================================
  // DATA LOADING
  // ============================================
  const loadJobs = async (profileId) => {
    const id = profileId || agentProfileId;
    if (!id) return;
    try {
      const res = await getAgentJobs(id);
      setJobs(unwrap(res).jobs || []);
    } catch (error) {
      console.log('Error loading jobs:', error);
    }
  };

  const loadEarnings = () => {
    const saved = JSON.parse(localStorage.getItem('agentEarnings') || '[]');
    setEarnings(saved);
    setTotalEarned(saved.reduce((s, e) => s + (e.amount || 0), 0));
  };

  const calculateNextPayout = () => {
    const now = new Date();
    let payout = new Date(now.getFullYear(), now.getMonth(), 25);
    if (now > payout) payout = new Date(now.getFullYear(), now.getMonth() + 1, 25);
    setNextPayout(payout.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/signin');
  };

  const formatNaira = (num) => '₦' + Number(num).toLocaleString();

  const handleVerifySubmit = async () => {
    setVerifyLoading(true);
    setVerifyMsg('');
    try {
      let passportUrl = '', photoUrl = '';
      const files = document.querySelectorAll('input[type=file]');
      if (files[0]?.files[0]) passportUrl = await uploadToCloudinary(files[0].files[0]);
      if (files[1]?.files[0]) photoUrl = await uploadToCloudinary(files[1].files[0]);
      await submitVerification({
        user_id: user?.id, email: user?.email, user_type: 'agent',
        passport_photo: passportUrl, government_id_photo: photoUrl, ...verifyForm
      });
      setVerifyMsg('✅ Verification submitted! Review takes 24-48 hours.');
    } catch {
      setVerifyMsg('❌ Failed to submit.');
    }
    setVerifyLoading(false);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setMsg('');

    if (!form.job_title || !form.organization_name || !form.qualification_requirements ||
        !form.experience_requirements || !form.salary_range_min || !form.salary_range_max) {
      setMsg('❌ Please fill all required fields');
      return;
    }

    if (!agentProfileId) {
      setMsg('❌ User not logged in properly. Please sign in again.');
      return;
    }

    try {
      await postJob({
        ...form,
        agent_id: agentProfileId,
        commission_percentage: commissionPercent,
        is_negotiable: isNegotiable
      });

      setMsg('✅ Job posted! Commission: ' + commissionPercent + '% ' + (isNegotiable ? '(Negotiable)' : '(Fixed)'));

      loadJobs(agentProfileId);

      setForm({
        ...form,
        job_title: '',
        qualification_requirements: '',
        experience_requirements: '',
        required_skills: '',
        salary_range_min: '',
        salary_range_max: '',
        organization_name: '',
        organization_contact_person: '',
        organization_email: '',
        organization_phone: ''
      });
    } catch (error) {
      console.error('❌ Post job error:', error);
      setMsg('❌ Failed to post job. Please try again.');
    }
  };

  const requestLocationAccess = () => {
    if (!navigator.geolocation) {
      setShowLocationOverlay(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationDisplay(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setShowLocationOverlay(false);
      },
      () => setShowLocationOverlay(false),
      { enableHighAccuracy: true, timeout: 20000 }
    );
  };

  const handlePasswordChange = () => {
    setPasswordMsg('');
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
      setPasswordMsg('❌ All fields required');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      setPasswordMsg('❌ Min 6 characters');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordMsg('❌ Passwords do not match');
      return;
    }
    setPasswordMsg('✅ Password changed!');
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  const handleAgentSendChat = () => {
    if (!agentChatInput.trim()) return;
    setAgentChatMessages([...agentChatMessages, {
      id: Date.now(),
      sender: 'agent',
      text: agentChatInput,
      time: new Date().toLocaleTimeString(),
      isAgent: true
    }]);
    setAgentChatInput('');
  };

  const handleReplyMessage = (from) => {
    const reply = prompt(`Reply to ${from}:`);
    if (reply) alert(`✅ Reply sent to ${from}`);
  };

  const handleStartCall = () => {
    if (!agentCallTarget) {
      alert('Select a user to call');
      return;
    }
    setShowAgentCall(true);
    const roomUrl = `https://meet.jit.si/JobConnect-Agent-${Date.now()}`;
    navigator.clipboard?.writeText(roomUrl);
    alert(`📋 Room link copied! Share with ${agentCallTarget} to join.\n\n${roomUrl}`);
  };

  // ============================================
  // COMPUTED STATS
  // ============================================
  const stats = {
    activeListings: jobs.filter(j => j.status === 'active').length,
    filledJobs: jobs.filter(j => j.status === 'filled').length,
    totalApplications: jobs.reduce((s, j) => s + (j.applications || 0), 0),
    totalCommissionEarned: totalEarned
  };

  // ============================================
  // LOADING
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

  return (
    <div className="dashboard">
      {showLocationOverlay && (
        <div className="location-overlay">
          <div className="location-modal">
            <div className="icon-circle"><i className="fas fa-map-marker-alt"></i></div>
            <h3>Location Access Required</h3>
            <p>Please allow GPS location access.</p>
            <p className="warning-text">Dashboard locked until permission granted.</p>
            <button className="btn-allow" onClick={requestLocationAccess}>Allow Location</button>
          </div>
        </div>
      )}

      <div className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="user-avatar">🤝</div>
          {!sidebarCollapsed && (
            <>{isVerified ? <span className="badge badge-verified">Verified</span> : <span className="badge badge-pending">Unverified</span>}</>
          )}
        </div>
        <nav className="sidebar-nav">
          <div className="nav-header">MAIN</div>
          <button className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}>
            <i className="fas fa-tachometer-alt"></i> Dashboard
          </button>
          <button className={`nav-item ${activeTab==='jobs'?'active':''}`} onClick={()=>setActiveTab('jobs')}>
            <i className="fas fa-briefcase"></i> My Jobs
          </button>
          <button className={`nav-item ${activeTab==='post'?'active':''}`} onClick={()=>setActiveTab('post')}>
            <i className="fas fa-plus-circle"></i> Post Job
          </button>
          <button className={`nav-item ${activeTab==='applications'?'active':''}`} onClick={()=>setActiveTab('applications')}>
            <i className="fas fa-users"></i> Applications
          </button>
          <button className={`nav-item ${activeTab==='disputes'?'active':''}`} onClick={()=>setActiveTab('disputes')}>
            <i className="fas fa-gavel"></i> Disputes
          </button>
          <hr className="sidebar-divider" />
          <div className="nav-header">FINANCES</div>
          <button className={`nav-item ${activeTab==='earnings'?'active':''}`} onClick={()=>setActiveTab('earnings')}>
            <i className="fas fa-chart-line"></i> Earnings
          </button>
          <button className={`nav-item ${activeTab==='payout'?'active':''}`} onClick={()=>setActiveTab('payout')}>
            <i className="fas fa-money-bill-wave"></i> Payout
          </button>
          <hr className="sidebar-divider" />
          <div className="nav-header">ACCOUNT</div>
          <button className={`nav-item ${activeTab==='verification'?'active':''}`} onClick={()=>setActiveTab('verification')}>
            <i className="fas fa-id-card"></i> Verification
          </button>
          <button className={`nav-item ${activeTab==='profile'?'active':''}`} onClick={()=>setActiveTab('profile')}>
            <i className="fas fa-user-circle"></i> Profile
          </button>
          <button className={`nav-item ${activeTab==='password'?'active':''}`} onClick={()=>setActiveTab('password')}>
            <i className="fas fa-lock"></i> Password
          </button>
          <hr className="sidebar-divider" />
          <div className="nav-header">COMMUNICATION</div>
          <button className={`nav-item ${activeTab==='agent-messages'?'active':''}`} onClick={()=>setActiveTab('agent-messages')}>
            <i className="fas fa-envelope"></i> <span className="sidebar-text">Messages</span>
          </button>
          <button className={`nav-item ${activeTab==='agent-chat'?'active':''}`} onClick={()=>setActiveTab('agent-chat')}>
            <i className="fas fa-comments"></i> <span className="sidebar-text">Live Chat</span>
          </button>
          <button className={`nav-item ${activeTab==='agent-calls'?'active':''}`} onClick={()=>setActiveTab('agent-calls')}>
            <i className="fas fa-phone"></i> <span className="sidebar-text">Calls</span>
          </button>
          <button className={`nav-item ${activeTab==='agent-noticeboard'?'active':''}`} onClick={()=>setActiveTab('agent-noticeboard')}>
            <i className="fas fa-clipboard-list"></i> <span className="sidebar-text">Notice Board</span>
          </button>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </nav>
      </div>

      <div className={`dashboard-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="dash-topbar">
          <div>
            <button className="toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button>
          </div>
          <div className="header-actions">
            {isVerified ? <span className="badge badge-verified">Verified</span> : <span className="badge badge-pending">Unverified</span>}
            <button className="logout-btn-header" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        {gpsCoords && <div className="geo-info">📍 {locationDisplay}</div>}

        {!isVerified && (
          <div className="verification-warning">
            <h3>⚠️ NOT VERIFIED</h3>
            <p><strong>Complete verification to access all features.</strong></p>
            <button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>setActiveTab('verification')}>
              Complete Verification Now
            </button>
          </div>
        )}

        <div className="welcome-card">
          <div><h4>Welcome, {user?.email?.split('@')[0] || 'Agent'}!</h4></div>
        </div>

        {msg && <div className={msg.includes('✅')?'success-message':'error-message'}>{msg}</div>}

        {activeTab==='dashboard' && (
          <div>
            <div className="stats-row">
              <div className="stat-box"><span className="stat-icon">💼</span><h3>{stats.activeListings}</h3><p>Active</p></div>
              <div className="stat-box"><span className="stat-icon">✅</span><h3>{stats.filledJobs}</h3><p>Filled</p></div>
              <div className="stat-box"><span className="stat-icon">👥</span><h3>{stats.totalApplications}</h3><p>Applicants</p></div>
              <div className="stat-box"><span className="stat-icon">💰</span><h3>{formatNaira(stats.totalCommissionEarned)}</h3><p>Earned</p></div>
            </div>
            <div className="dash-card">
              <h3>Next Payout: {nextPayout}</h3>
            </div>
          </div>
        )}

        {activeTab==='jobs' && (
          <div className="dash-card">
            <h3>My Jobs</h3>
            {jobs.length===0 ? (
              <p className="text-muted">No jobs posted yet.</p>
            ) : (
              <div className="grid-2">
                {jobs.map(job => (
                  <div key={job.id} className="card" style={{borderLeft:'4px solid #d4a843',padding:'15px'}}>
                    <h4>{job.title}</h4>
                    <p className="text-muted">🏢 {job.organization}</p>
                    <p className="salary">{formatNaira(job.salary_min)} - {formatNaira(job.salary_max)}</p>
                    <p>👥 {job.applications || 0} applications</p>
                    <span className={`badge ${job.status==='active'?'badge-verified':'badge-pending'}`}>{job.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab==='post' && (
          <div className="dash-card form-card">
            <h3>📢 Post New Job</h3>
            <p className="text-muted">Fill in all required fields to post a new job listing</p>

            <form onSubmit={handlePost}>
              <div className="form-group">
                <label>Job Title *</label>
                <input type="text" placeholder="e.g., Senior Software Developer" value={form.job_title} onChange={e => setForm({...form, job_title: e.target.value})} required />
              </div>

              <h4 style={{marginTop:'20px', color:'#0a1628', borderBottom:'2px solid #d4a843', paddingBottom:'8px'}}>🏢 Organization Details</h4>

              <div className="form-group">
                <label>Organization Name *</label>
                <input type="text" placeholder="e.g., Tech Corp Nigeria" value={form.organization_name} onChange={e => setForm({...form, organization_name: e.target.value})} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Person *</label>
                  <input type="text" placeholder="e.g., HR Manager" value={form.organization_contact_person} onChange={e => setForm({...form, organization_contact_person: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input type="tel" placeholder="e.g., 08012345678" value={form.organization_phone} onChange={e => setForm({...form, organization_phone: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label>Contact Email *</label>
                <input type="email" placeholder="e.g., hr@techcorp.ng" value={form.organization_email} onChange={e => setForm({...form, organization_email: e.target.value})} required />
              </div>

              <h4 style={{marginTop:'20px', color:'#0a1628', borderBottom:'2px solid #d4a843', paddingBottom:'8px'}}>📋 Job Requirements</h4>

              <div className="form-group">
                <label>Qualification Requirements *</label>
                <textarea rows="3" placeholder="e.g., B.Sc. in Computer Science, 2-3 years experience" value={form.qualification_requirements} onChange={e => setForm({...form, qualification_requirements: e.target.value})} required />
              </div>

              <div className="form-group">
                <label>Experience Requirements *</label>
                <textarea rows="3" placeholder="e.g., Minimum 3 years in software development" value={form.experience_requirements} onChange={e => setForm({...form, experience_requirements: e.target.value})} required />
              </div>

              <div className="form-group">
                <label>Required Skills</label>
                <input type="text" placeholder="e.g., React, Node.js, PostgreSQL" value={form.required_skills} onChange={e => setForm({...form, required_skills: e.target.value})} />
              </div>

              <h4 style={{marginTop:'20px', color:'#0a1628', borderBottom:'2px solid #d4a843', paddingBottom:'8px'}}>💰 Salary Details</h4>

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Salary (₦) *</label>
                  <input type="number" placeholder="e.g., 300000" value={form.salary_range_min} onChange={e => setForm({...form, salary_range_min: e.target.value})} min="0" required />
                </div>
                <div className="form-group">
                  <label>Maximum Salary (₦) *</label>
                  <input type="number" placeholder="e.g., 500000" value={form.salary_range_max} onChange={e => setForm({...form, salary_range_max: e.target.value})} min="0" required />
                </div>
              </div>

              <div className="form-group">
                <label>Salary Type</label>
                <select value={form.salary_type || 'monthly'} onChange={e => setForm({...form, salary_type: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'5px', border:'2px solid #e0e0e0'}}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="hourly">Hourly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <h4 style={{marginTop:'20px', color:'#0a1628', borderBottom:'2px solid #d4a843', paddingBottom:'8px'}}>💎 Commission Settings</h4>

              <div className="commission-setting-card" style={{background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '20px'}}>
                <div className="form-group">
                  <label>Commission Percentage (5-35%) *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="range" min="5" max="35" value={commissionPercent} onChange={e => setCommissionPercent(Number(e.target.value))} style={{ flex: 1 }} />
                    <span style={{fontSize: '18px', fontWeight: 'bold', color: '#0a1628', minWidth: '50px', textAlign: 'center', background: '#d4a843', color: '#fff', padding: '5px 10px', borderRadius: '5px'}}>
                      {commissionPercent}%
                    </span>
                  </div>
                  <small style={{color:'#666', display:'block', marginTop:'5px'}}>
                    Estimated commission: ₦{((Number(form.salary_range_max) * commissionPercent) / 100).toLocaleString()}
                  </small>
                </div>

                <div style={{marginTop:'15px'}}>
                  <label style={{display:'block', marginBottom:'10px', fontWeight:'bold'}}>Commission Type</label>
                  <label style={{marginRight:'20px', cursor:'pointer'}}>
                    <input type="radio" checked={isNegotiable} onChange={() => setIsNegotiable(true)} style={{marginRight:'5px'}} />
                    🔄 Negotiable
                  </label>
                  <br/>
                  <label style={{cursor:'pointer', marginTop:'8px', display:'inline-block'}}>
                    <input type="radio" checked={!isNegotiable} onChange={() => setIsNegotiable(false)} style={{marginRight:'5px'}} />
                    🔒 Fixed
                  </label>
                </div>
              </div>

              <h4 style={{marginTop:'20px', color:'#0a1628', borderBottom:'2px solid #d4a843', paddingBottom:'8px'}}>⚙️ Additional Options</h4>

              <div className="form-row" style={{marginBottom:'20px'}}>
                <label style={{cursor:'pointer', marginRight:'20px'}}>
                  <input type="checkbox" checked={form.has_interview} onChange={e => setForm({...form, has_interview: e.target.checked})} style={{marginRight:'5px'}} />
                  🎯 Has Interview
                </label>
                <label style={{cursor:'pointer'}}>
                  <input type="checkbox" checked={form.has_exam} onChange={e => setForm({...form, has_exam: e.target.checked})} style={{marginRight:'5px'}} />
                  📝 Has Exam
                </label>
              </div>

              <button type="submit" className="btn-gold" style={{width:'100%', padding:'15px', fontSize:'16px', fontWeight:'bold', marginTop:'20px'}}>
                📢 Post Job ({commissionPercent}% Commission)
              </button>
            </form>
          </div>
        )}

        {activeTab==='verification' && (
          <div className="dash-card form-card">
            <h3>🛡️ Agent Verification</h3>
            <p className="text-muted">All fields required for agent verification</p>
            <div className="form-group"><label>Full Name *</label><input type="text" placeholder="Full legal name" value={verifyForm.full_name} onChange={e=>setVerifyForm({...verifyForm,full_name:e.target.value})} required /></div>
            <div className="form-group"><label>Date of Birth *</label><input type="date" value={verifyForm.date_of_birth} onChange={e=>setVerifyForm({...verifyForm,date_of_birth:e.target.value})} required /></div>
            <div className="form-group"><label>Address *</label><input type="text" placeholder="Full address" value={verifyForm.address} onChange={e=>setVerifyForm({...verifyForm,address:e.target.value})} required /></div>
            <div className="form-group"><label>Upload Passport</label><input type="file" /></div>
            <div className="form-group"><label>Upload Full Photo</label><input type="file" /></div>
            <div className="form-group"><label>NIN *</label><input type="text" placeholder="11-digit NIN" maxLength="11" value={verifyForm.nin} onChange={e=>setVerifyForm({...verifyForm,nin:e.target.value})} required /></div>
            <div className="form-group"><label>BVN *</label><input type="text" placeholder="11-digit BVN" maxLength="11" value={verifyForm.bvn} onChange={e=>setVerifyForm({...verifyForm,bvn:e.target.value})} required /></div>
            <h4 style={{marginTop:'20px',color:'#0a1628'}}>Bank Details</h4>
            <div className="form-group"><label>Bank Name *</label><input type="text" value={verifyForm.bank_name} onChange={e=>setVerifyForm({...verifyForm,bank_name:e.target.value})} required /></div>
            <div className="form-group"><label>Account Number *</label><input type="text" value={verifyForm.account_number} onChange={e=>setVerifyForm({...verifyForm,account_number:e.target.value})} required /></div>
            <h4 style={{marginTop:'20px',color:'#0a1628'}}>Guarantor Details</h4>
            <div className="form-group"><label>Guarantor Name *</label><input type="text" value={verifyForm.guarantor_name} onChange={e=>setVerifyForm({...verifyForm,guarantor_name:e.target.value})} required /></div>
            <div className="form-group"><label>Guarantor Phone *</label><input type="tel" value={verifyForm.guarantor_phone} onChange={e=>setVerifyForm({...verifyForm,guarantor_phone:e.target.value})} required /></div>
            <div className="form-group"><label>Guarantor Address</label><input type="text" value={verifyForm.guarantor_address} onChange={e=>setVerifyForm({...verifyForm,guarantor_address:e.target.value})} /></div>
            <h4 style={{marginTop:'20px',color:'#0a1628'}}>Next of Kin</h4>
            <div className="form-group"><label>Next of Kin Name *</label><input type="text" value={verifyForm.next_of_kin_name} onChange={e=>setVerifyForm({...verifyForm,next_of_kin_name:e.target.value})} required /></div>
            <div className="form-group"><label>Next of Kin Phone *</label><input type="tel" value={verifyForm.next_of_kin_phone} onChange={e=>setVerifyForm({...verifyForm,next_of_kin_phone:e.target.value})} required /></div>
            <div className="form-group"><label>Next of Kin Address</label><input type="text" value={verifyForm.next_of_kin_address} onChange={e=>setVerifyForm({...verifyForm,next_of_kin_address:e.target.value})} /></div>
            <h4 style={{marginTop:'20px',color:'#0a1628'}}>Emergency Contact</h4>
            <div className="form-group"><label>Emergency Contact Name *</label><input type="text" value={verifyForm.emergency_contact_name} onChange={e=>setVerifyForm({...verifyForm,emergency_contact_name:e.target.value})} required /></div>
            <div className="form-group"><label>Emergency Contact Phone *</label><input type="tel" value={verifyForm.emergency_contact_phone} onChange={e=>setVerifyForm({...verifyForm,emergency_contact_phone:e.target.value})} required /></div>
            <h4 style={{marginTop:'20px',color:'#0a1628'}}>Social Media</h4>
            <div className="form-group"><label>Social Media 1</label><input type="text" value={verifyForm.social_media_1} onChange={e=>setVerifyForm({...verifyForm,social_media_1:e.target.value})} /></div>
            <div className="form-group"><label>Social Media 2</label><input type="text" value={verifyForm.social_media_2} onChange={e=>setVerifyForm({...verifyForm,social_media_2:e.target.value})} /></div>
            <button className="btn-gold" onClick={handleVerifySubmit} disabled={verifyLoading}>
              {verifyLoading ? '⏳ Submitting...' : '📤 Submit Verification'}
            </button>
            {verifyMsg && <div className={verifyMsg.includes('✅')?'success-message':'error-message'} style={{marginTop:'15px'}}>{verifyMsg}</div>}
          </div>
        )}

        {activeTab==='profile' && (
          <div className="dash-card form-card">
            <h3>👤 My Profile</h3>
            {profileData ? (
              <>
                <div className="form-group"><label>Full Name</label><input type="text" value={profileData.full_name || 'Not set'} readOnly /></div>
                <div className="form-group"><label>Email Address</label><input type="email" value={profileData.email || ''} readOnly /></div>
                <div className="form-group"><label>Phone Number</label><input type="tel" value={profileData.phone || 'Not set'} readOnly /></div>
                <div className="form-group"><label>Date of Birth</label><input type="text" value={profileData.date_of_birth || 'Not set'} readOnly /></div>
                <div className="form-group"><label>Address</label><input type="text" value={profileData.address || 'Not set'} readOnly /></div>
                <div className="form-group"><label>NIN</label><input type="text" value={profileData.nin || 'Not set'} readOnly /></div>
                <div className="form-group"><label>BVN</label><input type="text" value={profileData.bvn || 'Not set'} readOnly /></div>
                <div className="form-group"><label>Bank Name</label><input type="text" value={profileData.bank_name || 'Not set'} readOnly /></div>
                <div className="form-group"><label>Account Number</label><input type="text" value={profileData.account_number || 'Not set'} readOnly /></div>
                <div className="form-group"><label>Verification Status</label>
                  <input type="text" value={profileData.verification_status || 'pending'} readOnly style={{color: profileData.is_verified ? '#28a745' : '#dc3545', fontWeight: 'bold'}} />
                </div>
              </>
            ) : (
              <p className="text-muted">Loading profile...</p>
            )}
          </div>
        )}

        {activeTab==='password' && (
          <div className="dash-card form-card">
            <h3>🔒 Change Password</h3>
            {passwordMsg && <div className={passwordMsg.includes('✅')?'success-message':'error-message'}>{passwordMsg}</div>}
            <div className="form-group"><label>Current</label><input type="password" value={passwordForm.current} onChange={e=>setPasswordForm({...passwordForm,current:e.target.value})}/></div>
            <div className="form-group"><label>New</label><input type="password" value={passwordForm.newPass} onChange={e=>setPasswordForm({...passwordForm,newPass:e.target.value})}/></div>
            <div className="form-group"><label>Confirm</label><input type="password" value={passwordForm.confirm} onChange={e=>setPasswordForm({...passwordForm,confirm:e.target.value})}/></div>
            <button className="btn-gold" onClick={handlePasswordChange}>Update</button>
          </div>
        )}

        {activeTab==='agent-messages' && (
          <div className="dash-card">
            <h3><i className="fas fa-envelope"></i> Messages</h3>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>From</th><th>Subject</th><th>Message</th><th>Time</th><th>Action</th></tr></thead>
                <tbody>
                  {agentMessages.length === 0 ? (
                    <tr><td colSpan="5" className="text-muted" style={{textAlign:'center',padding:'20px'}}>No messages yet</td></tr>
                  ) : (
                    agentMessages.map(m => (
                      <tr key={m.id} style={{background:m.unread?'#f0f7ff':'transparent',fontWeight:m.unread?'bold':'normal'}}>
                        <td>{m.from}</td>
                        <td>{m.subject}</td>
                        <td>{m.message?.substring(0,40)}...</td>
                        <td>{m.time}</td>
                        <td>
                          <button className="btn-sm" style={{background:'#0a1628',color:'white',border:'none',padding:'5px 10px',borderRadius:'3px',cursor:'pointer'}} onClick={()=>handleReplyMessage(m.from)}>Reply</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab==='agent-chat' && (
          <div className="dash-card" style={{display:'flex',flexDirection:'column',height:'60vh'}}>
            <h3><i className="fas fa-comments"></i> Live Chat</h3>
            <div style={{display:'flex',gap:'10px',marginBottom:'15px'}}>
              <select value={selectedChatContact} onChange={e=>setSelectedChatContact(e.target.value)} style={{padding:'8px',borderRadius:'5px',border:'2px solid #e0e0e0',flex:1}}>
                <option value="">Select contact...</option>
                <option value="admin">Admin</option>
                <option value="support">Support</option>
              </select>
            </div>
            <div style={{flex:1,overflowY:'auto',border:'1px solid #e0e0e0',borderRadius:'8px',padding:'15px',marginBottom:'15px',background:'#f9f9f9'}}>
              {agentChatMessages.map(m => (
                <div key={m.id} style={{textAlign:m.isAgent?'right':'left',marginBottom:'12px'}}>
                  <div style={{display:'inline-block',background:m.isAgent?'#0a1628':'white',color:m.isAgent?'white':'#333',padding:'10px 15px',borderRadius:'12px',maxWidth:'70%'}}>
                    <p style={{margin:0,fontSize:'14px'}}>{m.text}</p>
                    <small style={{opacity:0.7,fontSize:'10px'}}>{m.time}</small>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <input type="text" value={agentChatInput} onChange={e=>setAgentChatInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&handleAgentSendChat()} placeholder="Type message..." style={{flex:1,padding:'12px',border:'2px solid #e0e0e0',borderRadius:'8px'}}/>
              <button onClick={handleAgentSendChat} className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'12px 20px',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'}}>
                Send
              </button>
            </div>
          </div>
        )}

        {activeTab==='agent-calls' && (
          <div className="dash-card">
            <h3><i className="fas fa-phone"></i> Make a Call</h3>
            <div style={{display:'flex',gap:'10px',marginBottom:'20px'}}>
              <select value={agentCallTarget} onChange={e=>setAgentCallTarget(e.target.value)} style={{padding:'10px',borderRadius:'5px',border:'2px solid #e0e0e0',flex:1}}>
                <option value="">Select who to call...</option>
                <option value="Admin">Admin</option>
                <option value="Support">Support</option>
                <option value="Job Seeker">Job Seeker</option>
              </select>
              <button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}} onClick={handleStartCall}>📹 Video Call</button>
              <button className="btn-sm" style={{background:'#0a1628',color:'#d4a843',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}} onClick={handleStartCall}>📞 Voice Call</button>
            </div>
            {showAgentCall && (
              <div style={{marginTop:'15px'}}>
                <button className="btn btn-red" style={{marginBottom:'10px'}} onClick={()=>setShowAgentCall(false)}>❌ End Call</button>
                <iframe src={`https://meet.jit.si/JobConnect-Agent-${Date.now()}`} style={{width:'100%',height:'400px',border:'none',borderRadius:'10px'}} allow="camera; microphone; fullscreen"/>
              </div>
            )}
          </div>
        )}

        {activeTab==='agent-noticeboard' && (
          <div className="dash-card">
            <h3><i className="fas fa-clipboard-list"></i> Notice Board & Broadcasts</h3>
            {agentNoticeBoard.map(n => (
              <div key={n.id} style={{borderLeft:'4px solid '+(n.priority==='urgent'?'#dc3545':n.priority==='high'?'#ffc107':'#d4a843'),padding:'15px',marginBottom:'12px',background:n.priority==='urgent'?'#fff5f5':'white',borderRadius:'8px'}}>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <h4>{n.title}</h4>
                  <span className={`badge ${n.priority==='urgent'?'badge-pending':n.priority==='high'?'badge-gold':'badge-verified'}`}>{n.priority}</span>
                </div>
                <p className="text-muted">{n.content}</p>
                <small>{n.date}</small>
              </div>
            ))}
          </div>
        )}

        {['earnings','payout','applications','disputes'].includes(activeTab) && (
          <div className="dash-card">
            <h3>{activeTab.charAt(0).toUpperCase()+activeTab.slice(1)}</h3>
            <p className="text-muted">This section is coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentDashboard;