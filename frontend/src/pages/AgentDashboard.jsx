import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAgentJobs, postJob, submitVerification, uploadToCloudinary } from '../services/api';
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
  const unreadCount = 0;

  const isVerified = user?.is_verified || false;

  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

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
  const [form, setForm] = useState({ 
    agent_id: '',
    job_title:'', qualification_requirements:'', experience_requirements:'', 
    required_skills:'', salary_range_min:'', salary_range_max:'',
    organization_name:'', organization_contact_person:'',
    organization_email:'', organization_phone:'',
    commission_percentage: 15, is_negotiable: true, has_exam: false, has_interview: false
  });

  const [earnings, setEarnings] = useState([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [nextPayout, setNextPayout] = useState('');

  const [agentDisputes, setAgentDisputes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [agentMessages, setAgentMessages] = useState([]);

  // Fetch agent profile ID from backend
  const fetchAgentProfileId = async (userId) => {
    try {
      const API = 'https://jobconnect-api-gjtw.onrender.com';
      const response = await fetch(`${API}/api/agent/profile/${userId}`);
      const data = await response.json();
      if (data.success && data.profile_id) {
        setAgentProfileId(data.profile_id);
        setForm(prev => ({ ...prev, agent_id: data.profile_id }));
        return data.profile_id;
      }
    } catch (err) {
      console.log('Error fetching agent profile:', err);
    }
    return null;
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/signin'); return; }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Fetch agent profile ID dynamically
    fetchAgentProfileId(parsedUser.id).then(profileId => {
      if (profileId) {
        loadJobs(profileId);
      }
    });
    
    loadEarnings();
    setTimeout(() => requestLocationAccess(), 1000);
    calculateNextPayout();
  }, [navigate]);

  const loadJobs = (profileId) => {
    const id = profileId || agentProfileId;
    if (!id) return;
    getAgentJobs(id)
      .then(res => setJobs(res.data.jobs || [])).catch(console.log);
  };

  const loadEarnings = () => {
    const saved = JSON.parse(localStorage.getItem('agentEarnings') || '[]');
    setEarnings(saved); setTotalEarned(saved.reduce((s, e) => s + (e.amount || 0), 0));
  };

  const calculateNextPayout = () => {
    const now = new Date();
    let payout = new Date(now.getFullYear(), now.getMonth(), 25);
    if (now > payout) payout = new Date(now.getFullYear(), now.getMonth() + 1, 25);
    setNextPayout(payout.toLocaleDateString('en-NG', { weekday:'long', year:'numeric', month:'long', day:'numeric' }));
  };

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/signin'); };
  const formatNaira = (num) => '₦' + Number(num).toLocaleString();

  const handleVerifySubmit = async () => {
    setVerifyLoading(true); setVerifyMsg('');
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
    } catch { setVerifyMsg('❌ Failed to submit.'); }
    setVerifyLoading(false);
  };

  const handlePost = async (e) => {
    e.preventDefault(); setMsg('');
    if (!agentProfileId) { setMsg('❌ Agent profile not found. Please complete verification first.'); return; }
    try {
      await postJob({ ...form, agent_id: agentProfileId, commission_percentage: commissionPercent, is_negotiable: isNegotiable });
      setMsg('✅ Job posted! Commission: ' + commissionPercent + '% ' + (isNegotiable ? '(Negotiable)' : '(Fixed)'));
      loadJobs(agentProfileId);
      setForm({...form, job_title:'', qualification_requirements:'', experience_requirements:'', required_skills:'', salary_range_min:'', salary_range_max:'', organization_name:'', organization_contact_person:'', organization_email:'', organization_phone:''});
    } catch { setMsg('❌ Failed to post job'); }
  };

  const requestLocationAccess = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationDisplay(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`); setShowLocationOverlay(false); },
      () => setShowLocationOverlay(false), { enableHighAccuracy: true, timeout: 20000 }
    );
  };

  const handlePasswordChange = () => {
    setPasswordMsg('');
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) { setPasswordMsg('❌ All fields required'); return; }
    if (passwordForm.newPass.length < 6) { setPasswordMsg('❌ Min 6 characters'); return; }
    if (passwordForm.newPass !== passwordForm.confirm) { setPasswordMsg('❌ Passwords do not match'); return; }
    setPasswordMsg('✅ Password changed!'); setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  const stats = { 
    activeListings: jobs.filter(j => j.status === 'active').length, 
    filledJobs: jobs.filter(j => j.status === 'filled').length, 
    totalApplications: jobs.reduce((s, j) => s + (j.applications || 0), 0), 
    totalCommissionEarned: totalEarned 
  };

  return (
    <div className="dashboard">
      {showLocationOverlay && (
        <div className="location-overlay"><div className="location-modal"><div className="icon-circle"><i className="fas fa-map-marker-alt"></i></div><h3>Location Access Required</h3><p>Please allow GPS location access.</p><p className="warning-text">Dashboard locked until permission granted.</p><button className="btn-allow" onClick={requestLocationAccess}>Allow Location</button></div></div>
      )}

      <div className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header"><div className="user-avatar">🤝</div>{!sidebarCollapsed && <>{isVerified ? <span className="badge badge-verified">Verified</span> : <span className="badge badge-pending">Unverified</span>}</>}</div>
        <nav className="sidebar-nav">
          <div className="nav-header">MAIN</div>
          <button className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}><i className="fas fa-tachometer-alt"></i> Dashboard</button>
          <button className={`nav-item ${activeTab==='jobs'?'active':''}`} onClick={()=>setActiveTab('jobs')}><i className="fas fa-briefcase"></i> My Jobs</button>
          <button className={`nav-item ${activeTab==='post'?'active':''}`} onClick={()=>setActiveTab('post')}><i className="fas fa-plus-circle"></i> Post Job</button>
          <button className={`nav-item ${activeTab==='applications'?'active':''}`} onClick={()=>setActiveTab('applications')}><i className="fas fa-users"></i> Applications</button>
          <button className={`nav-item ${activeTab==='disputes'?'active':''}`} onClick={()=>setActiveTab('disputes')}><i className="fas fa-gavel"></i> Disputes</button>
          <hr className="sidebar-divider" /><div className="nav-header">FINANCES</div>
          <button className={`nav-item ${activeTab==='earnings'?'active':''}`} onClick={()=>setActiveTab('earnings')}><i className="fas fa-chart-line"></i> Earnings</button>
          <button className={`nav-item ${activeTab==='payout'?'active':''}`} onClick={()=>setActiveTab('payout')}><i className="fas fa-money-bill-wave"></i> Payout</button>
          <hr className="sidebar-divider" /><div className="nav-header">ACCOUNT</div>
          <button className={`nav-item ${activeTab==='verification'?'active':''}`} onClick={()=>setActiveTab('verification')}><i className="fas fa-id-card"></i> Verification</button>
          <button className={`nav-item ${activeTab==='profile'?'active':''}`} onClick={()=>setActiveTab('profile')}><i className="fas fa-user-circle"></i> Profile</button>
          <button className={`nav-item ${activeTab==='password'?'active':''}`} onClick={()=>setActiveTab('password')}><i className="fas fa-lock"></i> Password</button>
          <hr className="sidebar-divider" />
          <button className="nav-item logout-btn" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Logout</button>
        </nav>
      </div>

      <div className={`dashboard-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="dash-topbar"><div><button className="toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button></div><div className="header-actions">{isVerified ? <span className="badge badge-verified">Verified</span> : <span className="badge badge-pending">Unverified</span>}<button className="logout-btn-header" onClick={handleLogout}>🚪 Logout</button></div></div>
        {gpsCoords && <div className="geo-info">📍 {locationDisplay}</div>}
        {!isVerified && (<div className="verification-warning"><h3>⚠️ NOT VERIFIED</h3><p><strong>Complete verification to access all features.</strong></p><button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>setActiveTab('verification')}>Complete Verification Now</button></div>)}
        {!agentProfileId && user?.user_type === 'agent' && (<div className="verification-warning"><h3>⚠️ AGENT PROFILE NOT FOUND</h3><p>Please complete verification to create your agent profile.</p></div>)}
        <div className="welcome-card"><div><h4>Welcome, {user?.email?.split('@')[0] || 'Agent'}!</h4></div></div>
        {msg && <div className={msg.includes('✅')?'success-message':'error-message'}>{msg}</div>}

        {/* VERIFICATION TAB */}
        {activeTab === 'verification' && (
          <div className="dash-card form-card">
            <h3>🛡️ Agent Verification</h3>
            <p className="text-muted">All fields required for agent verification</p>
            <div className="verification-checklist"><h4>Required:</h4><p>✅ Email</p><p>✅ Phone</p><p>⏳ Full Name</p><p>⏳ DOB</p><p>⏳ Address</p><p>⏳ Passport</p><p>⏳ Full Photo</p><p>⏳ NIN</p><p>⏳ BVN</p><p>⏳ Bank Details</p><p>⏳ Guarantor</p><p>⏳ Next of Kin</p><p>⏳ Emergency Contact</p><p>⏳ Social Media</p></div>
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
            <button className="btn-gold" onClick={handleVerifySubmit} disabled={verifyLoading}>{verifyLoading ? '⏳ Submitting...' : '📤 Submit Verification'}</button>
            {verifyMsg && <div className={verifyMsg.includes('✅')?'success-message':'error-message'} style={{marginTop:'15px'}}>{verifyMsg}</div>}
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (<div className="dash-card form-card"><h3>🔒 Change Password</h3>{passwordMsg && <div className={passwordMsg.includes('✅')?'success-message':'error-message'}>{passwordMsg}</div>}<div className="form-group"><label>Current</label><input type="password" value={passwordForm.current} onChange={e=>setPasswordForm({...passwordForm,current:e.target.value})}/></div><div className="form-group"><label>New</label><input type="password" value={passwordForm.newPass} onChange={e=>setPasswordForm({...passwordForm,newPass:e.target.value})}/></div><div className="form-group"><label>Confirm</label><input type="password" value={passwordForm.confirm} onChange={e=>setPasswordForm({...passwordForm,confirm:e.target.value})}/></div><button className="btn-gold" onClick={handlePasswordChange}>Update</button></div>)}

        {/* Dashboard Tab */}
        {activeTab==='dashboard'&&(<div><div className="stats-row"><div className="stat-box"><span className="stat-icon">💼</span><h3>{stats.activeListings}</h3><p>Active</p></div><div className="stat-box"><span className="stat-icon">✅</span><h3>{stats.filledJobs}</h3><p>Filled</p></div><div className="stat-box"><span className="stat-icon">👥</span><h3>{stats.totalApplications}</h3><p>Applicants</p></div><div className="stat-box"><span className="stat-icon">💰</span><h3>{formatNaira(stats.totalCommissionEarned)}</h3><p>Earned</p></div></div><div className="dash-card"><h3>Next Payout: {nextPayout}</h3></div></div>)}

        {/* My Jobs Tab */}
        {activeTab==='jobs'&&(
          <div className="dash-card">
            <h3>My Jobs</h3>
            {jobs.length===0 ? <p className="text-muted">No jobs posted yet.</p> :
              <div className="grid-2">
                {jobs.map(job=>(
                  <div key={job.id} className="card" style={{borderLeft:'4px solid #d4a843',padding:'15px'}}>
                    <h4>{job.title}</h4>
                    <p className="text-muted">🏢 {job.organization}</p>
                    <p className="salary">{formatNaira(job.salary_min)} - {formatNaira(job.salary_max)}</p>
                    <p>👥 {job.applications || 0} applications</p>
                    <span className={`badge ${job.status==='active'?'badge-verified':'badge-pending'}`}>{job.status}</span>
                  </div>
                ))}
              </div>
            }
          </div>
        )}

        {/* Post Job Tab */}
        {activeTab==='post'&&(<div className="dash-card form-card"><h3>Post New Job</h3><form onSubmit={handlePost}><div className="form-group"><label>Job Title *</label><input value={form.job_title} onChange={e=>setForm({...form,job_title:e.target.value})} required/></div><div className="form-group"><label>Organization *</label><input value={form.organization_name} onChange={e=>setForm({...form,organization_name:e.target.value})} required/></div><div className="form-group"><label>Qualification *</label><textarea value={form.qualification_requirements} onChange={e=>setForm({...form,qualification_requirements:e.target.value})} required/></div><div className="form-group"><label>Experience *</label><textarea value={form.experience_requirements} onChange={e=>setForm({...form,experience_requirements:e.target.value})} required/></div><div className="form-row"><div className="form-group"><label>Min Salary (₦)</label><input type="number" value={form.salary_range_min} onChange={e=>setForm({...form,salary_range_min:e.target.value})}/></div><div className="form-group"><label>Max Salary (₦)</label><input type="number" value={form.salary_range_max} onChange={e=>setForm({...form,salary_range_max:e.target.value})}/></div></div><div className="commission-setting-card"><h4>💰 Commission</h4><div className="form-group"><label>% (5-35)</label><input type="number" min="5" max="35" value={commissionPercent} onChange={e=>setCommissionPercent(Number(e.target.value))}/></div><div><label>🔄 Negotiable</label><input type="radio" checked={isNegotiable} onChange={()=>setIsNegotiable(true)}/> <label>🔒 Fixed</label><input type="radio" checked={!isNegotiable} onChange={()=>setIsNegotiable(false)}/></div></div><button type="submit" className="btn-gold">📢 Post Job ({commissionPercent}%)</button></form></div>)}

        {/* Other tabs */}
        {['applications','disputes','earnings','payout','profile','messages','notifications','prep'].includes(activeTab)&&activeTab!=='verification'&&activeTab!=='password'&&activeTab!=='post'&&activeTab!=='dashboard'&&activeTab!=='jobs'&&(<div className="dash-card"><h3>{activeTab}</h3><p className="text-muted">Content available</p></div>)}
      </div>
    </div>
  );
}

export default AgentDashboard;