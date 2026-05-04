import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { getTestData, getJobs, getAnnouncements, getAnalyticsSummary, getVerifications, verifyUser } from '../services/api';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  // Password change for admin
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  // User status tracking
  const [userStatuses, setUserStatuses] = useState({});
  // Pending verifications
const [pendingUsers, setPendingUsers] = useState([]);

  // Admin role
  const adminRole = user?.adminLevel || 'admin';
  const isSuperAdmin = adminRole === 'admin';
  const isSeniorAdmin = adminRole === 'admin2';
  const isJuniorAdmin = adminRole === 'admin1';
  const isLimitedAdmin = adminRole === 'admin2_70';

  const roleDisplay = {
    admin: 'Super Administrator', admin2: 'Senior Administrator',
    admin1: 'Junior Administrator', admin2_70: 'Limited Administrator'
  };

  const canDelete = ['admin', 'admin2'].includes(adminRole);
  const canEditUsers = ['admin', 'admin2', 'admin1'].includes(adminRole);
  const canViewReports = adminRole !== 'admin2_70';
  const canManageSettings = ['admin', 'admin2'].includes(adminRole);
  const canViewSensitiveData = ['admin', 'admin2'].includes(adminRole);
  const canApproveVerifications = ['admin', 'admin2', 'admin1'].includes(adminRole);
  const canExportData = adminRole !== 'admin2_70';
  const canResetPasswords = ['admin', 'admin2', 'admin1'].includes(adminRole);
  const canManageTestimonials = ['admin', 'admin2', 'admin1'].includes(adminRole);

  // Messages/Chat state
  const [messages, setMessages] = useState([
    { id: 1, from: 'agent1@example.com', to: 'admin', subject: 'Commission Inquiry', message: 'When will my commission be paid?', time: '10:30 AM', unread: true },
    { id: 2, from: 'seeker1@example.com', to: 'admin', subject: 'Application Status', message: 'I applied 2 weeks ago. Any update?', time: '9:15 AM', unread: true },
    { id: 3, from: 'staff@jobconnect.com', to: 'admin', subject: 'Verification Complete', message: 'John Agent verified. All documents checked.', time: 'Yesterday', unread: false },
  ]);

  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'agent1@example.com', text: 'Hello admin, I need help with my payout', time: '10:30 AM', isAdmin: false },
    { id: 2, sender: 'admin', text: 'Sure, let me check your account.', time: '10:31 AM', isAdmin: true },
    { id: 3, sender: 'agent1@example.com', text: 'Agent ID: 0010', time: '10:32 AM', isAdmin: false },
  ]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [selectedChatUser, setSelectedChatUser] = useState('agent1@example.com');

  // Call/Video Meeting state
  const [callLogs, setCallLogs] = useState([
    { id: 1, with: 'John Agent', type: 'video', duration: '15:20', date: '2024-05-03', status: 'completed' },
    { id: 2, with: 'Jane Seeker', type: 'voice', duration: '8:45', date: '2024-05-02', status: 'completed' },
    { id: 3, with: 'Staff Member', type: 'video', duration: '22:10', date: '2024-05-01', status: 'completed' },
  ]);
  const [callTarget, setCallTarget] = useState('');

  // Access/Activity/Audit Logs
  const [accessLogs] = useState([
    { id: 1, user: 'admin@jobconnect.com', page: '/dashboard/admin', ip: '192.168.1.1', gps: '6.5244,3.3792', device: 'Chrome/Windows', time: '2 min ago' },
    { id: 2, user: 'agent1@example.com', page: '/dashboard/agent', ip: '192.168.1.2', gps: '6.6018,3.3515', device: 'Safari/Mac', time: '15 min ago' },
    { id: 3, user: 'seeker1@example.com', page: '/jobs', ip: '192.168.1.3', gps: '6.4531,3.3958', device: 'Chrome/Android', time: '30 min ago' },
  ]);

  const [activityLogs] = useState([
    { id: 1, user: 'admin', action: 'login', description: 'Admin logged into dashboard', module: 'auth', severity: 'info', time: '2 min ago' },
    { id: 2, user: 'agent1', action: 'job_posted', description: 'Posted new Software Developer job', module: 'jobs', severity: 'info', time: '1 hour ago' },
    { id: 3, user: 'seeker1', action: 'payment', description: 'Paid commission of ₦45,000', module: 'payment', severity: 'info', time: '3 hours ago' },
  ]);

  const [auditLogs] = useState([
    { id: 1, user: 'admin', action: 'UPDATE', table: 'users', record: 'agent1', change: 'is_verified: false → true', time: '1 hour ago' },
    { id: 2, user: 'admin', action: 'DELETE', table: 'jobs', record: 'Old Listing', change: 'Removed expired job', time: 'Yesterday' },
  ]);

  // Notice Board
  const [noticeBoard, setNoticeBoard] = useState([
    { id: 1, title: 'System Maintenance', content: 'Scheduled maintenance on May 5th, 2AM-4AM WAT', priority: 'high', date: '2024-05-03' },
    { id: 2, title: 'New Feature: Video Meetings', content: 'Video meetings now available', priority: 'normal', date: '2024-05-01' },
  ]);

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
  loadVerifications(); // Add this line
}, [navigate]);

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/signin'); };

  const handleSendChat = () => {
    if (!newChatMessage.trim()) return;
    setChatMessages([...chatMessages, { id: Date.now(), sender: 'admin', text: newChatMessage, time: new Date().toLocaleTimeString(), isAdmin: true }]);
    setNewChatMessage('');
  };

  const handlePostAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    setNoticeBoard([{ id: Date.now(), ...newAnnouncement, date: new Date().toISOString().split('T')[0] }, ...noticeBoard]);
    setNewAnnouncement({ title: '', content: '', priority: 'normal', audience: 'all' });
    setShowAnnouncementForm(false);
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

  const handleExportCSV = (data, filename) => {
    const csv = Object.keys(data[0]).join(',') + '\n' + data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  const handlePrint = () => window.print();

  const handleResetUserPassword = (userEmail) => {
    const newPass = prompt(`Enter new password for ${userEmail} (min 6 characters):`);
    if (newPass && newPass.length >= 6) {
      alert(`✅ Password reset successful for ${userEmail}`);
    } else if (newPass) {
      alert('❌ Password must be at least 6 characters');
    }
  };
  // Load pending verifications
const loadVerifications = () => {
  getVerifications()
    .then(res => setPendingUsers(res.data.users || []))
    .catch(console.log);
};

// Approve or reject verification
const handleVerifyAction = async (userId, action) => {
  if (window.confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this user?`)) {
    try {
      await verifyUser(userId, action);
      alert(`✅ User ${action}d successfully!`);
      loadVerifications(); // Refresh list
    } catch {
      alert('❌ Action failed. Try again.');
    }
  }
};
  const toggleUserStatus = (userId) => {
    setUserStatuses(prev => ({
      ...prev,
      [userId]: !(prev[userId] ?? true)
    }));
  };

  const stats = {
    totalUsers: users.length,
    activeJobs: jobs.filter(j => j.status === 'active').length,
    totalJobs: jobs.length,
    pendingVerifications: 1,
    platformRevenue: '₦0',
    totalTransactions: 0,
    totalAgents: users.filter(u => u.type === 'agent').length,
    totalSeekers: users.filter(u => u.type === 'job_seeker').length,
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <div className="user-avatar">👑</div>
          {!sidebarCollapsed && (<><h3>JobConnect</h3><span className="badge badge-gold">Admin Panel</span></>)}
        </div>
        <nav className="sidebar-nav">
          <div className="nav-header">MAIN NAVIGATION</div>
          <button className={`nav-item ${activeTab==='overview'?'active':''}`} onClick={()=>setActiveTab('overview')}>📊 <span className="sidebar-text">Dashboard</span></button>
          {canEditUsers && <button className={`nav-item ${activeTab==='users'?'active':''}`} onClick={()=>setActiveTab('users')}>👥 <span className="sidebar-text">Users</span></button>}
          <button className={`nav-item ${activeTab==='jobs'?'active':''}`} onClick={()=>setActiveTab('jobs')}>💼 <span className="sidebar-text">Jobs</span></button>
          {canApproveVerifications && <button className={`nav-item ${activeTab==='verifications'?'active':''}`} onClick={()=>setActiveTab('verifications')}>🛡️ <span className="sidebar-text">Verifications</span>{stats.pendingVerifications > 0 && <span className="notification-badge">{stats.pendingVerifications}</span>}</button>}
          <hr className="sidebar-divider" /><div className="nav-header">COMMUNICATION</div>
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

      {/* Main Content */}
      <div className={`dashboard-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="dash-topbar">
          <div><button className="toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button></div>
          <div className="header-actions" style={{position:'relative'}}>
            <span>Welcome, {user?.email?.split('@')[0] || 'Admin'}</span>
            <span className={`role-badge role-${isSuperAdmin?'super':isSeniorAdmin?'senior':isJuniorAdmin?'junior':'limited'}`}>{roleDisplay[adminRole]}</span>
            <div className="user-avatar" onClick={() => setShowProfileDropdown(!showProfileDropdown)} style={{cursor:'pointer'}}>{(user?.email?.[0]||'A').toUpperCase()}</div>
            {showProfileDropdown && (
              <div className="profile-dropdown show">
                <div className="dropdown-header"><strong>{user?.email}</strong><small>{roleDisplay[adminRole]}</small></div>
                <button className="dropdown-item" onClick={()=>{setActiveTab('settings');setShowProfileDropdown(false);}}>⚙️ Settings</button>
                <button className="dropdown-item" onClick={()=>{setActiveTab('password');setShowProfileDropdown(false);}}>🔒 Change Password</button>
                <button className="dropdown-item text-danger" onClick={handleLogout}>🚪 Logout</button>
              </div>
            )}
            <button className="logout-btn-header" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        <div className="welcome-card">
          <div><h4>Welcome Back, {user?.email?.split('@')[0] || 'Admin'}!</h4><p>Here's what's happening on your platform today.</p></div>
          <i className="fas fa-chart-line" style={{fontSize:'3rem',opacity:0.3}}></i>
        </div>

        {/* ============ CHANGE PASSWORD TAB ============ */}
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

        {/* ============ USERS TAB - FULL MANAGEMENT ============ */}
        {activeTab === 'users' && canEditUsers && (
          <div className="dash-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px',marginBottom:'15px'}}>
              <h3><i className="fas fa-users"></i> User Management</h3>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'8px 12px',borderRadius:'5px',cursor:'pointer'}}
                  onClick={() => handleExportCSV(users.map(u=>({Email:u.email,Type:u.type,Verified:u.verified?'Yes':'No'})), 'users_export.csv')}>📥 Export CSV</button>
                <button className="btn-sm" style={{background:'#0a1628',color:'#d4a843',border:'none',padding:'8px 12px',borderRadius:'5px',cursor:'pointer'}} onClick={handlePrint}>🖨️ Print</button>
              </div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Email</th><th>Type</th><th>Status</th><th>Verified</th><th style={{minWidth:'220px'}}>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => {
                    const isActive = userStatuses[u.id] !== undefined ? userStatuses[u.id] : true;
                    return (
                      <tr key={u.id}>
                        <td>{u.email}</td>
                        <td><span className="badge badge-gold">{u.type}</span></td>
                        <td>
                          <span style={{display:'inline-block',padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'bold',background:isActive?'#d4edda':'#f8d7da',color:isActive?'#155724':'#721c24'}}>
                            {isActive ? '🟢 Active' : '🔴 Blocked'}
                          </span>
                        </td>
                        <td>{u.verified ? '✅' : '❌'}</td>
                        <td>
                          <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                            {/* View */}
                            <button className="btn-sm" style={{background:'#17a2b8',color:'white',border:'none',padding:'5px 8px',borderRadius:'3px',cursor:'pointer',fontSize:'10px'}}
                              title="View User" onClick={()=>alert(`Viewing: ${u.email}\nType: ${u.type}\nVerified: ${u.verified}`)}>👁️</button>
                            {/* Edit */}
                            <button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'5px 8px',borderRadius:'3px',cursor:'pointer',fontSize:'10px'}}
                              title="Edit User" onClick={()=>alert(`Editing: ${u.email}`)}>✏️</button>
                            {/* Block/Activate */}
                            <button className="btn-sm" style={{background:isActive?'#ffc107':'#28a745',color:isActive?'#333':'white',border:'none',padding:'5px 8px',borderRadius:'3px',cursor:'pointer',fontSize:'10px'}}
                              title={isActive?'Block User':'Activate User'} onClick={()=>toggleUserStatus(u.id)}>
                              {isActive ? '🚫' : '✅'}
                            </button>
                            {/* Reset Password */}
                            <button className="btn-sm" style={{background:'#6f42c1',color:'white',border:'none',padding:'5px 8px',borderRadius:'3px',cursor:'pointer',fontSize:'10px'}}
                              title="Reset Password" onClick={()=>handleResetUserPassword(u.email)}>🔑</button>
                            {/* Delete */}
                            {canDelete && (
                              <button className="btn-sm" style={{background:'#dc3545',color:'white',border:'none',padding:'5px 8px',borderRadius:'3px',cursor:'pointer',fontSize:'10px'}}
                                title="Delete User" onClick={()=>{if(window.confirm(`Permanently delete ${u.email}?`))alert(`Deleted: ${u.email}`);}}>🗑️</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === 'overview' && (
          <div>
            <div className="stats-row">
              <div className="stat-box"><span className="stat-icon">👥</span><h3>{stats.totalUsers}</h3><p>Users</p></div>
              <div className="stat-box"><span className="stat-icon">💼</span><h3>{stats.activeJobs}</h3><p>Active Jobs</p></div>
              <div className="stat-box"><span className="stat-icon">🤝</span><h3>{stats.totalAgents}</h3><p>Agents</p></div>
              <div className="stat-box"><span className="stat-icon">⏳</span><h3>{stats.pendingVerifications}</h3><p>Pending</p></div>
            </div>
            <div className="dash-card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'15px'}}>
                <h3><i className="fas fa-envelope"></i> Recent Messages</h3>
                <button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>setActiveTab('messages')}>View All</button>
              </div>
              {messages.slice(0,3).map(m=>(<div key={m.id} className="list-row" style={{background:m.unread?'#f0f7ff':'transparent',padding:'10px',borderRadius:'5px'}}><div><strong>{m.subject}</strong><p className="text-muted">From: {m.from}</p></div><span style={{fontSize:'12px',color:'#999'}}>{m.time}</span></div>))}
            </div>
            <div className="dash-card">
              <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
              <div className="action-grid">
                <button className="action-card" onClick={()=>setActiveTab('chat')}><span className="action-icon">💬</span><h4>Chat</h4></button>
                <button className="action-card" onClick={()=>{setActiveTab('noticeboard');setShowAnnouncementForm(true);}}><span className="action-icon">📢</span><h4>Announcement</h4></button>
                <button className="action-card" onClick={()=>setActiveTab('verifications')}><span className="action-icon">🛡️</span><h4>Verify Users</h4></button>
                <button className="action-card" onClick={()=>setActiveTab('users')}><span className="action-icon">👥</span><h4>Manage Users</h4></button>
              </div>
            </div>
          </div>
        )}

        {/* ============ MESSAGES TAB ============ */}
        {activeTab === 'messages' && (
          <div className="dash-card"><h3><i className="fas fa-envelope"></i> Messages</h3>
            <div className="table-container"><table className="data-table"><thead><tr><th>From</th><th>Subject</th><th>Message</th><th>Time</th><th>Action</th></tr></thead><tbody>
              {messages.map(m=>(<tr key={m.id} style={{background:m.unread?'#f0f7ff':'transparent',fontWeight:m.unread?'bold':'normal'}}><td>{m.from}</td><td>{m.subject}</td><td>{m.message.substring(0,40)}...</td><td>{m.time}</td><td><button className="btn-sm" style={{background:'#0a1628',color:'white',border:'none',padding:'5px 10px',borderRadius:'3px',cursor:'pointer'}}>Reply</button></td></tr>))}
            </tbody></table></div>
          </div>
        )}

        {/* ============ LIVE CHAT TAB ============ */}
        {activeTab === 'chat' && (
          <div className="dash-card" style={{display:'flex',flexDirection:'column',height:'70vh'}}>
            <h3><i className="fas fa-comments"></i> Live Chat - {selectedChatUser}</h3>
            <div style={{display:'flex',gap:'15px',marginBottom:'15px'}}>
              <select value={selectedChatUser} onChange={e=>setSelectedChatUser(e.target.value)} style={{padding:'8px',borderRadius:'5px',border:'2px solid #e0e0e0'}}>
                <option value="agent1@example.com">John Agent</option><option value="seeker1@example.com">Jane Seeker</option><option value="staff@jobconnect.com">Staff Member</option>
              </select>
            </div>
            <div style={{flex:1,overflowY:'auto',border:'1px solid #e0e0e0',borderRadius:'8px',padding:'15px',marginBottom:'15px',background:'#f9f9f9'}}>
              {chatMessages.map(m=>(<div key={m.id} style={{textAlign:m.isAdmin?'right':'left',marginBottom:'12px'}}><div style={{display:'inline-block',background:m.isAdmin?'#0a1628':'white',color:m.isAdmin?'white':'#333',padding:'10px 15px',borderRadius:'12px',maxWidth:'70%',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}><p style={{margin:0,fontSize:'14px'}}>{m.text}</p><small style={{opacity:0.7,fontSize:'10px'}}>{m.time}</small></div></div>))}
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <input type="text" value={newChatMessage} onChange={e=>setNewChatMessage(e.target.value)} onKeyPress={e=>e.key==='Enter'&&handleSendChat()} placeholder="Type message..." style={{flex:1,padding:'12px',border:'2px solid #e0e0e0',borderRadius:'8px'}}/>
              <button onClick={handleSendChat} className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'12px 20px',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'}}>Send</button>
            </div>
          </div>
        )}

        {/* ============ VIDEO CALLS TAB ============ */}
        {activeTab === 'calls' && (
          <div className="dash-card"><h3><i className="fas fa-video"></i> Video & Voice Calls</h3>
            <div style={{display:'flex',gap:'10px',marginBottom:'20px'}}>
              <select value={callTarget} onChange={e=>setCallTarget(e.target.value)} style={{padding:'10px',borderRadius:'5px',border:'2px solid #e0e0e0',flex:1}}>
                <option value="">Select user...</option><option value="agent1">John Agent</option><option value="seeker1">Jane Seeker</option><option value="staff">Staff Member</option>
              </select>
              <button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}}>📹 Video Call</button>
              <button className="btn-sm" style={{background:'#0a1628',color:'#d4a843',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}}>📞 Voice Call</button>
            </div>
            <h4>Call History</h4><div className="table-container"><table className="data-table"><thead><tr><th>With</th><th>Type</th><th>Duration</th><th>Date</th><th>Status</th></tr></thead><tbody>{callLogs.map(c=>(<tr key={c.id}><td>{c.with}</td><td>{c.type==='video'?'📹':'📞'} {c.type}</td><td>{c.duration}</td><td>{c.date}</td><td><span className="badge badge-verified">{c.status}</span></td></tr>))}</tbody></table></div>
          </div>
        )}
        {activeTab === 'verifications' && (
  <div className="dash-card">
    <h3>📋 Pending Verifications</h3>
    <div className="grid-2">
      {pendingUsers.map(u => (
        <div key={u.id} className="card" style={{borderLeft:'4px solid #ffc107',padding:'15px'}}>
          <h4>{u.full_name || u.email}</h4>
          <span className="badge badge-pending">{u.user_type}</span>
          {u.passport_photo && (
            <div style={{marginTop:'10px'}}>
              <img src={u.passport_photo} alt="Passport" style={{width:'100%',maxWidth:'200px',borderRadius:'8px'}} />
            </div>
          )}
          <p>NIN: {u.nin} | BVN: {u.bvn}</p>
          <p>Bank: {u.bank_name} | Account: {u.account_number}</p>
          <p>Address: {u.address}</p>
          <div style={{display:'flex',gap:'10px',marginTop:'10px'}}>
            <button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}}
              onClick={() => handleVerifyAction(u.id, 'approve')}>✅ Approve</button>
            <button className="btn-sm" style={{background:'#dc3545',color:'white',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}}
              onClick={() => handleVerifyAction(u.id, 'reject')}>❌ Reject</button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
        {/* ============ NOTICE BOARD TAB ============ */}
        {activeTab === 'noticeboard' && (
          <div className="dash-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'15px'}}><h3><i className="fas fa-clipboard-list"></i> Notice Board</h3><button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>setShowAnnouncementForm(!showAnnouncementForm)}>📢 New</button></div>
            {showAnnouncementForm && (<div style={{background:'#f0f7ff',padding:'20px',borderRadius:'8px',marginBottom:'20px',border:'2px solid #b8daff'}}><h4>Post Announcement</h4><div className="form-group"><label>Title</label><input value={newAnnouncement.title} onChange={e=>setNewAnnouncement({...newAnnouncement,title:e.target.value})}/></div><div className="form-group"><label>Content</label><textarea value={newAnnouncement.content} onChange={e=>setNewAnnouncement({...newAnnouncement,content:e.target.value})} rows="3"/></div><div className="form-row"><div className="form-group"><label>Priority</label><select value={newAnnouncement.priority} onChange={e=>setNewAnnouncement({...newAnnouncement,priority:e.target.value})}><option>low</option><option>normal</option><option>high</option><option>urgent</option></select></div><div className="form-group"><label>Audience</label><select value={newAnnouncement.audience} onChange={e=>setNewAnnouncement({...newAnnouncement,audience:e.target.value})}><option value="all">All</option><option value="seekers">Seekers</option><option value="agents">Agents</option><option value="staff">Staff</option></select></div></div><button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}} onClick={handlePostAnnouncement}>📢 Post</button></div>)}
            {noticeBoard.map(n=>(<div key={n.id} style={{borderLeft:'4px solid '+(n.priority==='urgent'?'#dc3545':n.priority==='high'?'#ffc107':'#d4a843'),padding:'15px',marginBottom:'12px',background:n.priority==='urgent'?'#fff5f5':'white',borderRadius:'8px'}}><div style={{display:'flex',justifyContent:'space-between'}}><h4>{n.title}</h4><span className={`badge ${n.priority==='urgent'?'badge-pending':n.priority==='high'?'badge-gold':'badge-verified'}`}>{n.priority}</span></div><p className="text-muted">{n.content}</p><small>Audience: {n.audience} | {n.date}</small></div>))}
          </div>
        )}

        {/* Quick placeholder for remaining tabs */}
        {['accesslogs','activitylogs','auditlogs','gps','analytics','courses','services','settings','jobs','testimonials','transactions'].includes(activeTab) && (
          <div className="dash-card"><h3>{activeTab.charAt(0).toUpperCase()+activeTab.slice(1)}</h3><p className="text-muted">Content loaded from data.</p>
            {activeTab==='accesslogs' && <div className="table-container"><table className="data-table"><thead><tr><th>User</th><th>Page</th><th>IP</th><th>GPS</th><th>Time</th></tr></thead><tbody>{accessLogs.map(l=>(<tr key={l.id}><td>{l.user}</td><td>{l.page}</td><td>{l.ip}</td><td>{l.gps}</td><td>{l.time}</td></tr>))}</tbody></table></div>}
            {activeTab==='activitylogs' && <div className="table-container"><table className="data-table"><thead><tr><th>User</th><th>Action</th><th>Module</th><th>Time</th></tr></thead><tbody>{activityLogs.map(l=>(<tr key={l.id}><td>{l.user}</td><td><span className="badge badge-gold">{l.action}</span></td><td>{l.module}</td><td>{l.time}</td></tr>))}</tbody></table></div>}
            {activeTab==='auditlogs' && <div className="table-container"><table className="data-table"><thead><tr><th>User</th><th>Action</th><th>Table</th><th>Change</th></tr></thead><tbody>{auditLogs.map(l=>(<tr key={l.id}><td>{l.user}</td><td>{l.action}</td><td>{l.table}</td><td>{l.change}</td></tr>))}</tbody></table></div>}
            {activeTab==='gps' && <div className="map-container"><iframe src="https://maps.google.com/maps?q=Lagos,Nigeria&z=10&output=embed" style={{width:'100%',height:'350px',border:'none',borderRadius:'8px'}} title="GPS"></iframe></div>}
            {activeTab==='settings' && <div className="form-card"><div className="form-row"><div className="form-group"><label>Platform Fee (%)</label><input type="number" defaultValue="17"/></div><div className="form-group"><label>Agent Payout (%)</label><input type="number" defaultValue="83"/></div></div><button className="btn-gold" style={{marginTop:'15px'}}>Save Settings</button></div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;