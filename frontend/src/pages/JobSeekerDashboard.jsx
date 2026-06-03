import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getJobs, submitVerification } from '../services/api';
import './Dashboard.css';
import { getJobs, submitVerification, getUserProfile } from '../services/api';
function JobSeekerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const unreadCount = 2;

  const isVerified = user?.is_verified || false;

  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  // Full verification form
  const [verifyForm, setVerifyForm] = useState({
    full_name: '', date_of_birth: '', address: '', nin: '',
    next_of_kin_name: '', next_of_kin_phone: '', next_of_kin_address: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    social_media_1: '', social_media_2: ''
  });
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
const [profileData, setProfileData] = useState(null);

useEffect(() => {
  if (user?.id) {
    getUserProfile(user.id)
      .then(res => setProfileData(res.data.profile))
      .catch(console.log);
  }
}, [user]);
  const [agreements, setAgreements] = useState([]);
  const [disputeData, setDisputeData] = useState({ type: 'refund', what: '', where: '', when: '', why: '' });
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);
  const [releasedCommission, setReleasedCommission] = useState({});

  const [seekersMessages, setSeekersMessages] = useState([
    { id: 1, from: 'John Agent', subject: 'Interview Preparation', message: 'Prepare for your interview on Friday.', time: '2 hours ago', unread: true },
    { id: 2, from: 'JobConnect Admin', subject: 'Verification Reminder', message: 'Complete your verification to access all features.', time: 'Yesterday', unread: true },
  ]);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Job Match', message: 'A new Software Developer job matches your profile', type: 'info', time: '1 hour ago' },
  ]);
  const [seekerMessages, setSeekerMessages] = useState([
    { id: 1, from: 'John Agent', subject: 'Interview Preparation', message: 'Prepare for your interview on Friday. I will send study materials.', time: '2 hours ago', unread: true },
    { id: 2, from: 'JobConnect Admin', subject: 'Verification Reminder', message: 'Please complete your verification to access all features.', time: 'Yesterday', unread: true },
    { id: 3, from: 'John Agent', subject: 'Job Application Received', message: 'Your application for Software Developer has been received.', time: '3 days ago', unread: false },
  ]);
  const [seekerChatMessages, setSeekerChatMessages] = useState([]);
  const [seekerChatInput, setSeekerChatInput] = useState('');
  const [selectedSeekerContact, setSelectedSeekerContact] = useState('');
  const [seekerCallTarget, setSeekerCallTarget] = useState('');
  const [showSeekerCall, setShowSeekerCall] = useState(false);
  const [seekerNoticeBoard, setSeekerNoticeBoard] = useState([
    { id: 1, title: 'New Feature: Video Meetings', content: 'You can now make video calls directly from your dashboard.', priority: 'normal', date: '2024-06-01' },
    { id: 2, title: 'Job Alert', content: 'New jobs posted in your area. Check the Find Jobs tab!', priority: 'high', date: '2024-05-30' },
  ]);
    const handleSeekerSendChat = () => {
    if (!seekerChatInput.trim()) return;
    setSeekerChatMessages([...seekerChatMessages, { id: Date.now(), sender: 'seeker', text: seekerChatInput, time: new Date().toLocaleTimeString(), isSeeker: true }]);
    setSeekerChatInput('');
  };

  const handleSeekerReplyMessage = (from) => {
    const reply = prompt(`Reply to ${from}:`);
    if (reply) alert(`✅ Reply sent to ${from}`);
  };

  const handleSeekerStartCall = () => {
    if (!seekerCallTarget) { alert('Select who to call'); return; }
    setShowSeekerCall(true);
    const roomUrl = `https://meet.jit.si/JobConnect-Seeker-${Date.now()}`;
    navigator.clipboard?.writeText(roomUrl);
    alert(`📋 Room link copied! Share with ${seekerCallTarget} to join the call.\n\n${roomUrl}`);
  };
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/signin'); return; }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    getJobs().then(res => setJobs(res.data.jobs || [])).catch(console.log);
    setAgreements(JSON.parse(localStorage.getItem('agreements') || '[]'));
    setReleasedCommission(JSON.parse(localStorage.getItem('releasedCommissions') || '{}'));
  }, [navigate]);

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/signin'); };
  const formatNaira = (num) => '₦' + Number(num).toLocaleString();

  const handlePasswordChange = () => {
    setPasswordMsg('');
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) { setPasswordMsg('❌ All fields are required'); return; }
    if (passwordForm.newPass.length < 6) { setPasswordMsg('❌ New password must be at least 6 characters'); return; }
    if (passwordForm.newPass !== passwordForm.confirm) { setPasswordMsg('❌ Passwords do not match'); return; }
    setPasswordMsg('✅ Password changed successfully!');
    setPasswordForm({ current: '', newPass: '', confirm: '' });
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  const handleVerifySubmit = async () => {
    setVerifyLoading(true); setVerifyMsg('');
    try {
      await submitVerification({ user_id: user?.id, email: user?.email, user_type: 'job_seeker', ...verifyForm });
      setVerifyMsg('✅ Verification submitted! Our team will review within 24-48 hours.');
    } catch { setVerifyMsg('❌ Failed to submit. Please try again.'); }
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
      alert('✅ Commission released! Agent paid on 25th (min ₦10,000).');
    }
  };

  const handleDisputeSubmit = (key, type) => {
    if (type === 'refund') {
      if (!disputeData.what || !disputeData.why) { alert('Fill all dispute details'); return; }
      if (window.confirm('Submit refund request?')) {
        const updatedAgreements = agreements.map((a, i) => (`${a.jobId}-${i}` === key ? { ...a, status: 'disputed', disputeType: 'refund', ...disputeData } : a));
        setAgreements(updatedAgreements);
        localStorage.setItem('agreements', JSON.stringify(updatedAgreements));
        setDisputeSubmitted(true);
        setDisputeData({ type: 'refund', what: '', where: '', when: '', why: '' });
        alert('⚖️ Dispute submitted.');
      }
    } else {
      if (window.confirm('Keep commission for next job?')) {
        const updatedAgreements = agreements.map((a, i) => (`${a.jobId}-${i}` === key ? { ...a, status: 'carried_forward', disputeType: 'carry_forward' } : a));
        setAgreements(updatedAgreements);
        localStorage.setItem('agreements', JSON.stringify(updatedAgreements));
        setDisputeSubmitted(true);
        alert('📋 Commission saved for next job.');
      }
    }
  };

  const stats = {
    availableJobs: jobs.length,
    applied: agreements.filter(a => a.status === 'paid').length,
    accepted: agreements.filter(a => a.status === 'released').length,
    totalPaid: agreements.reduce((sum, a) => sum + (a.commissionAmount || 0), 0)
  };

  return (
    <div className="dashboard">
      <div className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="user-avatar">👩🏾‍💼</div>
          {!sidebarCollapsed && <>{isVerified ? <span className="badge badge-verified">Verified</span> : <span className="badge badge-pending">Unverified</span>}</>}
        </div>
        <nav className="sidebar-nav">
          <div className="nav-header">MAIN NAVIGATION</div>
          <button className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}><i className="fas fa-tachometer-alt"></i> <span className="sidebar-text">Dashboard</span></button>
          <button className={`nav-item ${activeTab==='jobs'?'active':''}`} onClick={()=>setActiveTab('jobs')}><i className="fas fa-briefcase"></i> <span className="sidebar-text">Find Jobs</span></button>
          <button className={`nav-item ${activeTab==='applied'?'active':''}`} onClick={()=>setActiveTab('applied')}><i className="fas fa-paper-plane"></i> <span className="sidebar-text">My Applications</span></button>
          <button className={`nav-item ${activeTab==='release'?'active':''}`} onClick={()=>setActiveTab('release')}><i className="fas fa-check-circle"></i> <span className="sidebar-text">Release Commission</span></button>
          <button className={`nav-item ${activeTab==='dispute'?'active':''}`} onClick={()=>setActiveTab('dispute')}><i className="fas fa-exclamation-triangle"></i> <span className="sidebar-text">Open Dispute</span></button>
          <hr className="sidebar-divider" /><div className="nav-header">COMMUNICATION</div>
          <button className={`nav-item ${activeTab==='messages'?'active':''}`} onClick={()=>setActiveTab('messages')}><i className="fas fa-envelope"></i> <span className="sidebar-text">Messages</span></button>
          <button className={`nav-item ${activeTab==='notifications'?'active':''}`} onClick={()=>setActiveTab('notifications')}><i className="fas fa-bell"></i> <span className="sidebar-text">Notifications</span></button>
          <hr className="sidebar-divider" /><div className="nav-header">FINANCES</div>
          <button className={`nav-item ${activeTab==='agreements'?'active':''}`} onClick={()=>setActiveTab('agreements')}><i className="fas fa-file-contract"></i> <span className="sidebar-text">Agreements</span></button>
          <button className={`nav-item ${activeTab==='payments'?'active':''}`} onClick={()=>setActiveTab('payments')}><i className="fas fa-credit-card"></i> <span className="sidebar-text">Payments</span></button>
          <hr className="sidebar-divider" /><div className="nav-header">ACCOUNT</div>
          <button className={`nav-item ${activeTab==='profile'?'active':''}`} onClick={()=>setActiveTab('profile')}><i className="fas fa-user-circle"></i> <span className="sidebar-text">My Profile</span></button>
          <button className={`nav-item ${activeTab==='edit-profile'?'active':''}`} onClick={()=>setActiveTab('edit-profile')}><i className="fas fa-edit"></i> <span className="sidebar-text">Edit Profile</span></button>
          <button className={`nav-item ${activeTab==='verification'?'active':''}`} onClick={()=>setActiveTab('verification')}><i className="fas fa-id-card"></i> <span className="sidebar-text">Verification</span></button>
          <button className={`nav-item ${activeTab==='password'?'active':''}`} onClick={()=>setActiveTab('password')}><i className="fas fa-lock"></i> <span className="sidebar-text">Change Password</span></button>
          <hr className="sidebar-divider" />
          <hr className="sidebar-divider" /><div className="nav-header">COMMUNICATION</div>
