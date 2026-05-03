import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function StaffDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const unreadCount = 3;

  // Password change state
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  // Staff-specific states
  const [tickets, setTickets] = useState([
    { id: 'TKT-001', user: 'seeker1@example.com', subject: 'Payment not reflecting', type: 'payment_issue', priority: 'high', status: 'open', date: '2024-05-03' },
    { id: 'TKT-002', user: 'agent1@example.com', subject: 'Verification documents rejected', type: 'verification_help', priority: 'normal', status: 'assigned', date: '2024-05-02' },
    { id: 'TKT-003', user: 'newuser@email.com', subject: 'Cannot upload passport', type: 'technical', priority: 'low', status: 'in_progress', date: '2024-05-01' },
  ]);

  const [calls, setCalls] = useState([
    { id: 1, caller: '08033333333', name: 'Jane Seeker', subject: 'Job application status', duration: '12:30', status: 'completed', date: '2024-05-03' },
    { id: 2, caller: '08022222222', name: 'John Agent', subject: 'Commission payout inquiry', duration: '08:15', status: 'completed', date: '2024-05-03' },
    { id: 3, caller: '08099999999', name: 'New User', subject: 'Account verification help', duration: '05:45', status: 'missed', date: '2024-05-02' },
  ]);

  const [disputes, setDisputes] = useState([
    { id: 'DSP-001', seeker: 'seeker1@example.com', agent: 'John Agent', job: 'Software Developer', amount: '₦45,000', reason: 'Job not secured', status: 'pending_agent', daysLeft: 18 },
    { id: 'DSP-002', seeker: 'newuser@email.com', agent: 'John Agent', job: 'Accountant', amount: '₦30,000', reason: 'Changed mind - carry forward', status: 'agent_confirmed', daysLeft: 15 },
  ]);

  const [inquiries, setInquiries] = useState([
    { id: 1, from: 'seeker1@example.com', subject: 'How to apply for jobs', type: 'general', status: 'unread', date: '2024-05-03' },
    { id: 2, from: 'agent1@example.com', subject: 'How to set commission', type: 'agent_support', status: 'read', date: '2024-05-02' },
    { id: 3, from: 'contact@email.com', subject: 'Partnership inquiry', type: 'business', status: 'unread', date: '2024-05-01' },
  ]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/signin'); return; }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/signin'); };

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

  const handlePrint = () => window.print();
  
  const handleExportCSV = (data, filename) => {
    const csv = Object.keys(data[0]).join(',') + '\n' + data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  const stats = {
    openTickets: tickets.filter(t => t.status === 'open').length,
    pendingDisputes: disputes.filter(d => d.status === 'pending_agent').length,
    unreadInquiries: inquiries.filter(i => i.status === 'unread').length,
    missedCalls: calls.filter(c => c.status === 'missed').length,
    ticketsResolved: 32,
    avgResponseTime: '12 min',
    customerSatisfaction: '4.8/5',
    verificationsProcessed: 25,
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="user-avatar">👨‍💼</div>
          {!sidebarCollapsed && (
            <>
              <h3>JobConnect</h3>
              <span className="badge badge-verified">Staff Panel</span>
            </>
          )}
        </div>
        <nav className="sidebar-nav">
          <div className="nav-header">CUSTOMER SUPPORT</div>
          <button className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}>
            <i className="fas fa-tachometer-alt"></i> <span className="sidebar-text">Dashboard</span>
          </button>
          <button className={`nav-item ${activeTab==='tickets'?'active':''}`} onClick={()=>setActiveTab('tickets')}>
            <i className="fas fa-ticket-alt"></i> <span className="sidebar-text">Support Tickets</span>
            {stats.openTickets > 0 && <span className="notification-badge">{stats.openTickets}</span>}
          </button>
          <button className={`nav-item ${activeTab==='calls'?'active':''}`} onClick={()=>setActiveTab('calls')}>
            <i className="fas fa-phone"></i> <span className="sidebar-text">Customer Calls</span>
            {stats.missedCalls > 0 && <span className="notification-badge">{stats.missedCalls}</span>}
          </button>
          <button className={`nav-item ${activeTab==='disputes'?'active':''}`} onClick={()=>setActiveTab('disputes')}>
            <i className="fas fa-gavel"></i> <span className="sidebar-text">Disputes</span>
            {stats.pendingDisputes > 0 && <span className="notification-badge">{stats.pendingDisputes}</span>}
          </button>
          <button className={`nav-item ${activeTab==='inquiries'?'active':''}`} onClick={()=>setActiveTab('inquiries')}>
            <i className="fas fa-envelope"></i> <span className="sidebar-text">Inquiries</span>
            {stats.unreadInquiries > 0 && <span className="notification-badge">{stats.unreadInquiries}</span>}
          </button>
          
          <hr className="sidebar-divider" />
          <div className="nav-header">VERIFICATION</div>
          <button className={`nav-item ${activeTab==='verifications'?'active':''}`} onClick={()=>setActiveTab('verifications')}>
            <i className="fas fa-check-double"></i> <span className="sidebar-text">Verify Users</span>
          </button>
          <button className={`nav-item ${activeTab==='verification-queue'?'active':''}`} onClick={()=>setActiveTab('verification-queue')}>
            <i className="fas fa-list-check"></i> <span className="sidebar-text">Verification Queue</span>
          </button>
          
          <hr className="sidebar-divider" />
          <div className="nav-header">COMMUNICATION</div>
          <button className={`nav-item ${activeTab==='messages'?'active':''}`} onClick={()=>setActiveTab('messages')}>
            <i className="fas fa-comments"></i> <span className="sidebar-text">Messages</span>
          </button>
          <button className={`nav-item ${activeTab==='notifications'?'active':''}`} onClick={()=>setActiveTab('notifications')}>
            <i className="fas fa-bell"></i> <span className="sidebar-text">Notifications</span>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          
          <hr className="sidebar-divider" />
          <div className="nav-header">REPORTS</div>
          <button className={`nav-item ${activeTab==='reports'?'active':''}`} onClick={()=>setActiveTab('reports')}>
            <i className="fas fa-chart-bar"></i> <span className="sidebar-text">Performance Reports</span>
          </button>
          <button className={`nav-item ${activeTab==='analytics'?'active':''}`} onClick={()=>setActiveTab('analytics')}>
            <i className="fas fa-chart-pie"></i> <span className="sidebar-text">Analytics</span>
          </button>
          
          <hr className="sidebar-divider" />
          <div className="nav-header">ACCOUNT</div>
          <button className={`nav-item ${activeTab==='profile'?'active':''}`} onClick={()=>setActiveTab('profile')}>
            <i className="fas fa-user-circle"></i> <span className="sidebar-text">My Profile</span>
          </button>
          <button className={`nav-item ${activeTab==='verification'?'active':''}`} onClick={()=>setActiveTab('verification')}>
            <i className="fas fa-id-card"></i> <span className="sidebar-text">My Verification</span>
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

      {/* Main Content */}
      <div className={`dashboard-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="dash-topbar">
          <div>
            <button className="toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button>
          </div>
          <div className="header-actions" style={{position:'relative'}}>
            <span>Welcome, <strong>{user?.email?.split('@')[0] || 'Staff'}</strong></span>
            <span className="badge badge-verified">Customer Support</span>
            <div className="user-avatar" onClick={() => setShowDropdown(!showDropdown)} style={{cursor:'pointer'}}>
              {(user?.email?.[0] || 'S').toUpperCase()}
            </div>
            {showDropdown && (
              <div className="profile-dropdown show">
                <div className="dropdown-header">
                  <strong>{user?.email || 'Staff'}</strong>
                  <small>Staff Member</small>
                </div>
                <button className="dropdown-item" onClick={()=>{setActiveTab('profile');setShowDropdown(false);}}><i className="fas fa-user"></i> View Profile</button>
                <button className="dropdown-item" onClick={()=>{setActiveTab('password');setShowDropdown(false);}}><i className="fas fa-key"></i> Change Password</button>
                <button className="dropdown-item text-danger" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Logout</button>
              </div>
            )}
            <button className="logout-btn-header" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="welcome-card">
          <div>
            <h4>Welcome Back, {user?.email?.split('@')[0] || 'Staff'}!</h4>
            <p>Customer Support & Verification Dashboard</p>
          </div>
          <i className="fas fa-headset" style={{fontSize:'3rem',opacity:0.3}}></i>
        </div>

        {/* ============ CHANGE PASSWORD TAB ============ */}
        {activeTab === 'password' && (
          <div className="dash-card form-card">
            <h3>🔒 Change Password</h3>
            {passwordMsg && (
              <div className={passwordMsg.includes('✅') ? 'success-message' : 'error-message'}>
                {passwordMsg}
              </div>
            )}
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" placeholder="Enter current password"
                value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" placeholder="Enter new password (min 6 characters)"
                value={passwordForm.newPass} onChange={e => setPasswordForm({...passwordForm, newPass: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" placeholder="Re-enter new password"
                value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} />
            </div>
            <button className="btn-gold" onClick={handlePasswordChange}>Update Password</button>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="stats-row">
              <div className="stat-box"><span className="stat-icon">🎫</span><h3>{stats.openTickets}</h3><p>Open Tickets</p></div>
              <div className="stat-box"><span className="stat-icon">⚖️</span><h3>{stats.pendingDisputes}</h3><p>Pending Disputes</p></div>
              <div className="stat-box"><span className="stat-icon">📧</span><h3>{stats.unreadInquiries}</h3><p>Unread Inquiries</p></div>
              <div className="stat-box"><span className="stat-icon">📞</span><h3>{stats.missedCalls}</h3><p>Missed Calls</p></div>
            </div>

            <div className="stats-row">
              <div className="stat-box"><span className="stat-icon">✅</span><h3>{stats.ticketsResolved}</h3><p>Tickets Resolved</p></div>
              <div className="stat-box"><span className="stat-icon">⏱️</span><h3>{stats.avgResponseTime}</h3><p>Avg Response</p></div>
              <div className="stat-box"><span className="stat-icon">⭐</span><h3>{stats.customerSatisfaction}</h3><p>Satisfaction</p></div>
              <div className="stat-box"><span className="stat-icon">🛡️</span><h3>{stats.verificationsProcessed}</h3><p>Verifications</p></div>
            </div>

            {/* Open Support Tickets */}
            <div className="dash-card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px',marginBottom:'15px'}}>
                <h3><i className="fas fa-ticket-alt"></i> Open Support Tickets</h3>
                <div style={{display:'flex',gap:'8px'}}>
                  <button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'8px 12px',borderRadius:'5px',cursor:'pointer'}}
                    onClick={() => handleExportCSV(tickets, 'tickets_export.csv')}>📥 Export CSV</button>
                  <button className="btn-sm" style={{background:'#0a1628',color:'#d4a843',border:'none',padding:'8px 12px',borderRadius:'5px',cursor:'pointer'}}
                    onClick={handlePrint}>🖨️ Print</button>
                  <button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>setActiveTab('tickets')}>View All</button>
                </div>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Ticket ID</th><th>User</th><th>Subject</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {tickets.map(t => (
                      <tr key={t.id}>
                        <td><strong>{t.id}</strong></td>
                        <td>{t.user}</td>
                        <td>{t.subject}</td>
                        <td><span className={`badge ${t.priority==='high'?'badge-pending':t.priority==='normal'?'badge-gold':'badge-verified'}`}>{t.priority}</span></td>
                        <td><span className={`badge ${t.status==='open'?'badge-pending':'badge-verified'}`}>{t.status}</span></td>
                        <td><button className="btn-sm" style={{background:'#0a1628',color:'white',border:'none',padding:'5px 10px',borderRadius:'3px',cursor:'pointer',fontSize:'11px'}}>Respond</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Customer Calls */}
            <div className="dash-card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px',marginBottom:'15px'}}>
                <h3><i className="fas fa-phone"></i> Recent Customer Calls</h3>
                <button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}} onClick={()=>setActiveTab('calls')}>View All</button>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Caller</th><th>Name</th><th>Subject</th><th>Duration</th><th>Status</th></tr></thead>
                  <tbody>
                    {calls.map(c => (
                      <tr key={c.id}><td>{c.caller}</td><td>{c.name}</td><td>{c.subject}</td><td>{c.duration}</td>
                        <td><span className={`badge ${c.status==='completed'?'badge-verified':'badge-pending'}`}>{c.status}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dash-card">
              <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
              <div className="action-grid">
                <button className="action-card" onClick={()=>setActiveTab('tickets')}><span className="action-icon">🎫</span><h4>New Ticket</h4></button>
                <button className="action-card" onClick={()=>setActiveTab('calls')}><span className="action-icon">📞</span><h4>Call Customer</h4></button>
                <button className="action-card" onClick={()=>setActiveTab('verifications')}><span className="action-icon">🛡️</span><h4>Verify User</h4></button>
                <button className="action-card" onClick={()=>setActiveTab('disputes')}><span className="action-icon">⚖️</span><h4>Resolve Dispute</h4></button>
              </div>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="dash-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px',marginBottom:'15px'}}>
              <h3>All Support Tickets</h3>
              <button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'8px 12px',borderRadius:'5px',cursor:'pointer'}}
                onClick={() => handleExportCSV(tickets, 'tickets.csv')}>📥 Export CSV</button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>ID</th><th>User</th><th>Type</th><th>Subject</th><th>Priority</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id}><td>{t.id}</td><td>{t.user}</td><td><span className="badge badge-gold">{t.type}</span></td><td>{t.subject}</td><td>{t.priority}</td><td>{t.status}</td><td>{t.date}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Calls Tab */}
        {activeTab === 'calls' && (
          <div className="dash-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px',marginBottom:'15px'}}>
              <h3>Customer Call Log</h3>
              <button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'8px 12px',borderRadius:'5px',cursor:'pointer'}}
                onClick={() => handleExportCSV(calls, 'calls.csv')}>📥 Export CSV</button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Caller</th><th>Name</th><th>Subject</th><th>Duration</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {calls.map(c => (
                    <tr key={c.id}><td>{c.caller}</td><td>{c.name}</td><td>{c.subject}</td><td>{c.duration}</td><td>{c.status}</td><td>{c.date}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div className="dash-card">
            <h3>Active Disputes</h3>
            {disputes.map(d => (
              <div key={d.id} style={{borderLeft:'4px solid #ffc107',padding:'15px',marginBottom:'15px',background:'#fffdf5',borderRadius:'8px'}}>
                <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
                  <div>
                    <h4>{d.id} - {d.job}</h4>
                    <p>Seeker: {d.seeker} | Agent: {d.agent}</p>
                    <p>Amount: {d.amount} | Reason: {d.reason}</p>
                    <p className="text-muted">{d.daysLeft} days remaining</p>
                  </div>
                  <span className={`badge ${d.status==='pending_agent'?'badge-pending':'badge-verified'}`}>{d.status}</span>
                </div>
                <div style={{marginTop:'10px',display:'flex',gap:'10px'}}>
                  <button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'6px 12px',borderRadius:'4px',cursor:'pointer'}}>✅ Approve Refund</button>
                  <button className="btn-sm" style={{background:'#dc3545',color:'white',border:'none',padding:'6px 12px',borderRadius:'4px',cursor:'pointer'}}>❌ Deny</button>
                  <button className="btn-sm" style={{background:'#0a1628',color:'white',border:'none',padding:'6px 12px',borderRadius:'4px',cursor:'pointer'}}>📞 Contact Agent</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verification Queue Tab */}
        {activeTab === 'verification-queue' && (
          <div className="dash-card">
            <h3>Verification Queue</h3>
            <div style={{borderLeft:'4px solid #ffc107',padding:'15px',background:'#fffdf5',borderRadius:'8px',marginTop:'15px'}}>
              <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
                <div>
                  <h4>🤝 John Agent (Agent)</h4>
                  <p className="text-muted">NIN: 12345678901 | BVN: 222*****22</p>
                  <p className="text-muted">Guarantor: Mary Guarantor - 08044444444</p>
                  <p className="text-muted">Documents: Passport ✅ | Certificate ✅ | NIN ✅ | BVN ✅</p>
                </div>
                <span className="badge badge-pending">Pending Review</span>
              </div>
              <div style={{marginTop:'12px',display:'flex',gap:'10px',flexWrap:'wrap'}}>
                <button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}}>✅ Approve</button>
                <button className="btn-sm" style={{background:'#dc3545',color:'white',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}}>❌ Reject</button>
                <button className="btn-sm" style={{background:'#0a1628',color:'white',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}}>🔍 Review Documents</button>
                <button className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'8px 16px',borderRadius:'5px',cursor:'pointer'}}>📞 Call Guarantor</button>
              </div>
            </div>
          </div>
        )}

        {/* Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <div className="dash-card">
            <h3>Inquiries</h3>
            {inquiries.map(inq => (
              <div key={inq.id} className="list-row">
                <div>
                  <strong>{inq.subject}</strong>
                  <p className="text-muted">From: {inq.from} | {inq.date}</p>
                </div>
                <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                  <span className={`badge ${inq.status==='unread'?'badge-pending':'badge-verified'}`}>{inq.status}</span>
                  <button className="btn-sm" style={{background:'#0a1628',color:'white',border:'none',padding:'5px 10px',borderRadius:'3px',cursor:'pointer'}}>Reply</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="dash-card form-card">
            <h3>My Profile</h3>
            <div className="form-group"><label>Full Name</label><input type="text" placeholder="Staff Name" /></div>
            <div className="form-group"><label>Email</label><input type="email" value={user?.email || ''} readOnly /></div>
            <div className="form-group"><label>Staff ID</label><input type="text" placeholder="Staff ID" readOnly /></div>
            <button type="button" className="btn-gold">Update Profile</button>
          </div>
        )}

        {/* My Verification Tab */}
        {activeTab === 'verification' && (
          <div className="dash-card form-card">
            <h3>🛡️ Staff Verification</h3>
            <div className="verification-checklist">
              <h4>Required Documents:</h4>
              <p>✅ Email Address</p><p>✅ Phone Number</p>
              <p>⏳ Passport Photograph</p><p>⏳ Full Photo of Self</p>
              <p>⏳ GPS Photo of Address</p><p>⏳ NIN</p>
              <p>⏳ BVN</p><p>⏳ Bank Account Details</p>
              <p>⏳ Date of Birth Certificate</p><p>⏳ Highest Academic Certificate</p>
              <p>⏳ Guarantor Name, Phone & Address</p>
              <p>⏳ Next of Kin Name, Phone & Address</p>
              <p>⏳ Emergency Contact</p><p>⏳ Two Social Media Contacts</p>
            </div>
            <div className="form-group"><label>Upload Passport</label><input type="file"/></div>
            <div className="form-group"><label>Upload NIN</label><input type="text" placeholder="11-digit NIN"/></div>
            <div className="form-group"><label>BVN</label><input type="text" placeholder="11-digit BVN"/></div>
            <button className="btn-gold">Submit for Verification</button>
          </div>
        )}

        {/* Other tabs */}
        {['verifications','reports','analytics','messages','notifications'].includes(activeTab) && (
          <div className="empty-state">
            <span className="empty-icon">🚧</span>
            <h4>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-',' ')}</h4>
            <p>Ready for implementation</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StaffDashboard;