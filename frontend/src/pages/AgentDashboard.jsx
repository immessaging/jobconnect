import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAgentJobs, postJob } from '../services/api';
import './Dashboard.css';

function AgentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLocationOverlay, setShowLocationOverlay] = useState(true);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [locationDisplay, setLocationDisplay] = useState('Waiting for GPS location...');
  const [msg, setMsg] = useState('');
  const unreadCount = 0;

  // Verification status
  const isVerified = user?.is_verified || false;

  // Password change
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  // Commission & Job Form
  const [commissionPercent, setCommissionPercent] = useState(15);
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [form, setForm] = useState({ 
    agent_id:'00000000-0000-0000-0000-000000000010', 
    job_title:'', qualification_requirements:'', experience_requirements:'', 
    required_skills:'', salary_range_min:'', salary_range_max:'',
    organization_name:'', organization_contact_person:'',
    organization_email:'', organization_phone:'',
    commission_percentage: 15,
    is_negotiable: true,
    has_exam: false,
    has_interview: false
  });

  // Earnings tracking
  const [earnings, setEarnings] = useState([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [nextPayout, setNextPayout] = useState('');

  // Disputes for agent
  const [agentDisputes, setAgentDisputes] = useState([
    { id: 'DSP-001', seeker: 'seeker1@example.com', job: 'Software Developer', amount: '₦45,000', reason: 'Job not secured', status: 'pending_agent', daysLeft: 18 },
    { id: 'DSP-002', seeker: 'newuser@email.com', job: 'Accountant', amount: '₦30,000', reason: 'Changed mind - carry forward', status: 'pending_agent', daysLeft: 15 },
  ]);

  // Applications
  const [applications, setApplications] = useState([
    { id: 1, seeker: 'seeker1@example.com', job: 'Software Developer', date: '2024-05-03', status: 'pending' },
    { id: 2, seeker: 'newuser@email.com', job: 'Accountant', date: '2024-05-02', status: 'accepted' },
  ]);

  // Messages
  const [agentMessages, setAgentMessages] = useState([
    { id: 1, from: 'admin@jobconnect.com', subject: 'Verification Update', message: 'Your documents are being reviewed', time: '2 hours ago', unread: true },
    { id: 2, from: 'seeker1@example.com', subject: 'Application Question', message: 'Is this job still available?', time: 'Yesterday', unread: false },
  ]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/signin'); return; }
    setUser(JSON.parse(userData));
    loadJobs();
    loadEarnings();
    setTimeout(() => requestLocationAccess(), 1000);
    calculateNextPayout();
  }, [navigate]);

  const loadJobs = () => {
    getAgentJobs('00000000-0000-0000-0000-000000000010')
      .then(res => setJobs(res.data.jobs || []))
      .catch(console.log);
  };

  const loadEarnings = () => {
    const saved = JSON.parse(localStorage.getItem('agentEarnings') || '[]');
    setEarnings(saved);
    setTotalEarned(saved.reduce((sum, e) => sum + (e.amount || 0), 0));
  };

  const calculateNextPayout = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let payoutDate = new Date(currentYear, currentMonth, 25);
    if (now > payoutDate) payoutDate = new Date(currentYear, currentMonth + 1, 25);
    setNextPayout(payoutDate.toLocaleDateString('en-NG', { weekday:'long', year:'numeric', month:'long', day:'numeric' }));
  };

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/signin'); };
  const formatNaira = (num) => '₦' + Number(num).toLocaleString();

  const handlePost = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      const jobData = { ...form, commission_percentage: commissionPercent, is_negotiable: isNegotiable };
      await postJob(jobData);
      setMsg('✅ Job posted successfully! Commission: ' + commissionPercent + '% ' + (isNegotiable ? '(Negotiable)' : '(Fixed)'));
      loadJobs();
      setForm({...form, job_title:'', qualification_requirements:'', experience_requirements:'', required_skills:'', salary_range_min:'', salary_range_max:'', organization_name:'', organization_contact_person:'', organization_email:'', organization_phone:''});
    } catch { setMsg('❌ Failed to post job'); }
  };

  const requestLocationAccess = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setLocationDisplay(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (${Math.round(accuracy)}m accuracy)`);
        setShowLocationOverlay(false);
      },
      () => setShowLocationOverlay(false),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const handlePasswordChange = () => {
    setPasswordMsg('');
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
      setPasswordMsg('❌ All fields are required'); return;
    }
    if (passwordForm.newPass.length < 6) {
      setPasswordMsg('❌ New password must be at least 6 characters'); return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordMsg('❌ Passwords do not match'); return;
    }
    setPasswordMsg('✅ Password changed successfully!');
    setPasswordForm({ current: '', newPass: '', confirm: '' });
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  const handleConfirmDispute = (disputeId, confirmed) => {
    setAgentDisputes(prev => prev.map(d => d.id === disputeId ? {...d, status: confirmed ? 'confirmed' : 'denied'} : d));
    alert(confirmed ? '✅ Dispute confirmed. Refund will be processed.' : '❌ Dispute denied.');
  };

  const handleExportCSV = (data, filename) => {
    const csv = Object.keys(data[0]).join(',') + '\n' + data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  const handlePrint = () => window.print();

  const stats = {
    activeListings: jobs.filter(j => j.status === 'active').length,
    filledJobs: jobs.filter(j => j.status === 'filled').length,
    totalApplications: jobs.reduce((sum, j) => sum + (j.applications || 0), 0),
    totalCommissionEarned: totalEarned
  };

  return (
    <div className="dashboard">
      {/* GPS Overlay */}
      {showLocationOverlay && (
        <div className="location-overlay">
          <div className="location-modal">
            <div className="icon-circle"><i className="fas fa-map-marker-alt"></i></div>
            <h3>Location Access Required</h3>
            <p>Please allow GPS location access to verify your identity.</p>
            <p className="warning-text"><i className="fas fa-exclamation-triangle"></i> Dashboard locked until permission granted.</p>
            <button className="btn-allow" onClick={requestLocationAccess}><i className="fas fa-location-arrow"></i> Allow Location</button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="user-avatar">🤝</div>
          {!sidebarCollapsed && (
            <><h3>JobConnect</h3>
            {isVerified ? <span className="badge badge-verified">Verified</span> : <span className="badge badge-pending">Unverified</span>}</>
          )}
        </div>
        <nav className="sidebar-nav">
          <div className="nav-header">MAIN NAVIGATION</div>
          <button className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}><i className="fas fa-tachometer-alt"></i> <span className="sidebar-text">Dashboard</span></button>
          <button className={`nav-item ${activeTab==='jobs'?'active':''}`} onClick={()=>setActiveTab('jobs')}><i className="fas fa-briefcase"></i> <span className="sidebar-text">My Jobs</span></button>
          <button className={`nav-item ${activeTab==='post'?'active':''}`} onClick={()=>setActiveTab('post')}><i className="fas fa-plus-circle"></i> <span className="sidebar-text">Post New Job</span></button>
          <button className={`nav-item ${activeTab==='applications'?'active':''}`} onClick={()=>setActiveTab('applications')}><i className="fas fa-users"></i> <span className="sidebar-text">Applications</span></button>
          <button className={`nav-item ${activeTab==='prep'?'active':''}`} onClick={()=>setActiveTab('prep')}><i className="fas fa-graduation-cap"></i> <span className="sidebar-text">Prep Seekers</span></button>
          <button className={`nav-item ${activeTab==='disputes'?'active':''}`} onClick={()=>setActiveTab('disputes')}><i className="fas fa-gavel"></i> <span className="sidebar-text">Disputes</span>{agentDisputes.filter(d=>d.status==='pending_agent').length>0&&<span className="notification-badge">{agentDisputes.filter(d=>d.status==='pending_agent').length}</span>}</button>
          <hr className="sidebar-divider" /><div className="nav-header">FINANCES</div>
          <button className={`nav-item ${activeTab==='earnings'?'active':''}`} onClick={()=>setActiveTab('earnings')}><i className="fas fa-chart-line"></i> <span className="sidebar-text">Earnings</span></button>
          <button className={`nav-item ${activeTab==='payout'?'active':''}`} onClick={()=>setActiveTab('payout')}><i className="fas fa-money-bill-wave"></i> <span className="sidebar-text">Payout Schedule</span></button>
          <hr className="sidebar-divider" /><div className="nav-header">COMMUNICATION</div>
          <button className={`nav-item ${activeTab==='messages'?'active':''}`} onClick={()=>setActiveTab('messages')}><i className="fas fa-envelope"></i> <span className="sidebar-text">Messages</span>{agentMessages.filter(m=>m.unread).length>0&&<span className="notification-badge">{agentMessages.filter(m=>m.unread).length}</span>}</button>
          <button className={`nav-item ${activeTab==='notifications'?'active':''}`} onClick={()=>setActiveTab('notifications')}><i className="fas fa-bell"></i> <span className="sidebar-text">Notifications</span></button>
          <hr className="sidebar-divider" /><div className="nav-header">ACCOUNT</div>
          <button className={`nav-item ${activeTab==='verification'?'active':''}`} onClick={()=>setActiveTab('verification')}><i className="fas fa-id-card"></i> <span className="sidebar-text">Verification</span></button>
          <button className={`nav-item ${activeTab==='profile'?'active':''}`} onClick={()=>setActiveTab('profile')}><i className="fas fa-user-circle"></i> <span className="sidebar-text">My Profile</span></button>
          <button className={`nav-item ${activeTab==='password'?'active':''}`} onClick={()=>setActiveTab('password')}><i className="fas fa-lock"></i> <span className="sidebar-text">Change Password</span></button>
          <hr className="sidebar-divider" />
          <button className="nav-item logout-btn" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> <span className="sidebar-text">Logout</span></button>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`dashboard-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="dash-topbar">
          <div><button className="toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button></div>
          <div className="header-actions" style={{position:'relative'}}>
            <span>Welcome, <strong>{user?.email?.split('@')[0] || 'Agent'}</strong></span>
            {isVerified ? <span className="badge badge-verified">Verified</span> : <span className="badge badge-pending">Unverified</span>}
            <div className="user-avatar" onClick={() => setShowDropdown(!showDropdown)} style={{cursor:'pointer'}}>{(user?.email?.[0] || 'A').toUpperCase()}</div>
            {showDropdown && (
              <div className="profile-dropdown show">
                <div className="dropdown-header"><strong>{user?.email || 'Agent'}</strong><small>Agent</small></div>
                <button className="dropdown-item" onClick={()=>{setActiveTab('profile');setShowDropdown(false);}}><i className="fas fa-user"></i> View Profile</button>
                <button className="dropdown-item" onClick={()=>{setActiveTab('password');setShowDropdown(false);}}><i className="fas fa-key"></i> Change Password</button>
                <button className="dropdown-item text-danger" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Logout</button>
              </div>
            )}
            <button className="logout-btn-header" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        {gpsCoords && <div className="geo-info"><i className="fas fa-map-marker-alt"></i> <strong>Location:</strong> {locationDisplay}</div>}

        {!isVerified && (
          <div className="verification-warning">
            <h3>⚠️ ACCOUNT NOT VERIFIED</h3>
            <p><strong>Until you are verified, you cannot perform any actions on this dashboard.</strong></p>
            <button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer',fontWeight:'bold',marginTop:'10px'}} onClick={() => setActiveTab('verification')}>Complete Verification Now</button>
          </div>
        )}

        <div className="welcome-card"><div><h4>Welcome Back, {user?.email?.split('@')[0] || 'Agent'}!</h4><p>Here's your job management overview.</p></div><i className="fas fa-handshake" style={{fontSize:'3rem',opacity:0.3}}></i></div>

        {msg && <div className={msg.includes('✅')?'success-message':'error-message'}>{msg}</div>}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div className="dash-card form-card">
            <h3>🔒 Change Password</h3>
            {passwordMsg && <div className={passwordMsg.includes('✅')?'success-message':'error-message'}>{passwordMsg}</div>}
            <div className="form-group"><label>Current Password</label><input type="password" placeholder="Current password" value={passwordForm.current} onChange={e=>setPasswordForm({...passwordForm,current:e.target.value})}/></div>
            <div className="form-group"><label>New Password</label><input type="password" placeholder="New password (min 6 chars)" value={passwordForm.newPass} onChange={e=>setPasswordForm({...passwordForm,newPass:e.target.value})}/></div>
            <div className="form-group"><label>Confirm Password</label><input type="password" placeholder="Confirm new password" value={passwordForm.confirm} onChange={e=>setPasswordForm({...passwordForm,confirm:e.target.value})}/></div>
            <button className="btn-gold" onClick={handlePasswordChange}>Update Password</button>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="stats-row">
              <div className="stat-box"><span className="stat-icon">💼</span><h3>{stats.activeListings}</h3><p>Active Jobs</p></div>
              <div className="stat-box"><span className="stat-icon">✅</span><h3>{stats.filledJobs}</h3><p>Filled</p></div>
              <div className="stat-box"><span className="stat-icon">👥</span><h3>{stats.totalApplications}</h3><p>Applicants</p></div>
              <div className="stat-box"><span className="stat-icon">💰</span><h3>{formatNaira(stats.totalCommissionEarned)}</h3><p>Earned</p></div>
            </div>
            <div className="dash-card">
              <h3>Next Payout: {nextPayout}</h3>
              <p className="text-muted">Minimum payout: ₦10,000 | Payout date: 25th of each month</p>
            </div>
            {/* Recent Applications */}
            <div className="dash-card" style={{marginTop:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'15px'}}>
                <h3><i className="fas fa-users"></i> Recent Applications</h3>
                <button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>setActiveTab('applications')}>View All</button>
              </div>
              <div className="table-container"><table className="data-table"><thead><tr><th>Seeker</th><th>Job</th><th>Date</th><th>Status</th></tr></thead><tbody>
                {applications.map(a=>(<tr key={a.id}><td>{a.seeker}</td><td>{a.job}</td><td>{a.date}</td><td><span className={`badge ${a.status==='accepted'?'badge-verified':'badge-pending'}`}>{a.status}</span></td></tr>))}
              </tbody></table></div>
            </div>
          </div>
        )}

        {/* Post Job Tab */}
        {activeTab === 'post' && (
          <div className="dash-card form-card">
            <h3>Post New Job</h3>
            <form onSubmit={handlePost}>
              <div className="form-group"><label>Job Title *</label><input value={form.job_title} onChange={e=>setForm({...form,job_title:e.target.value})} required/></div>
              <div className="form-group"><label>Organization Name *</label><input value={form.organization_name} onChange={e=>setForm({...form,organization_name:e.target.value})} required/></div>
              <div className="form-group"><label>Qualification Requirements *</label><textarea value={form.qualification_requirements} onChange={e=>setForm({...form,qualification_requirements:e.target.value})} required/></div>
              <div className="form-group"><label>Experience Requirements *</label><textarea value={form.experience_requirements} onChange={e=>setForm({...form,experience_requirements:e.target.value})} required/></div>
              <div className="form-group"><label>Required Skills</label><input value={form.required_skills} onChange={e=>setForm({...form,required_skills:e.target.value})} placeholder="e.g., JavaScript, Python"/></div>
              <div className="form-row">
                <div className="form-group"><label>Min Salary (₦) *</label><input type="number" value={form.salary_range_min} onChange={e=>setForm({...form,salary_range_min:e.target.value})} required/></div>
                <div className="form-group"><label>Max Salary (₦) *</label><input type="number" value={form.salary_range_max} onChange={e=>setForm({...form,salary_range_max:e.target.value})} required/></div>
              </div>
              <div className="commission-setting-card">
                <h4>💰 Commission Setting</h4>
                <div className="form-row">
                  <div className="form-group"><label>Commission Percentage (5-35%) *</label>
                    <input type="number" min="5" max="35" value={commissionPercent} onChange={e=>setCommissionPercent(Number(e.target.value))} required/>
                    <small>Estimated: ₦{((Number(form.salary_range_max)||0)*commissionPercent/100).toLocaleString()}</small>
                  </div>
                  <div className="form-group"><label>Negotiation</label>
                    <div style={{display:'flex',gap:'15px',marginTop:'10px'}}>
                      <label style={{display:'flex',alignItems:'center',gap:'5px',cursor:'pointer'}}><input type="radio" checked={isNegotiable} onChange={()=>setIsNegotiable(true)}/>🔄 You Can Negotiate</label>
                      <label style={{display:'flex',alignItems:'center',gap:'5px',cursor:'pointer'}}><input type="radio" checked={!isNegotiable} onChange={()=>setIsNegotiable(false)}/>🔒 You Can't Negotiate</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Contact Person</label><input value={form.organization_contact_person} onChange={e=>setForm({...form,organization_contact_person:e.target.value})}/></div>
                <div className="form-group"><label>Contact Email</label><input type="email" value={form.organization_email} onChange={e=>setForm({...form,organization_email:e.target.value})}/></div>
              </div>
              <div className="form-group"><label>Contact Phone</label><input type="tel" value={form.organization_phone} onChange={e=>setForm({...form,organization_phone:e.target.value})}/></div>
              <div className="form-row">
                <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}><input type="checkbox" checked={form.has_interview} onChange={e=>setForm({...form,has_interview:e.target.checked})}/>Interview Required</label>
                <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}><input type="checkbox" checked={form.has_exam} onChange={e=>setForm({...form,has_exam:e.target.checked})}/>Exam Required</label>
              </div>
              <button type="submit" className="btn-gold" style={{marginTop:'15px'}}>📢 Post Job with {commissionPercent}% Commission</button>
            </form>
          </div>
        )}

        {/* Payout Schedule Tab */}
        {activeTab === 'payout' && (
          <div className="dash-card">
            <h3>💳 Payout Schedule</h3>
            <div className="payout-info-card">
              <h4>Payment Policy</h4>
              <ul><li>📅 <strong>Payout Date:</strong> 25th of every month</li><li>💰 <strong>Minimum Payout:</strong> ₦10,000</li><li>⏰ <strong>Processing:</strong> 7 days after seeker releases commission</li><li>🏦 <strong>Method:</strong> Direct bank transfer</li><li>📊 <strong>Your Rate:</strong> 83% of commission</li></ul>
            </div>
            <div style={{marginTop:'15px'}}><h4>Next Payout: <span style={{color:'#d4a843'}}>{nextPayout}</span></h4><p>Pending amount: {formatNaira(totalEarned)}</p>{totalEarned<10000&&<p className="warning-text">⚠️ Minimum ₦10,000 required for payout</p>}</div>
          </div>
        )}

        {/* Disputes Tab - Agent confirms/rejects */}
        {activeTab === 'disputes' && (
          <div className="dash-card">
            <h3>⚖️ Disputes Requiring Your Confirmation</h3>
            <p className="text-muted">You must confirm or reject seeker disputes for refund/carry-forward requests.</p>
            {agentDisputes.length === 0 ? (
              <div className="empty-state"><span className="empty-icon">✅</span><h4>No pending disputes</h4></div>
            ) : (
              agentDisputes.map(d => (
                <div key={d.id} style={{borderLeft:'4px solid '+(d.status==='pending_agent'?'#ffc107':'#28a745'),padding:'15px',marginBottom:'15px',background:d.status==='pending_agent'?'#fffdf5':'#f0fff4',borderRadius:'8px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
                    <div><h4>{d.id} - {d.job}</h4><p>Seeker: {d.seeker}</p><p>Amount: {d.amount} | Reason: {d.reason}</p><p className="text-muted">{d.daysLeft} days remaining</p></div>
                    <span className={`badge ${d.status==='pending_agent'?'badge-pending':'badge-verified'}`}>{d.status}</span>
                  </div>
                  {d.status === 'pending_agent' && (
                    <div style={{marginTop:'10px',display:'flex',gap:'10px'}}>
                      <button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>handleConfirmDispute(d.id, true)}>✅ Confirm</button>
                      <button className="btn-sm" style={{background:'#dc3545',color:'white',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>handleConfirmDispute(d.id, false)}>❌ Reject</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className="dash-card form-card">
            <h3>🛡️ Agent Verification</h3>
            <div className="verification-checklist"><h4>Required Documents:</h4><p>✅ Email</p><p>✅ Phone</p><p>⏳ Passport</p><p>⏳ Full Photo</p><p>⏳ GPS Photo</p><p>⏳ NIN</p><p>⏳ BVN</p><p>⏳ Bank Details</p><p>⏳ DOB Cert</p><p>⏳ Academic Cert</p><p>⏳ Guarantor</p><p>⏳ Next of Kin</p><p>⏳ Emergency Contact</p><p>⏳ Social Media</p></div>
            <div className="form-group"><label>Upload Passport</label><input type="file"/></div>
            <div className="form-group"><label>NIN</label><input type="text" placeholder="11-digit NIN"/></div>
            <div className="form-group"><label>BVN</label><input type="text" placeholder="11-digit BVN"/></div>
            <div className="form-group"><label>Bank Name</label><input type="text"/></div>
            <div className="form-group"><label>Account Number</label><input type="text"/></div>
            <div className="form-group"><label>Guarantor Name</label><input type="text"/></div>
            <div className="form-group"><label>Guarantor Phone</label><input type="tel"/></div>
            <div className="form-group"><label>Next of Kin Name</label><input type="text"/></div>
            <div className="form-group"><label>Next of Kin Phone</label><input type="tel"/></div>
            <button className="btn-gold">Submit for Verification</button>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="dash-card">
            <h3><i className="fas fa-envelope"></i> Messages</h3>
            <div className="table-container"><table className="data-table"><thead><tr><th>From</th><th>Subject</th><th>Time</th><th>Action</th></tr></thead><tbody>
              {agentMessages.map(m=>(<tr key={m.id} style={{background:m.unread?'#f0f7ff':'transparent',fontWeight:m.unread?'bold':'normal'}}><td>{m.from}</td><td>{m.subject}</td><td>{m.time}</td><td><button className="btn-sm" style={{background:'#0a1628',color:'white',border:'none',padding:'5px 10px',borderRadius:'3px',cursor:'pointer'}}>Reply</button></td></tr>))}
            </tbody></table></div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="dash-card form-card">
            <h3>My Profile</h3>
            <div className="form-group"><label>Full Name</label><input type="text" placeholder="Your name"/></div>
            <div className="form-group"><label>Email</label><input type="email" value={user?.email||''} readOnly/></div>
            <div className="form-group"><label>Phone</label><input type="tel" placeholder="080xxxxxxxx"/></div>
            <div className="form-group"><label>Address</label><input type="text" placeholder="Your address"/></div>
            <button className="btn-gold">Update Profile</button>
          </div>
        )}

        {/* Other tabs */}
        {['jobs','applications','earnings','prep','notifications'].includes(activeTab) && (
          <div className="dash-card">
            <h3>{activeTab.charAt(0).toUpperCase()+activeTab.slice(1)}</h3>
            {activeTab==='jobs' && <div className="grid-2">{jobs.map(job=>(<div key={job.id} className="card" style={{borderLeft:'4px solid #d4a843',padding:'15px'}}><h4>{job.title}</h4><p className="text-muted">🏢 {job.organization}</p><p className="salary">{formatNaira(job.salary_min)} - {formatNaira(job.salary_max)}</p><span className={`badge ${job.status==='active'?'badge-verified':'badge-pending'}`}>{job.status}</span></div>))}</div>}
            {activeTab==='applications' && <div className="table-container"><table className="data-table"><thead><tr><th>Seeker</th><th>Job</th><th>Status</th></tr></thead><tbody>{applications.map(a=>(<tr key={a.id}><td>{a.seeker}</td><td>{a.job}</td><td>{a.status}</td></tr>))}</tbody></table></div>}
            {activeTab==='prep' && <div><div className="card" style={{padding:'20px'}}><h4>Software Developer - Tech Corp Nigeria</h4><p>📝 Interview | 📋 Exam</p><div className="form-group"><label>Prep Materials</label><textarea placeholder="Share interview tips, exam topics..."/></div><button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}}>Send to Seeker</button></div></div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentDashboard;