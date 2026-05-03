import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getJobs } from '../services/api';
import './Dashboard.css';

function JobSeekerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const unreadCount = 2;

  // Verification status
  const isVerified = user?.is_verified || false;

  // Password change
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  // Agreements from localStorage
  const [agreements, setAgreements] = useState([]);
  const [disputeData, setDisputeData] = useState({ type: 'refund', what: '', where: '', when: '', why: '' });
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);
  const [releasedCommission, setReleasedCommission] = useState({});

  // Messages
  const [seekerMessages, setSeekerMessages] = useState([
    { id: 1, from: 'John Agent', subject: 'Interview Preparation', message: 'Prepare for your interview on Friday. I will send study materials.', time: '2 hours ago', unread: true },
    { id: 2, from: 'JobConnect Admin', subject: 'Verification Reminder', message: 'Please complete your verification to access all features.', time: 'Yesterday', unread: true },
    { id: 3, from: 'John Agent', subject: 'Job Application Received', message: 'Your application for Software Developer has been received.', time: '3 days ago', unread: false },
  ]);

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Job Match', message: 'A new Software Developer job matches your profile', type: 'info', time: '1 hour ago' },
    { id: 2, title: 'Payment Confirmed', message: 'Your commission payment of ₦45,000 has been confirmed', type: 'success', time: '2 days ago' },
  ]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/signin'); return; }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    getJobs().then(res => setJobs(res.data.jobs || [])).catch(console.log);
    const savedAgreements = JSON.parse(localStorage.getItem('agreements') || '[]');
    setAgreements(savedAgreements);
    const released = JSON.parse(localStorage.getItem('releasedCommissions') || '{}');
    setReleasedCommission(released);
  }, [navigate]);

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/signin'); };
  const formatNaira = (num) => '₦' + Number(num).toLocaleString();

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

  const handleReleaseCommission = (agreementKey) => {
    if (window.confirm('Are you sure you have started this job? This will release the commission to the agent.')) {
      const updated = { ...releasedCommission, [agreementKey]: { released: true, date: new Date().toISOString() } };
      setReleasedCommission(updated);
      localStorage.setItem('releasedCommissions', JSON.stringify(updated));
      const updatedAgreements = agreements.map((a, i) => {
        if (`${a.jobId}-${i}` === agreementKey) return { ...a, status: 'released' };
        return a;
      });
      setAgreements(updatedAgreements);
      localStorage.setItem('agreements', JSON.stringify(updatedAgreements));
      alert('✅ Commission released! Agent will receive payment on the 25th (minimum ₦10,000).');
    }
  };

  const handleDisputeSubmit = (agreementKey, type) => {
    if (type === 'refund') {
      if (!disputeData.what || !disputeData.why) { alert('Please fill in all dispute details'); return; }
      if (window.confirm('Submit refund request? Agent must confirm the rejection.')) {
        const updatedAgreements = agreements.map((a, i) => {
          if (`${a.jobId}-${i}` === agreementKey) return { ...a, status: 'disputed', disputeType: 'refund', ...disputeData };
          return a;
        });
        setAgreements(updatedAgreements);
        localStorage.setItem('agreements', JSON.stringify(updatedAgreements));
        setDisputeSubmitted(true);
        setDisputeData({ type: 'refund', what: '', where: '', when: '', why: '' });
        alert('⚖️ Dispute submitted. Agent will review and confirm.');
      }
    } else {
      if (window.confirm('Keep commission for your next job? Agent must confirm the rejection.')) {
        const updatedAgreements = agreements.map((a, i) => {
          if (`${a.jobId}-${i}` === agreementKey) return { ...a, status: 'carried_forward', disputeType: 'carry_forward' };
          return a;
        });
        setAgreements(updatedAgreements);
        localStorage.setItem('agreements', JSON.stringify(updatedAgreements));
        setDisputeSubmitted(true);
        alert('📋 Commission saved for your next job application!');
      }
    }
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
    availableJobs: jobs.length,
    applied: agreements.filter(a => a.status === 'paid').length,
    accepted: agreements.filter(a => a.status === 'released').length,
    totalPaid: agreements.reduce((sum, a) => sum + (a.commissionAmount || 0), 0)
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="user-avatar">👩🏾‍💼</div>
          {!sidebarCollapsed && (
            <>{isVerified ? <span className="badge badge-verified">Verified</span> : <span className="badge badge-pending">Unverified</span>}</>
          )}
        </div>
        <nav className="sidebar-nav">
          <div className="nav-header">MAIN NAVIGATION</div>
          <button className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}><i className="fas fa-tachometer-alt"></i> <span className="sidebar-text">Dashboard</span></button>
          <button className={`nav-item ${activeTab==='jobs'?'active':''}`} onClick={()=>setActiveTab('jobs')}><i className="fas fa-briefcase"></i> <span className="sidebar-text">Find Jobs</span></button>
          <button className={`nav-item ${activeTab==='applied'?'active':''}`} onClick={()=>setActiveTab('applied')}><i className="fas fa-paper-plane"></i> <span className="sidebar-text">My Applications</span></button>
          <button className={`nav-item ${activeTab==='release'?'active':''}`} onClick={()=>setActiveTab('release')}><i className="fas fa-check-circle"></i> <span className="sidebar-text">Release Commission</span></button>
          <button className={`nav-item ${activeTab==='dispute'?'active':''}`} onClick={()=>setActiveTab('dispute')}><i className="fas fa-exclamation-triangle"></i> <span className="sidebar-text">Open Dispute</span></button>
          <hr className="sidebar-divider" /><div className="nav-header">COMMUNICATION</div>
          <button className={`nav-item ${activeTab==='messages'?'active':''}`} onClick={()=>setActiveTab('messages')}><i className="fas fa-envelope"></i> <span className="sidebar-text">Messages</span>{seekerMessages.filter(m=>m.unread).length>0&&<span className="notification-badge">{seekerMessages.filter(m=>m.unread).length}</span>}</button>
          <button className={`nav-item ${activeTab==='notifications'?'active':''}`} onClick={()=>setActiveTab('notifications')}><i className="fas fa-bell"></i> <span className="sidebar-text">Notifications</span>{unreadCount>0&&<span className="notification-badge">{unreadCount}</span>}</button>
          <hr className="sidebar-divider" /><div className="nav-header">FINANCES</div>
          <button className={`nav-item ${activeTab==='agreements'?'active':''}`} onClick={()=>setActiveTab('agreements')}><i className="fas fa-file-contract"></i> <span className="sidebar-text">Agreements</span></button>
          <button className={`nav-item ${activeTab==='payments'?'active':''}`} onClick={()=>setActiveTab('payments')}><i className="fas fa-credit-card"></i> <span className="sidebar-text">Payments</span></button>
          <hr className="sidebar-divider" /><div className="nav-header">ACCOUNT</div>
          <button className={`nav-item ${activeTab==='profile'?'active':''}`} onClick={()=>setActiveTab('profile')}><i className="fas fa-user-circle"></i> <span className="sidebar-text">My Profile</span></button>
          <button className={`nav-item ${activeTab==='edit-profile'?'active':''}`} onClick={()=>setActiveTab('edit-profile')}><i className="fas fa-edit"></i> <span className="sidebar-text">Edit Profile</span></button>
          <button className={`nav-item ${activeTab==='verification'?'active':''}`} onClick={()=>setActiveTab('verification')}><i className="fas fa-id-card"></i> <span className="sidebar-text">Verification</span></button>
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
            <span>Welcome, <strong>{user?.email?.split('@')[0] || 'Seeker'}</strong></span>
            {isVerified ? <span className="badge badge-verified">Verified</span> : <span className="badge badge-pending">Unverified</span>}
            <div className="user-avatar" onClick={() => setShowDropdown(!showDropdown)} style={{cursor:'pointer'}}>{(user?.email?.[0] || 'S').toUpperCase()}</div>
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
            <p><strong>Until you are verified, you cannot perform any actions on this dashboard.</strong></p>
            <button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer',fontWeight:'bold',marginTop:'10px'}} onClick={() => setActiveTab('verification')}>Complete Verification Now</button>
          </div>
        )}

        <div className="welcome-card"><div><h4>Welcome Back, {user?.email?.split('@')[0] || 'Seeker'}!</h4><p>Here's your job search overview.</p></div><i className="fas fa-search" style={{fontSize:'3rem',opacity:0.3}}></i></div>

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

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="dash-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'15px'}}><h3><i className="fas fa-envelope"></i> Messages</h3></div>
            <div className="table-container"><table className="data-table"><thead><tr><th>From</th><th>Subject</th><th>Message</th><th>Time</th></tr></thead><tbody>
              {seekerMessages.map(m=>(<tr key={m.id} style={{background:m.unread?'#f0f7ff':'transparent',fontWeight:m.unread?'bold':'normal'}}><td>{m.from}</td><td>{m.subject}</td><td>{m.message.substring(0,50)}...</td><td>{m.time}</td></tr>))}
            </tbody></table></div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="dash-card">
            <h3><i className="fas fa-bell"></i> Notifications</h3>
            {notifications.map(n=>(<div key={n.id} className="list-row" style={{background:n.type==='success'?'#f0fff4':n.type==='warning'?'#fffdf5':'#f0f7ff',padding:'10px',borderRadius:'5px',marginBottom:'8px'}}><div><strong>{n.title}</strong><p className="text-muted">{n.message}</p></div><span style={{fontSize:'11px',color:'#999'}}>{n.time}</span></div>))}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="stats-row">
              <div className="stat-box"><span className="stat-icon">💼</span><h3>{stats.availableJobs}</h3><p>Available Jobs</p></div>
              <div className="stat-box"><span className="stat-icon">📝</span><h3>{stats.applied}</h3><p>Applied</p></div>
              <div className="stat-box"><span className="stat-icon">✅</span><h3>{stats.accepted}</h3><p>Accepted</p></div>
              <div className="stat-box"><span className="stat-icon">💰</span><h3>{formatNaira(stats.totalPaid)}</h3><p>Paid</p></div>
            </div>
            <div className="dash-card">
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'15px'}}><h3><i className="fas fa-briefcase"></i> Recent Jobs</h3>
                <Link to="/jobs" className="btn-sm" style={{background:'#d4a843',color:'#0a1628',textDecoration:'none',padding:'8px 16px',borderRadius:'5px',fontWeight:'bold'}}>Browse All</Link>
              </div>
              {jobs.length===0?<div style={{textAlign:'center',padding:'40px'}}><i className="fas fa-briefcase" style={{fontSize:'3rem',color:'#ccc'}}></i><p className="text-muted">No jobs available yet.</p></div>:
              <div className="grid-2">{jobs.slice(0,6).map(job=>(<div key={job.id} className="property-card"><div className="property-card-header"><h6 style={{margin:0}}>{job.title}</h6><span className="property-status status-available">{job.status||'Active'}</span></div><div className="property-card-body"><p><strong>Qualification:</strong> {job.qualification?.substring(0,30)}...</p><p><strong>Salary:</strong> {formatNaira(job.salary_min)} - {formatNaira(job.salary_max)}</p><Link to={`/jobs/${job.id}`} className="btn-sm" style={{background:'#dc3545',color:'white',textDecoration:'none',padding:'8px 16px',borderRadius:'5px',display:'inline-block'}}>View</Link></div></div>))}</div>}
            </div>
            <div className="dash-card"><h3><i className="fas fa-bolt"></i> Quick Actions</h3><div className="action-grid">
              <Link to="/jobs" className="action-card" style={{textDecoration:'none',color:'inherit'}}><span className="action-icon">🔍</span><h4>Browse Jobs</h4></Link>
              <button className="action-card" onClick={()=>setActiveTab('applied')}><span className="action-icon">📝</span><h4>Applications</h4></button>
              <button className="action-card" onClick={()=>setActiveTab('agreements')}><span className="action-icon">📋</span><h4>Agreements</h4></button>
              <button className="action-card" onClick={()=>setActiveTab('verification')}><span className="action-icon">🛡️</span><h4>Verification</h4></button>
            </div></div>
          </div>
        )}

        {/* Release Commission Tab */}
        {activeTab === 'release' && (
          <div className="dash-card"><h3>✅ Release Commission to Agent</h3>
            {agreements.filter(a=>a.status==='paid').length===0?<div className="empty-state"><span className="empty-icon">📋</span><h4>No active agreements</h4></div>:
            agreements.filter(a=>a.status==='paid').map((a,i)=>{const key=`${a.jobId}-${i}`;const isReleased=releasedCommission[key]?.released;return(<div key={key} style={{background:isReleased?'#d4edda':'#f0fff4',padding:'20px',borderRadius:'10px',marginTop:'15px'}}><h4>{a.jobTitle}</h4><p>Commission: {formatNaira(a.commissionAmount)} ({a.percentage}%)</p>{isReleased?<div style={{color:'#155724',fontWeight:'bold'}}>✅ Released</div>:<button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'12px 24px',borderRadius:'8px',cursor:'pointer'}} onClick={()=>handleReleaseCommission(key)}>✅ I Have Started the Job - Release Commission</button>}</div>);})}
          </div>
        )}

        {/* Dispute Tab */}
        {activeTab === 'dispute' && (
          <div className="dash-card"><h3>⚖️ Open Dispute</h3>
            {agreements.filter(a=>a.status==='paid').length===0?<div className="empty-state"><span className="empty-icon">📋</span><h4>No active agreements</h4></div>:
            agreements.filter(a=>a.status==='paid').map((a,i)=>{const key=`${a.jobId}-${i}`;const daysSince=Math.floor((Date.now()-new Date(a.paymentDate))/(86400000));const within=daysSince<=21;return(<div key={key} style={{marginTop:'20px'}}><h4>{a.jobTitle} - {formatNaira(a.commissionAmount)}</h4><p className="text-muted">{daysSince} days since payment</p>{!within&&<div style={{background:'#fff5f5',padding:'15px',borderRadius:'8px'}}>⚠️ 21-day window closed</div>}<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'15px',marginTop:'15px'}}><div style={{background:'#fff5f5',padding:'20px',borderRadius:'10px'}}><h4>🔄 Refund</h4><div className="form-group"><label>What happened?*</label><textarea value={disputeData.what} onChange={e=>setDisputeData({...disputeData,what:e.target.value})}/></div><div className="form-group"><label>Why?*</label><textarea value={disputeData.why} onChange={e=>setDisputeData({...disputeData,why:e.target.value})}/></div><button className="btn-sm" style={{background:'#dc3545',color:'white',border:'none',padding:'10px',borderRadius:'5px',cursor:'pointer',width:'100%'}} onClick={()=>handleDisputeSubmit(key,'refund')} disabled={!within}>Request Refund</button></div><div style={{background:'#f0f7ff',padding:'20px',borderRadius:'10px'}}><h4>📋 Keep for Next Job</h4><p>Apply commission to next application</p><button className="btn-sm" style={{background:'#0a1628',color:'#d4a843',border:'none',padding:'10px',borderRadius:'5px',cursor:'pointer',width:'100%'}} onClick={()=>handleDisputeSubmit(key,'carry_forward')} disabled={!within}>Keep Commission</button></div></div></div>);})}
          </div>
        )}

        {/* Other tabs */}
        {activeTab==='verification'&&(<div className="dash-card form-card"><h3>🛡️ Verification</h3><div className="verification-checklist"><h4>Required:</h4><p>✅ Email</p><p>✅ Phone</p><p>⏳ Passport</p><p>⏳ Full Photo</p><p>⏳ Next of Kin</p><p>⏳ Emergency Contact</p><p>⏳ Social Media</p></div><div className="form-group"><label>Upload Passport</label><input type="file"/></div><div className="form-group"><label>Next of Kin Name</label><input type="text"/></div><div className="form-group"><label>Next of Kin Phone</label><input type="tel"/></div><button className="btn-gold">Submit</button></div>)}
        {activeTab==='jobs'&&(<div className="dash-card"><h3>Available Jobs</h3><div className="grid-2">{jobs.map(job=>(<div key={job.id} className="card" style={{borderLeft:'4px solid #d4a843',padding:'15px'}}><h4>{job.title}</h4><p className="salary">{formatNaira(job.salary_min)} - {formatNaira(job.salary_max)}</p><Link to={`/jobs/${job.id}`} className="btn-sm btn-red" style={{textDecoration:'none'}}>Apply</Link></div>))}</div></div>)}
        {activeTab==='profile'&&(<div className="dash-card form-card"><h3>My Profile</h3><div className="form-group"><label>Full Name</label><input type="text"/></div><div className="form-group"><label>Email</label><input type="email" value={user?.email||''} readOnly/></div><div className="form-group"><label>Phone</label><input type="tel"/></div><div className="form-group"><label>Upload CV</label><input type="file"/></div><button className="btn-gold">Update</button></div>)}
        {activeTab==='edit-profile'&&(<div className="dash-card form-card"><h3>Edit Profile</h3><div className="form-group"><label>Full Name</label><input type="text"/></div><div className="form-group"><label>Phone</label><input type="tel"/></div><div className="form-group"><label>Address</label><input type="text"/></div><button className="btn-gold">Save</button></div>)}
        {activeTab==='applied'&&(<div className="dash-card"><h3>My Applications</h3><div className="table-container"><table className="data-table"><thead><tr><th>Job</th><th>Status</th><th>Date</th></tr></thead><tbody>{agreements.map((a,i)=>(<tr key={i}><td>{a.jobTitle}</td><td><span className={`badge ${a.status==='paid'?'badge-verified':'badge-pending'}`}>{a.status}</span></td><td>{new Date(a.paymentDate).toLocaleDateString()}</td></tr>))}</tbody></table></div></div>)}
        {activeTab==='agreements'&&(<div className="dash-card"><h3>Commission Agreements</h3>{agreements.map((a,i)=>(<div key={i} className="card" style={{borderLeft:'4px solid #d4a843',padding:'15px',marginBottom:'10px'}}><h4>{a.jobTitle}</h4><p>Commission: {formatNaira(a.commissionAmount)} ({a.percentage}%)</p><p>Status: <span className="badge badge-gold">{a.status}</span></p></div>))}</div>)}
        {activeTab==='payments'&&(<div className="dash-card"><h3>Payment History</h3><div className="table-container"><table className="data-table"><thead><tr><th>Job</th><th>Amount</th><th>Date</th></tr></thead><tbody>{agreements.map((a,i)=>(<tr key={i}><td>{a.jobTitle}</td><td>{formatNaira(a.commissionAmount)}</td><td>{new Date(a.paymentDate).toLocaleDateString()}</td></tr>))}</tbody></table></div></div>)}
      </div>
    </div>
  );
}

export default JobSeekerDashboard;