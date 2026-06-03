import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { getTestData, getJobs, getAnnouncements, getAnalyticsSummary, getVerifications, verifyUser, getUsersList, getTestimonials } from '../services/api';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [userStatuses, setUserStatuses] = useState({});
  const [pendingUsers, setPendingUsers] = useState([]);

  const adminRole = user?.adminLevel || 'admin';
  const isSuperAdmin = adminRole === 'admin';
  const roleDisplay = { admin: 'Super Administrator', admin2: 'Senior Administrator', admin1: 'Junior Administrator', admin2_70: 'Limited Administrator' };
  const canDelete = ['admin', 'admin2'].includes(adminRole);
  const canEditUsers = ['admin', 'admin2', 'admin1'].includes(adminRole);
  const canViewReports = adminRole !== 'admin2_70';
  const canManageSettings = ['admin', 'admin2'].includes(adminRole);
  const canApproveVerifications = ['admin', 'admin2', 'admin1'].includes(adminRole);
  const canExportData = adminRole !== 'admin2_70';
  const canResetPasswords = ['admin', 'admin2', 'admin1'].includes(adminRole);

  const [messages, setMessages] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [selectedChatUser, setSelectedChatUser] = useState('');
  const [callLogs] = useState([]);
  const [callTarget, setCallTarget] = useState('');
  const [accessLogs] = useState([{ id: 1, user: 'admin@jobconnect.com', page: '/dashboard/admin', ip: '192.168.1.1', gps: '6.5244,3.3792', device: 'Chrome/Windows', time: '2 min ago' }]);
  const [activityLogs] = useState([{ id: 1, user: 'admin', action: 'login', description: 'Admin logged into dashboard', module: 'auth', severity: 'info', time: '2 min ago' }]);
  const [auditLogs] = useState([{ id: 1, user: 'admin', action: 'UPDATE', table: 'users', record: 'agent1', change: 'is_verified: false → true', time: '1 hour ago' }]);
  const [noticeBoard, setNoticeBoard] = useState([{ id: 1, title: 'System Maintenance', content: 'Scheduled maintenance on May 5th', priority: 'high', date: '2024-05-03' }]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', priority: 'normal', audience: 'all' });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/signin'); return; }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.email === 'admin@jobconnect.com') parsedUser.adminLevel = 'admin';
    setUser(parsedUser);
    getTestData().then(res => setUsers(res.data.users || [])).catch(console.log);
    getJobs().then(res => setJobs(res.data.jobs || [])).catch(console.log);
    getAnnouncements().then(res => setAnnouncements(res.data.announcements || [])).catch(console.log);
    getAnalyticsSummary().then(res => setAnalytics(res.data.stats || {})).catch(console.log);
    getUsersList().then(res => setAllUsers(res.data.users || [])).catch(console.log);
    getTestimonials().then(res => setTestimonials(res.data.testimonials || [])).catch(console.log);
    loadVerifications();
  }, [navigate]);

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/signin'); };

  const handleSendChat = () => {
    if (!newChatMessage.trim() || !selectedChatUser) return;
    setChatMessages([...chatMessages, { id: Date.now(), sender: 'admin', text: newChatMessage, time: new Date().toLocaleTimeString(), isAdmin: true }]);
    setNewChatMessage('');
  };

  const handleReplyMessage = (userEmail) => {
    const reply = prompt(`Reply to ${userEmail}:`);
    if (reply) alert(`✅ Reply sent to ${userEmail}`);
  };

  const handlePostAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    setNoticeBoard([{ id: Date.now(), ...newAnnouncement, date: new Date().toISOString().split('T')[0] }, ...noticeBoard]);
    setNewAnnouncement({ title: '', content: '', priority: 'normal', audience: 'all' });
    setShowAnnouncementForm(false);
  };

  const handlePasswordChange = () => {
    setPasswordMsg('');
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) { setPasswordMsg('❌ All fields are required'); return; }
    if (passwordForm.newPass.length < 6) { setPasswordMsg('❌ Min 6 characters'); return; }
    if (passwordForm.newPass !== passwordForm.confirm) { setPasswordMsg('❌ Passwords do not match'); return; }
    setPasswordMsg('✅ Password changed successfully!');
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  const handleExportCSV = (data, filename) => {
    const csv = Object.keys(data[0]).join(',') + '\n' + data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  const handlePrint = () => window.print();

  const handleResetUserPassword = (userEmail) => {
    const newPass = prompt(`Enter new password for ${userEmail} (min 6 characters):`);
    if (newPass && newPass.length >= 6) { alert(`✅ Password reset for ${userEmail}`); } else if (newPass) { alert('❌ Min 6 characters'); }
  };

  const loadVerifications = () => {
    getVerifications().then(res => { setPendingUsers(res.data.users || []); }).catch(console.log);
  };

  const handleVerifyAction = async (userId, action) => {
    if (window.confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this user?`)) {
      try { await verifyUser(userId, action); alert(`✅ User ${action}d successfully!`); loadVerifications(); }
      catch { alert('❌ Action failed.'); }
    }
  };

  const toggleUserStatus = (userId) => { setUserStatuses(prev => ({ ...prev, [userId]: !(prev[userId] ?? true) })); };

  const stats = {
    totalUsers: users.length, activeJobs: jobs.filter(j => j.status === 'active').length,
    totalJobs: jobs.length, pendingVerifications: pendingUsers.length,
    platformRevenue: '₦0', totalTransactions: 0,
    totalAgents: users.filter(u => u.type === 'agent').length,
    totalSeekers: users.filter(u => u.type === 'job_seeker').length,
  };

  return (
    <div className="dashboard">
      <div className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} id="sidebar">
        <div className="sidebar-header"><div className="user-avatar">👑</div>{!sidebarCollapsed && (<><h3>JobConnect</h3><span className="badge badge-gold">Admin Panel</span></>)}</div>
        <nav className="sidebar-nav">
          <div className="nav-header">MAIN NAVIGATION</div>
          <button className={`nav-item ${activeTab==='overview'?'active':''}`} onClick={()=>setActiveTab('overview')}>📊 <span className="sidebar-text">Dashboard</span></button>
          {canEditUsers && <button className={`nav-item ${activeTab==='users'?'active':''}`} onClick={()=>setActiveTab('users')}>👥 <span className="sidebar-text">Users</span></button>}
          <button className={`nav-item ${activeTab==='jobs'?'active':''}`} onClick={()=>setActiveTab('jobs')}>💼 <span className="sidebar-text">Jobs</span></button>
          {canApproveVerifications && <button className={`nav-item ${activeTab==='verifications'?'active':''}`} onClick={()=>setActiveTab('verifications')}>🛡️ <span className="sidebar-text">Verifications</span></button>}
          <button className={`nav-item ${activeTab==='applications'?'active':''}`} onClick={()=>setActiveTab('applications')}>📝 <span className="sidebar-text">Applications</span></button>
          <button className={`nav-item ${activeTab==='disputes'?'active':''}`} onClick={()=>setActiveTab('disputes')}>⚖️ <span className="sidebar-text">Disputes</span></button>
          <hr className="sidebar-divider" /><div className="nav-header">COMMUNICATION</div>
          <button className={`nav-item ${activeTab==='communication'?'active':''}`} onClick={()=>setActiveTab('communication')}>📨 <span className="sidebar-text">Communication</span></button>
          <button className={`nav-item ${activeTab==='messages'?'active':''}`} onClick={()=>setActiveTab('messages')}>💬 <span className="sidebar-text">Messages</span></button>
          <button className={`nav-item ${activeTab==='chat'?'active':''}`} onClick={()=>setActiveTab('chat')}>💭 <span className="sidebar-text">Live Chat</span></button>
          <button className={`nav-item ${activeTab==='calls'?'active':''}`} onClick={()=>setActiveTab('calls')}>📞 <span className="sidebar-text">Video Calls</span></button>
          <button className={`nav-item ${activeTab==='noticeboard'?'active':''}`} onClick={()=>setActiveTab('noticeboard')}>📋 <span className="sidebar-text">Notice Board</span></button>
          <hr className="sidebar-divider" /><div className="nav-header">MONITORING</div>
          <button className={`nav-item ${activeTab==='accesslogs'?'active':''}`} onClick={()=>setActiveTab('accesslogs')}>🔍 <span className="sidebar-text">Access Logs</span></button>
          <button className={`nav-item ${activeTab==='activitylogs'?'active':''}`} onClick={()=>setActiveTab('activitylogs')}>📝 <span className="sidebar-text">Activity Logs</span></button>
          <button className={`nav-item ${activeTab==='auditlogs'?'active':''}`} onClick={()=>setActiveTab('auditlogs')}>🔐 <span className="sidebar-text">Audit Logs</span></button>
          <button className={`nav-item ${activeTab==='gps'?'active':''}`} onClick={()=>setActiveTab('gps')}>📍 <span className="sidebar-text">GPS Tracking</span></button>
          <hr className="sidebar-divider" /><div className="nav-header">CONTENT & REPORTS</div>
          <button className={`nav-item ${activeTab==='testimonials'?'active':''}`} onClick={()=>setActiveTab('testimonials')}>⭐ <span className="sidebar-text">Testimonials</span></button>
          <button className={`nav-item ${activeTab==='transactions'?'active':''}`} onClick={()=>setActiveTab('transactions')}>💳 <span className="sidebar-text">Transactions</span></button>
          <button className={`nav-item ${activeTab==='analytics'?'active':''}`} onClick={()=>setActiveTab('analytics')}>📈 <span className="sidebar-text">Analytics</span></button>
          <hr className="sidebar-divider" /><div className="nav-header">SYSTEM</div>
          {canManageSettings && <button className={`nav-item ${activeTab==='settings'?'active':''}`} onClick={()=>setActiveTab('settings')}>⚙️ <span className="sidebar-text">Settings</span></button>}
          <button className={`nav-item ${activeTab==='password'?'active':''}`} onClick={()=>setActiveTab('password')}>🔒 <span className="sidebar-text">Change Password</span></button>
          <button className={`nav-item ${activeTab==='courses'?'active':''}`} onClick={()=>setActiveTab('courses')}>📚 <span className="sidebar-text">Courses</span></button>
          <button className={`nav-item ${activeTab==='services'?'active':''}`} onClick={()=>setActiveTab('services')}>🔧 <span className="sidebar-text">Services</span></button>
          <hr className="sidebar-divider" />
          <button className="nav-item logout-btn" onClick={handleLogout}>🚪 <span className="sidebar-text">Logout</span></button>
        </nav>
      </div>

      <div className={`dashboard-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="dash-topbar"><div><button className="toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button></div><div className="header-actions" style={{position:'relative'}}><span>Welcome, {user?.email?.split('@')[0] || 'Admin'}</span><span className={`role-badge role-${isSuperAdmin?'super':'senior'}`}>{roleDisplay[adminRole]}</span><div className="user-avatar" onClick={()=>setShowProfileDropdown(!showProfileDropdown)} style={{cursor:'pointer'}}>{(user?.email?.[0]||'A').toUpperCase()}</div>{showProfileDropdown&&(<div className="profile-dropdown show"><div className="dropdown-header"><strong>{user?.email}</strong><small>{roleDisplay[adminRole]}</small></div><button className="dropdown-item" onClick={()=>{setActiveTab('settings');setShowProfileDropdown(false);}}>⚙️ Settings</button><button className="dropdown-item text-danger" onClick={handleLogout}>🚪 Logout</button></div>)}<button className="logout-btn-header" onClick={handleLogout}>🚪 Logout</button></div></div>
        <div className="welcome-card"><div><h4>Welcome Back, {user?.email?.split('@')[0] || 'Admin'}!</h4><p>Here's what's happening on your platform today.</p></div><i className="fas fa-chart-line" style={{fontSize:'3rem',opacity:0.3}}></i></div>

        {/* PASSWORD TAB */}
        {activeTab==='password'&&(<div className="dash-card form-card"><h3>🔒 Change Password</h3>{passwordMsg&&<div className={passwordMsg.includes('✅')?'success-message':'error-message'}>{passwordMsg}</div>}<div className="form-group"><label>Current Password</label><input type="password" value={passwordForm.current} onChange={e=>setPasswordForm({...passwordForm,current:e.target.value})}/></div><div className="form-group"><label>New Password</label><input type="password" value={passwordForm.newPass} onChange={e=>setPasswordForm({...passwordForm,newPass:e.target.value})}/></div><div className="form-group"><label>Confirm</label><input type="password" value={passwordForm.confirm} onChange={e=>setPasswordForm({...passwordForm,confirm:e.target.value})}/></div><button className="btn-gold" onClick={handlePasswordChange}>Update Password</button></div>)}

        {/* USERS TAB */}
        {activeTab==='users'&&canEditUsers&&(<div className="dash-card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px',marginBottom:'15px'}}><h3><i className="fas fa-users"></i> User Management</h3><div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}><button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'8px 12px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>handleExportCSV(users.map(u=>({Email:u.email,Type:u.type,Verified:u.verified?'Yes':'No'})),'users_export.csv')}>📥 Export CSV</button><button className="btn-sm" style={{background:'#0a1628',color:'#d4a843',border:'none',padding:'8px 12px',borderRadius:'5px',cursor:'pointer'}} onClick={handlePrint}>🖨️ Print</button></div></div><div className="table-container"><table className="data-table"><thead><tr><th>Email</th><th>Type</th><th>Status</th><th>Verified</th><th style={{minWidth:'220px'}}>Actions</th></tr></thead><tbody>{users.map(u=>{const isActive=userStatuses[u.id]!==undefined?userStatuses[u.id]:true;return(<tr key={u.id}><td>{u.email}</td><td><span className="badge badge-gold">{u.type}</span></td><td><span style={{display:'inline-block',padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'bold',background:isActive?'#d4edda':'#f8d7da',color:isActive?'#155724':'#721c24'}}>{isActive?'🟢 Active':'🔴 Blocked'}</span></td><td>{u.verified?'✅':'❌'}</td><td><div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}><button className="btn-sm" style={{background:'#17a2b8',color:'white',border:'none',padding:'5px 8px',borderRadius:'3px',cursor:'pointer',fontSize:'10px'}} title="View User" onClick={()=>alert(`Viewing: ${u.email}`)}>👁️</button><button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'5px 8px',borderRadius:'3px',cursor:'pointer',fontSize:'10px'}} title="Edit User" onClick={()=>alert(`Editing: ${u.email}`)}>✏️</button><button className="btn-sm" style={{background:isActive?'#ffc107':'#28a745',color:isActive?'#333':'white',border:'none',padding:'5px 8px',borderRadius:'3px',cursor:'pointer',fontSize:'10px'}} title={isActive?'Block':'Activate'} onClick={()=>toggleUserStatus(u.id)}>{isActive?'🚫':'✅'}</button><button className="btn-sm" style={{background:'#6f42c1',color:'white',border:'none',padding:'5px 8px',borderRadius:'3px',cursor:'pointer',fontSize:'10px'}} title="Reset Password" onClick={()=>handleResetUserPassword(u.email)}>🔑</button>{canDelete&&<button className="btn-sm" style={{background:'#dc3545',color:'white',border:'none',padding:'5px 8px',borderRadius:'3px',cursor:'pointer',fontSize:'10px'}} title="Delete" onClick={()=>{if(window.confirm(`Delete ${u.email}?`))alert('Deleted');}}>🗑️</button>}</div></td></tr>);})}</tbody></table></div></div>)}

        {/* OVERVIEW TAB */}
        {activeTab==='overview'&&(<div><div className="stats-row"><div className="stat-box"><span className="stat-icon">👥</span><h3>{stats.totalUsers}</h3><p>Users</p></div><div className="stat-box"><span className="stat-icon">💼</span><h3>{stats.activeJobs}</h3><p>Active Jobs</p></div><div className="stat-box"><span className="stat-icon">🤝</span><h3>{stats.totalAgents}</h3><p>Agents</p></div><div className="stat-box"><span className="stat-icon">⏳</span><h3>{stats.pendingVerifications}</h3><p>Pending</p></div></div><div className="dash-card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'15px'}}><h3><i className="fas fa-envelope"></i> Recent Messages</h3></div></div><div className="dash-card"><h3><i className="fas fa-bolt"></i> Quick Actions</h3><div className="action-grid"><button className="action-card" onClick={()=>setActiveTab('chat')}><span className="action-icon">💬</span><h4>Chat</h4></button><button className="action-card" onClick={()=>{setActiveTab('noticeboard');setShowAnnouncementForm(true);}}><span className="action-icon">📢</span><h4>Announcement</h4></button><button className="action-card" onClick={()=>setActiveTab('verifications')}><span className="action-icon">🛡️</span><h4>Verify Users</h4></button><button className="action-card" onClick={()=>setActiveTab('users')}><span className="action-icon">👥</span><h4>Manage Users</h4></button></div></div></div>)}

        {/* MESSAGES TAB */}
        {activeTab==='messages'&&(<div className="dash-card"><h3><i className="fas fa-envelope"></i> Messages</h3><div className="table-container"><table className="data-table"><thead><tr><th>From</th><th>Subject</th><th>Message</th><th>Time</th><th>Action</th></tr></thead><tbody>{messages.length===0?<tr><td colSpan="5" className="text-muted" style={{textAlign:'center',padding:'20px'}}>No messages yet</td></tr>:messages.map(m=>(<tr key={m.id} style={{background:m.unread?'#f0f7ff':'transparent',fontWeight:m.unread?'bold':'normal'}}><td>{m.from}</td><td>{m.subject}</td><td>{m.message?.substring(0,40)}...</td><td>{m.time}</td><td><button className="btn-sm" style={{background:'#0a1628',color:'white',border:'none',padding:'5px 10px',borderRadius:'3px',cursor:'pointer'}} onClick={()=>handleReplyMessage(m.from)}>Reply</button></td></tr>))}</tbody></table></div></div>)}

        {/* LIVE CHAT TAB - REAL USERS */}
        {activeTab==='chat'&&(<div className="dash-card" style={{display:'flex',flexDirection:'column',height:'70vh'}}><h3><i className="fas fa-comments"></i> Live Chat {selectedChatUser?`- ${selectedChatUser}`:''}</h3><div style={{display:'flex',gap:'15px',marginBottom:'15px'}}><select value={selectedChatUser} onChange={e=>{setSelectedChatUser(e.target.value);setChatMessages([]);}} style={{padding:'8px',borderRadius:'5px',border:'2px solid #e0e0e0'}}><option value="">Select user to chat...</option>{allUsers.map(u=>(<option key={u.id} value={u.email}>{u.email} ({u.user_type})</option>))}</select></div><div style={{flex:1,overflowY:'auto',border:'1px solid #e0e0e0',borderRadius:'8px',padding:'15px',marginBottom:'15px',background:'#f9f9f9'}}>{chatMessages.map(m=>(<div key={m.id} style={{textAlign:m.isAdmin?'right':'left',marginBottom:'12px'}}><div style={{display:'inline-block',background:m.isAdmin?'#0a1628':'white',color:m.isAdmin?'white':'#333',padding:'10px 15px',borderRadius:'12px',maxWidth:'70%'}}><p style={{margin:0,fontSize:'14px'}}>{m.text}</p><small style={{opacity:0.7,fontSize:'10px'}}>{m.time}</small></div></div>))}{chatMessages.length===0&&<p className="text-muted" style={{textAlign:'center'}}>Select a user and start chatting</p>}</div><div style={{display:'flex',gap:'10px'}}><input type="text" value={newChatMessage} onChange={e=>setNewChatMessage(e.target.value)} onKeyPress={e=>e.key==='Enter'&&handleSendChat()} placeholder="Type message..." style={{flex:1,padding:'12px',border:'2px solid #e0e0e0',borderRadius:'8px'}} disabled={!selectedChatUser}/><button onClick={handleSendChat} className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'12px 20px',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'}} disabled={!selectedChatUser}>Send</button></div></div>)}
{/* VIDEO CALLS TAB - REAL CALLS */}
{activeTab === 'calls' && (
  <div className="dash-card">
    <h3><i className="fas fa-video"></i> Video & Voice Calls</h3>
    <div style={{display:'flex',gap:'10px',marginBottom:'20px'}}>
      <select value={callTarget} onChange={e=>setCallTarget(e.target.value)} style={{padding:'10px',borderRadius:'5px',border:'2px solid #e0e0e0',flex:1}}>
        <option value="">Select user to call...</option>
        {allUsers.map(u => (
          <option key={u.id} value={u.email}>{u.email} ({u.user_type})</option>
        ))}
      </select>
      <button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}}
        onClick={() => {
          if (!callTarget) { alert('Select a user first'); return; }
          // Create a Daily.co room and open it
          const roomName = 'jobconnect-' + Date.now();
          window.open(`https://jobconnect.daily.co/${roomName}`, '_blank', 'width=800,height=600');
        }}>
        📹 Video Call
      </button>
    </div>
  </div>
)}

        {/* VIDEO CALLS TAB - REAL USERS */}
        {activeTab==='calls'&&(<div className="dash-card"><h3><i className="fas fa-video"></i> Video & Voice Calls</h3><div style={{display:'flex',gap:'10px',marginBottom:'20px'}}><select value={callTarget} onChange={e=>setCallTarget(e.target.value)} style={{padding:'10px',borderRadius:'5px',border:'2px solid #e0e0e0',flex:1}}><option value="">Select user to call...</option>{allUsers.map(u=>(<option key={u.id} value={u.email}>{u.email} ({u.user_type})</option>))}</select><button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>callTarget?alert(`📹 Starting video call with ${callTarget}`):alert('Select a user first')}>📹 Video Call</button><button className="btn-sm" style={{background:'#0a1628',color:'#d4a843',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>callTarget?alert(`📞 Starting voice call with ${callTarget}`):alert('Select a user first')}>📞 Voice Call</button></div><h4>Call History</h4><div className="table-container"><table className="data-table"><thead><tr><th>With</th><th>Type</th><th>Duration</th><th>Date</th><th>Status</th></tr></thead><tbody>{callLogs.length===0?<tr><td colSpan="5" className="text-muted" style={{textAlign:'center',padding:'20px'}}>No calls yet</td></tr>:callLogs.map(c=>(<tr key={c.id}><td>{c.with}</td><td>{c.type==='video'?'📹':'📞'} {c.type}</td><td>{c.duration}</td><td>{c.date}</td><td><span className="badge badge-verified">{c.status}</span></td></tr>))}</tbody></table></div></div>)}
{activeTab === 'calls' && callTarget && (
  <div style={{marginTop:'15px'}}>
    <h4>📹 Call with {callTarget}</h4>
    <div style={{background:'#000',borderRadius:'10px',padding:'20px',textAlign:'center',color:'white',minHeight:'400px'}}>
      <p style={{marginTop:'150px'}}>📹 Video call will appear here</p>
      <p className="text-muted">Send the room link to the user to join</p>
      <button className="btn btn-red" onClick={() => {
        const roomUrl = `https://jobconnect.daily.co/${'room-' + Date.now()}`;
        navigator.clipboard.writeText(roomUrl);
        alert('📋 Room link copied! Share with user to join the call.');
        window.open(roomUrl, '_blank');
      }}>
        🔗 Create Call Room & Copy Link
      </button>
    </div>
  </div>
)}
{activeTab === 'calls' && callTarget && (
  <div style={{marginTop:'15px'}}>
    <h4>📹 Call with {callTarget}</h4>
    <iframe
      src={`https://meet.jit.si/jobconnect-${Date.now()}`}
      style={{width:'100%',height:'500px',border:'none',borderRadius:'10px'}}
      allow="camera; microphone; fullscreen; display-capture; autoplay"
    />
  </div>
)}
        {/* VERIFICATIONS TAB */}
        {activeTab==='verifications'&&(<div className="dash-card"><h3>📋 Pending Verifications</h3><div className="grid-2">{pendingUsers.map(u=>(<div key={u.id} className="card" style={{borderLeft:'4px solid #ffc107',padding:'15px'}}><h4>{u.full_name||u.email}</h4><span className="badge badge-pending">{u.user_type}</span>{u.passport_photo&&<div style={{marginTop:'10px'}}><img src={u.passport_photo} alt="Passport" style={{width:'100%',maxWidth:'200px',borderRadius:'8px'}}/></div>}<p>NIN: {u.nin} | BVN: {u.bvn}</p><p>Bank: {u.bank_name} | Account: {u.account_number}</p><p>Address: {u.address}</p><div style={{display:'flex',gap:'10px',marginTop:'10px'}}><button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>handleVerifyAction(u.id,'approve')}>✅ Approve</button><button className="btn-sm" style={{background:'#dc3545',color:'white',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>handleVerifyAction(u.id,'reject')}>❌ Reject</button></div></div>))}</div></div>)}

        {/* COMMUNICATION TAB */}
        {activeTab==='communication'&&(<div><div className="dash-card"><h3>📨 Send Message</h3><div className="form-group"><label>Select User</label><select id="msg-receiver" style={{width:'100%',padding:'10px',borderRadius:'5px',border:'2px solid #e0e0e0'}}><option value="">Choose user...</option>{users.map(u=>(<option key={u.id} value={u.id}>{u.email} ({u.type})</option>))}</select></div><div className="form-group"><label>Subject</label><input type="text" id="msg-subject" placeholder="Message subject" style={{width:'100%',padding:'10px',borderRadius:'5px',border:'2px solid #e0e0e0'}}/></div><div className="form-group"><label>Message</label><textarea id="msg-body" rows="4" placeholder="Type your message..." style={{width:'100%',padding:'10px',borderRadius:'5px',border:'2px solid #e0e0e0'}}></textarea></div><button className="btn btn-gold" onClick={()=>{const r=document.getElementById('msg-receiver').value;const s=document.getElementById('msg-subject').value;const m=document.getElementById('msg-body').value;if(!r||!m){alert('Fill all fields');return;}alert('✅ Message sent!');}}>📤 Send Message</button></div><div className="dash-card" style={{marginTop:'20px'}}><h3>📢 Broadcast</h3><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'15px'}}><div className="form-group"><label>Target Group</label><select id="broadcast-group" style={{width:'100%',padding:'10px',borderRadius:'5px',border:'2px solid #e0e0e0'}}><option value="all">📢 All Users</option><option value="agents">🤝 Agents</option><option value="seekers">👩🏾‍💼 Job Seekers</option><option value="verified">✅ Verified</option><option value="unverified">⏳ Unverified</option></select></div><div className="form-group"><label>Send Via</label><select id="broadcast-via" style={{width:'100%',padding:'10px',borderRadius:'5px',border:'2px solid #e0e0e0'}}><option value="platform">📨 In-App</option><option value="email">📧 Email</option></select></div></div><div className="form-group"><label>Subject</label><input type="text" id="broadcast-subject" placeholder="Subject" style={{width:'100%',padding:'10px',borderRadius:'5px',border:'2px solid #e0e0e0'}}/></div><div className="form-group"><label>Message</label><textarea id="broadcast-body" rows="4" placeholder="Message..." style={{width:'100%',padding:'10px',borderRadius:'5px',border:'2px solid #e0e0e0'}}></textarea></div><button className="btn btn-red" onClick={()=>{const g=document.getElementById('broadcast-group').value;const m=document.getElementById('broadcast-body').value;if(!m){alert('Enter a message');return;}alert(`✅ Broadcast sent!`);}}>📢 Broadcast Now</button></div><div className="dash-card" style={{marginTop:'20px'}}><h3>📱 Quick Contact</h3><div className="grid-2">{users.filter(u=>u.phone).slice(0,6).map(u=>(<div key={u.id} className="card" style={{padding:'15px'}}><p><strong>{u.email}</strong></p><p>📞 {u.phone}</p><div style={{display:'flex',gap:'8px',marginTop:'10px',flexWrap:'wrap'}}><a href={`https://wa.me/234${(u.phone||'').replace('080','80').replace('+234','')}`} target="_blank" rel="noreferrer" className="btn-sm" style={{background:'#25D366',color:'white',padding:'5px 10px',borderRadius:'5px',textDecoration:'none',fontSize:'11px'}}>💬 WhatsApp</a><a href={`sms:${u.phone}`} className="btn-sm" style={{background:'#0a1628',color:'#d4a843',padding:'5px 10px',borderRadius:'5px',textDecoration:'none',fontSize:'11px'}}>📱 SMS</a><button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'5px 10px',borderRadius:'5px',cursor:'pointer',fontSize:'11px'}} onClick={()=>{const s=prompt('Subject:');const m=prompt('Message:');if(m)alert('✅ Email queued');}}>📧 Email</button></div></div>))}</div></div></div>)}

        {/* JOBS TAB */}
        {activeTab==='jobs'&&(<div className="dash-card"><div style={{display:'flex',justifyContent:'space-between',marginBottom:'15px'}}><h3>💼 All Jobs</h3><span className="badge badge-gold">{jobs.length} jobs</span></div>{jobs.length===0?<p className="text-muted">No jobs posted yet.</p>:<div className="table-container"><table className="data-table"><thead><tr><th>Title</th><th>Organization</th><th>Salary</th><th>Commission</th><th>Status</th><th>Posted</th></tr></thead><tbody>{jobs.map(job=>(<tr key={job.id}><td><strong>{job.title}</strong></td><td>{job.organization||'N/A'}</td><td>₦{(job.salary_min||0).toLocaleString()} - ₦{(job.salary_max||0).toLocaleString()}</td><td>{job.commission_percentage||15}%</td><td><span className={`badge ${job.status==='active'?'badge-verified':'badge-pending'}`}>{job.status}</span></td><td><small>{new Date(job.posted_date).toLocaleDateString()}</small></td></tr>))}</tbody></table></div>}</div>)}

        {/* DISPUTES TAB */}
        {activeTab==='disputes'&&(<div className="dash-card"><h3>⚖️ All Disputes</h3><p className="text-muted">Dispute tracking will appear here.</p><div className="table-container" style={{marginTop:'15px'}}><table className="data-table"><thead><tr><th>ID</th><th>Seeker</th><th>Agent</th><th>Job</th><th>Amount</th><th>Status</th></tr></thead><tbody><tr><td colSpan="6" className="text-muted" style={{textAlign:'center',padding:'20px'}}>No disputes filed yet.</td></tr></tbody></table></div></div>)}

        {/* APPLICATIONS TAB */}
        {activeTab==='applications'&&(<div className="dash-card"><h3>📝 Job Applications</h3><div className="table-container" style={{marginTop:'15px'}}><table className="data-table"><thead><tr><th>Seeker</th><th>Job</th><th>Agent</th><th>Date</th><th>Status</th></tr></thead><tbody><tr><td colSpan="5" className="text-muted" style={{textAlign:'center',padding:'20px'}}>No applications yet.</td></tr></tbody></table></div></div>)}

        {/* TESTIMONIALS TAB */}
        {activeTab==='testimonials'&&(<div className="dash-card"><div style={{display:'flex',justifyContent:'space-between',marginBottom:'15px'}}><h3>⭐ Testimonials ({testimonials.length})</h3></div><div className="grid-2">{testimonials.map(t=>(<div key={t.id} className="card" style={{borderLeft:'4px solid #d4a843',padding:'15px'}}><div style={{display:'flex',justifyContent:'space-between'}}><h4>{t.name}</h4><span>{'⭐'.repeat(t.rating||5)}</span></div><p className="text-muted">{t.role} at {t.company}</p><p style={{fontStyle:'italic',marginTop:'10px'}}>"{t.text}"</p><div style={{display:'flex',gap:'8px',marginTop:'10px'}}><button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'5px 10px',borderRadius:'3px',cursor:'pointer',fontSize:'11px'}} onClick={()=>alert('✅ Thank you sent!')}>🙏 Thank</button><button className="btn-sm" style={{background:'#0a1628',color:'#d4a843',border:'none',padding:'5px 10px',borderRadius:'3px',cursor:'pointer',fontSize:'11px'}} onClick={()=>{const r=prompt('Reply:');if(r)alert('✅ Reply sent!');}}>💬 Reply</button></div></div>))}</div></div>)}

        {/* NOTICE BOARD TAB */}
        {activeTab==='noticeboard'&&(<div className="dash-card"><div style={{display:'flex',justifyContent:'space-between',marginBottom:'15px'}}><h3><i className="fas fa-clipboard-list"></i> Notice Board</h3><button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>setShowAnnouncementForm(!showAnnouncementForm)}>📢 New</button></div>{showAnnouncementForm&&(<div style={{background:'#f0f7ff',padding:'20px',borderRadius:'8px',marginBottom:'20px',border:'2px solid #b8daff'}}><h4>Post Announcement</h4><div className="form-group"><label>Title</label><input value={newAnnouncement.title} onChange={e=>setNewAnnouncement({...newAnnouncement,title:e.target.value})}/></div><div className="form-group"><label>Content</label><textarea value={newAnnouncement.content} onChange={e=>setNewAnnouncement({...newAnnouncement,content:e.target.value})} rows="3"/></div><div className="form-row"><div className="form-group"><label>Priority</label><select value={newAnnouncement.priority} onChange={e=>setNewAnnouncement({...newAnnouncement,priority:e.target.value})}><option>low</option><option>normal</option><option>high</option><option>urgent</option></select></div><div className="form-group"><label>Audience</label><select value={newAnnouncement.audience} onChange={e=>setNewAnnouncement({...newAnnouncement,audience:e.target.value})}><option value="all">All</option><option value="seekers">Seekers</option><option value="agents">Agents</option><option value="staff">Staff</option></select></div></div><button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}} onClick={handlePostAnnouncement}>📢 Post</button></div>)}{noticeBoard.map(n=>(<div key={n.id} style={{borderLeft:'4px solid '+(n.priority==='urgent'?'#dc3545':n.priority==='high'?'#ffc107':'#d4a843'),padding:'15px',marginBottom:'12px',background:n.priority==='urgent'?'#fff5f5':'white',borderRadius:'8px'}}><div style={{display:'flex',justifyContent:'space-between'}}><h4>{n.title}</h4><span className={`badge ${n.priority==='urgent'?'badge-pending':n.priority==='high'?'badge-gold':'badge-verified'}`}>{n.priority}</span></div><p className="text-muted">{n.content}</p><small>Audience: {n.audience} | {n.date}</small></div>))}</div>)}

        {/* PLACEHOLDER FOR REMAINING TABS */}
        {['accesslogs','activitylogs','auditlogs','gps','analytics','courses','services','settings','transactions'].includes(activeTab)&&(<div className="dash-card"><h3>{activeTab.charAt(0).toUpperCase()+activeTab.slice(1)}</h3>{activeTab==='accesslogs'&&<div className="table-container"><table className="data-table"><thead><tr><th>User</th><th>Page</th><th>IP</th><th>GPS</th><th>Time</th></tr></thead><tbody>{accessLogs.map(l=>(<tr key={l.id}><td>{l.user}</td><td>{l.page}</td><td>{l.ip}</td><td>{l.gps}</td><td>{l.time}</td></tr>))}</tbody></table></div>}{activeTab==='activitylogs'&&<div className="table-container"><table className="data-table"><thead><tr><th>User</th><th>Action</th><th>Module</th><th>Time</th></tr></thead><tbody>{activityLogs.map(l=>(<tr key={l.id}><td>{l.user}</td><td><span className="badge badge-gold">{l.action}</span></td><td>{l.module}</td><td>{l.time}</td></tr>))}</tbody></table></div>}{activeTab==='auditlogs'&&<div className="table-container"><table className="data-table"><thead><tr><th>User</th><th>Action</th><th>Table</th><th>Change</th></tr></thead><tbody>{auditLogs.map(l=>(<tr key={l.id}><td>{l.user}</td><td>{l.action}</td><td>{l.table}</td><td>{l.change}</td></tr>))}</tbody></table></div>}{activeTab==='gps'&&<div className="map-container"><iframe src="https://maps.google.com/maps?q=Lagos,Nigeria&z=10&output=embed" style={{width:'100%',height:'350px',border:'none',borderRadius:'8px'}} title="GPS"></iframe></div>}{activeTab==='settings'&&<div className="form-card"><div className="form-row"><div className="form-group"><label>Platform Fee (%)</label><input type="number" defaultValue="17"/></div><div className="form-group"><label>Agent Payout (%)</label><input type="number" defaultValue="83"/></div></div><button className="btn-gold" style={{marginTop:'15px'}} onClick={()=>alert('✅ Saved!')}>Save Settings</button></div>}</div>)}
      </div>
    </div>
  );
}

export default AdminDashboard;