<button className={`nav-item ${activeTab==='seeker-messages'?'active':''}`} onClick={()=>setActiveTab('seeker-messages')}><i className="fas fa-envelope"></i> <span className="sidebar-text">Messages</span>{seekerMessages.filter(m=>m.unread).length>0&&<span className="notification-badge">{seekerMessages.filter(m=>m.unread).length}</span>}</button>
<button className={`nav-item ${activeTab==='seeker-chat'?'active':''}`} onClick={()=>setActiveTab('seeker-chat')}><i className="fas fa-comments"></i> <span className="sidebar-text">Live Chat</span></button>
<button className={`nav-item ${activeTab==='seeker-calls'?'active':''}`} onClick={()=>setActiveTab('seeker-calls')}><i className="fas fa-phone"></i> <span className="sidebar-text">Make Calls</span></button>
<button className={`nav-item ${activeTab==='seeker-noticeboard'?'active':''}`} onClick={()=>setActiveTab('seeker-noticeboard')}><i className="fas fa-clipboard-list"></i> <span className="sidebar-text">Notice Board</span></button>
          <button className="nav-item logout-btn" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> <span className="sidebar-text">Logout</span></button>
        </nav>
      </div>

      <div className={`dashboard-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="dash-topbar">
          <div><button className="toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button></div>
          <div className="header-actions" style={{position:'relative'}}>
            <span>Welcome, <strong>{user?.email?.split('@')[0] || 'Seeker'}</strong></span>
            {isVerified ? <span className="badge badge-verified">Verified</span> : <span className="badge badge-pending">Unverified</span>}
            <div className="user-avatar" onClick={() => setShowDropdown(!showDropdown)} style={{cursor:'pointer'}}>{(user?.email?.[0] || 'S').toUpperCase()}</div>
            {showDropdown && (
              <div className="profile-dropdown show"><div className="dropdown-header"><strong>{user?.email || 'Seeker'}</strong><small>Job Seeker</small></div>
                <button className="dropdown-item" onClick={()=>{setActiveTab('profile');setShowDropdown(false);}}><i className="fas fa-user"></i> View Profile</button>
                <button className="dropdown-item" onClick={()=>{setActiveTab('password');setShowDropdown(false);}}><i className="fas fa-key"></i> Change Password</button>
                <button className="dropdown-item text-danger" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Logout</button>
              </div>
            )}
            <button className="logout-btn-header" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        {!isVerified && (
          <div className="verification-warning"><h3>⚠️ ACCOUNT NOT VERIFIED</h3><p><strong>Until you are verified, you cannot perform any actions on this dashboard.</strong></p>
            <button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer',fontWeight:'bold',marginTop:'10px'}} onClick={() => setActiveTab('verification')}>Complete Verification Now</button></div>
        )}

        <div className="welcome-card"><div><h4>Welcome Back, {user?.email?.split('@')[0] || 'Seeker'}!</h4><p>Here's your job search overview.</p></div><i className="fas fa-search" style={{fontSize:'3rem',opacity:0.3}}></i></div>
        {/* View Profile Tab */}
{activeTab === 'profile' && (
  <div className="dash-card form-card">
    <h3>👤 My Profile</h3>
    {profileData ? (
      <>
        <div className="form-group"><label>Full Name</label><input type="text" value={profileData.full_name || 'Not set'} readOnly /></div>
        <div className="form-group"><label>Email Address</label><input type="email" value={profileData.email || ''} readOnly /></div>
        <div className="form-group"><label>Phone Number</label><input type="tel" value={profileData.phone || 'Not set'} readOnly /></div>
        <div className="form-group"><label>Date of Birth</label><input type="text" value={profileData.date_of_birth || 'Not set'} readOnly /></div>
        <div className="form-group"><label>Address</label><input type="text" value={profileData.address || 'Not set'} readOnly /></div>
        <div className="form-group"><label>City</label><input type="text" value={profileData.city || 'Not set'} readOnly /></div>
        <div className="form-group"><label>State</label><input type="text" value={profileData.state || 'Not set'} readOnly /></div>
        <div className="form-group"><label>NIN</label><input type="text" value={profileData.nin || 'Not set'} readOnly /></div>
        {profileData.user_type !== 'job_seeker' && (
          <>
            <div className="form-group"><label>BVN</label><input type="text" value={profileData.bvn || 'Not set'} readOnly /></div>
            <div className="form-group"><label>Bank Name</label><input type="text" value={profileData.bank_name || 'Not set'} readOnly /></div>
            <div className="form-group"><label>Account Number</label><input type="text" value={profileData.account_number || 'Not set'} readOnly /></div>
          </>
        )}
        <div className="form-group"><label>Verification Status</label><input type="text" value={profileData.verification_status || 'pending'} readOnly style={{color: profileData.is_verified ? '#28a745' : '#dc3545', fontWeight: 'bold'}} /></div>
      </>
    ) : (
      <p className="text-muted">Loading profile...</p>
    )}
  </div>
)}
{/* Edit Profile Tab */}
{activeTab === 'edit-profile' && (
  <div className="dash-card form-card">
    <h3>✏️ Edit Profile</h3>
    <div className="form-group">
      <label>Full Name</label>
      <input type="text" placeholder="Update your name" id="edit-name" />
    </div>
    <div className="form-group">
      <label>Phone Number</label>
      <input type="tel" placeholder="080xxxxxxxx" id="edit-phone" />
    </div>
    <div className="form-group">
      <label>Address</label>
      <input type="text" placeholder="Your address" id="edit-address" />
    </div>
    <div className="form-group">
      <label>Date of Birth</label>
      <input type="date" id="edit-dob" />
    </div>
    <div className="form-group">
      <label>Profile Picture</label>
      <input type="file" />
    </div>
    <button className="btn-gold" onClick={() => {
      const name = document.getElementById('edit-name').value;
      const phone = document.getElementById('edit-phone').value;
      const address = document.getElementById('edit-address').value;
      if (name || phone || address) {
        alert('✅ Profile updated successfully!');
      } else {
        alert('Please fill at least one field to update.');
      }
    }}>💾 Save Changes</button>
  </div>
)}
        {/* VERIFICATION TAB */}
        {activeTab === 'verification' && (
          <div className="dash-card form-card">
            <h3>🛡️ Account Verification</h3>
            <p className="text-muted">Complete all fields to verify your account</p>
            <div className="verification-checklist"><h4>Required:</h4><p>✅ Email</p><p>✅ Phone</p><p>⏳ Full Name</p><p>⏳ DOB</p><p>⏳ Address</p><p>⏳ NIN (Optional)</p><p>⏳ Passport</p><p>⏳ Full Photo</p><p>⏳ Next of Kin</p><p>⏳ Emergency Contact</p><p>⏳ Social Media</p></div>
            <div className="form-group"><label>Full Name *</label><input type="text" placeholder="Your full legal name" value={verifyForm.full_name} onChange={e => setVerifyForm({...verifyForm, full_name: e.target.value})} required /></div>
            <div className="form-group"><label>Date of Birth *</label><input type="date" value={verifyForm.date_of_birth} onChange={e => setVerifyForm({...verifyForm, date_of_birth: e.target.value})} required /></div>
            <div className="form-group"><label>Address *</label><input type="text" placeholder="Your full residential address" value={verifyForm.address} onChange={e => setVerifyForm({...verifyForm, address: e.target.value})} required /></div>
            <div className="form-group"><label>NIN (Optional)</label><input type="text" placeholder="11-digit NIN" maxLength="11" value={verifyForm.nin} onChange={e => setVerifyForm({...verifyForm, nin: e.target.value})} /></div>
            <div className="form-group"><label>Upload Passport Photo</label><input type="file" /></div>
            <div className="form-group"><label>Upload Full Photo</label><input type="file" /></div>
            <h4 style={{marginTop:'20px',color:'#0a1628'}}>Next of Kin Details</h4>
            <div className="form-group"><label>Next of Kin Name *</label><input type="text" placeholder="Full name" value={verifyForm.next_of_kin_name} onChange={e => setVerifyForm({...verifyForm, next_of_kin_name: e.target.value})} required /></div>
            <div className="form-group"><label>Next of Kin Phone *</label><input type="tel" placeholder="080xxxxxxxx" value={verifyForm.next_of_kin_phone} onChange={e => setVerifyForm({...verifyForm, next_of_kin_phone: e.target.value})} required /></div>
            <div className="form-group"><label>Next of Kin Address</label><input type="text" placeholder="Address" value={verifyForm.next_of_kin_address} onChange={e => setVerifyForm({...verifyForm, next_of_kin_address: e.target.value})} /></div>
            <h4 style={{marginTop:'20px',color:'#0a1628'}}>Emergency Contact</h4>
            <div className="form-group"><label>Emergency Contact Name *</label><input type="text" placeholder="Full name" value={verifyForm.emergency_contact_name} onChange={e => setVerifyForm({...verifyForm, emergency_contact_name: e.target.value})} required /></div>
            <div className="form-group"><label>Emergency Contact Phone *</label><input type="tel" placeholder="080xxxxxxxx" value={verifyForm.emergency_contact_phone} onChange={e => setVerifyForm({...verifyForm, emergency_contact_phone: e.target.value})} required /></div>
            <h4 style={{marginTop:'20px',color:'#0a1628'}}>Social Media</h4>
            <div className="form-group"><label>Social Media 1</label><input type="text" placeholder="@username" value={verifyForm.social_media_1} onChange={e => setVerifyForm({...verifyForm, social_media_1: e.target.value})} /></div>
            <div className="form-group"><label>Social Media 2</label><input type="text" placeholder="@username" value={verifyForm.social_media_2} onChange={e => setVerifyForm({...verifyForm, social_media_2: e.target.value})} /></div>
            <button className="btn-gold" onClick={handleVerifySubmit} disabled={verifyLoading}>{verifyLoading ? '⏳ Submitting...' : '📤 Submit Verification'}</button>
            {verifyMsg && <div className={verifyMsg.includes('✅') ? 'success-message' : 'error-message'} style={{marginTop:'15px'}}>{verifyMsg}</div>}
          </div>
        )}
{/* Seeker Messages Tab */}
{activeTab==='seeker-messages'&&(
  <div className="dash-card">
    <h3><i className="fas fa-envelope"></i> Messages</h3>
    <div className="table-container"><table className="data-table"><thead><tr><th>From</th><th>Subject</th><th>Message</th><th>Time</th><th>Action</th></tr></thead><tbody>
      {seekerMessages.map(m=>(
        <tr key={m.id} style={{background:m.unread?'#f0f7ff':'transparent',fontWeight:m.unread?'bold':'normal'}}>
          <td>{m.from}</td><td>{m.subject}</td><td>{m.message?.substring(0,40)}...</td><td>{m.time}</td>
          <td><button className="btn-sm" style={{background:'#0a1628',color:'white',border:'none',padding:'5px 10px',borderRadius:'3px',cursor:'pointer'}} onClick={()=>handleSeekerReplyMessage(m.from)}>Reply</button></td>
        </tr>
      ))}
    </tbody></table></div>
  </div>
)}

{/* Seeker Live Chat Tab */}
{activeTab==='seeker-chat'&&(
  <div className="dash-card" style={{display:'flex',flexDirection:'column',height:'60vh'}}>
    <h3><i className="fas fa-comments"></i> Live Chat</h3>
    <div style={{display:'flex',gap:'10px',marginBottom:'15px'}}>
      <select value={selectedSeekerContact} onChange={e=>setSelectedSeekerContact(e.target.value)} style={{padding:'8px',borderRadius:'5px',border:'2px solid #e0e0e0',flex:1}}>
        <option value="">Select contact...</option>
        <option value="Admin">Admin / Support</option>
        <option value="Agent">My Agent</option>
      </select>
    </div>
    <div style={{flex:1,overflowY:'auto',border:'1px solid #e0e0e0',borderRadius:'8px',padding:'15px',marginBottom:'15px',background:'#f9f9f9'}}>
      {seekerChatMessages.length===0?<p className="text-muted" style={{textAlign:'center'}}>Start a conversation</p>:
        seekerChatMessages.map(m=>(
          <div key={m.id} style={{textAlign:m.isSeeker?'right':'left',marginBottom:'12px'}}>
            <div style={{display:'inline-block',background:m.isSeeker?'#0a1628':'white',color:m.isSeeker?'white':'#333',padding:'10px 15px',borderRadius:'12px',maxWidth:'70%'}}>
              <p style={{margin:0,fontSize:'14px'}}>{m.text}</p><small style={{opacity:0.7,fontSize:'10px'}}>{m.time}</small>
            </div>
          </div>
        ))
      }
    </div>
    <div style={{display:'flex',gap:'10px'}}>
      <input type="text" value={seekerChatInput} onChange={e=>setSeekerChatInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&handleSeekerSendChat()} placeholder="Type message..." style={{flex:1,padding:'12px',border:'2px solid #e0e0e0',borderRadius:'8px'}}/>
      <button onClick={handleSeekerSendChat} className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'12px 20px',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'}}>Send</button>
    </div>
  </div>
)}

{/* Seeker Calls Tab */}
{activeTab==='seeker-calls'&&(
  <div className="dash-card">
    <h3><i className="fas fa-phone"></i> Make a Call</h3>
    <div style={{display:'flex',gap:'10px',marginBottom:'20px'}}>
      <select value={seekerCallTarget} onChange={e=>setSeekerCallTarget(e.target.value)} style={{padding:'10px',borderRadius:'5px',border:'2px solid #e0e0e0',flex:1}}>
        <option value="">Select who to call...</option>
        <option value="Admin">Admin / Support</option>
        <option value="Agent">My Agent</option>
      </select>
      <button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}} onClick={handleSeekerStartCall}>📹 Video Call</button>
      <button className="btn-sm" style={{background:'#0a1628',color:'#d4a843',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}} onClick={handleSeekerStartCall}>📞 Voice Call</button>
    </div>
    {showSeekerCall&&(
      <div style={{marginTop:'15px'}}>
        <button className="btn btn-red" style={{marginBottom:'10px'}} onClick={()=>setShowSeekerCall(false)}>❌ End Call</button>
        <iframe src={`https://meet.jit.si/JobConnect-Seeker-${Date.now()}`} style={{width:'100%',height:'400px',border:'none',borderRadius:'10px'}} allow="camera; microphone; fullscreen"/>
      </div>
    )}
  </div>
)}

{/* Seeker Notice Board Tab */}
{activeTab==='seeker-noticeboard'&&(
  <div className="dash-card">
    <h3><i className="fas fa-clipboard-list"></i> Notice Board & Broadcasts</h3>
    {seekerNoticeBoard.map(n=>(
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
        {/* Password Tab */}
        {activeTab === 'password' && (<div className="dash-card form-card"><h3>🔒 Change Password</h3>{passwordMsg && <div className={passwordMsg.includes('✅')?'success-message':'error-message'}>{passwordMsg}</div>}<div className="form-group"><label>Current Password</label><input type="password" value={passwordForm.current} onChange={e=>setPasswordForm({...passwordForm,current:e.target.value})}/></div><div className="form-group"><label>New Password</label><input type="password" value={passwordForm.newPass} onChange={e=>setPasswordForm({...passwordForm,newPass:e.target.value})}/></div><div className="form-group"><label>Confirm Password</label><input type="password" value={passwordForm.confirm} onChange={e=>setPasswordForm({...passwordForm,confirm:e.target.value})}/></div><button className="btn-gold" onClick={handlePasswordChange}>Update Password</button></div>)}

        {/* Dashboard Tab */}
        {activeTab==='dashboard'&&(<div><div className="stats-row"><div className="stat-box"><span className="stat-icon">💼</span><h3>{stats.availableJobs}</h3><p>Available Jobs</p></div><div className="stat-box"><span className="stat-icon">📝</span><h3>{stats.applied}</h3><p>Applied</p></div><div className="stat-box"><span className="stat-icon">✅</span><h3>{stats.accepted}</h3><p>Accepted</p></div><div className="stat-box"><span className="stat-icon">💰</span><h3>{formatNaira(stats.totalPaid)}</h3><p>Paid</p></div></div></div>)}

        {/* Find Jobs Tab */}
        {activeTab==='jobs'&&(
          <div className="dash-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'15px'}}>
              <h3>Available Jobs</h3>
              <Link to="/jobs" className="btn-sm" style={{background:'#d4a843',color:'#0a1628',textDecoration:'none',padding:'8px 16px',borderRadius:'5px',fontWeight:'bold'}}>Browse All</Link>
            </div>
            {jobs.length===0 ? <p className="text-muted">No jobs available yet. Check back soon!</p> :
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
        
                {/* Other tabs */}
        {['messages','notifications','applied','release','dispute','profile','edit-profile','agreements','payments'].includes(activeTab) && activeTab!=='verification' && activeTab!=='password' && activeTab!=='dashboard' && activeTab!=='jobs' && (<div className="dash-card"><h3>{activeTab.charAt(0).toUpperCase()+activeTab.slice(1)}</h3><p className="text-muted">Content available</p></div>)}
      </div>
    </div>
  );
}

export default JobSeekerDashboard;