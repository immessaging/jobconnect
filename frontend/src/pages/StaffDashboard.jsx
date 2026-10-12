import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitVerification, getUserProfile } from '../services/api';
import './Dashboard.css';

function StaffDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  // Staff verification form
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

  // Profile
  const [profileData, setProfileData] = useState(null);

  // Support data (demo)
  const [tickets, setTickets] = useState([
    { id: 'TKT-001', user: 'seeker1@example.com', subject: 'Payment not reflecting', type: 'payment_issue', priority: 'high', status: 'open', date: '2024-05-03' },
    { id: 'TKT-002', user: 'agent1@example.com', subject: 'Verification documents rejected', type: 'verification_help', priority: 'normal', status: 'assigned', date: '2024-05-02' },
  ]);

  const [calls, setCalls] = useState([
    { id: 1, caller: '08033333333', name: 'Jane Seeker', subject: 'Job application status', duration: '12:30', status: 'completed', date: '2024-05-03' },
  ]);

  const [disputes, setDisputes] = useState([
    { id: 'DSP-001', seeker: 'seeker1@example.com', agent: 'John Agent', job: 'Software Developer', amount: '₦45,000', reason: 'Job not secured', status: 'pending_agent', daysLeft: 18 },
  ]);

  const [inquiries, setInquiries] = useState([
    { id: 1, from: 'seeker1@example.com', subject: 'How to apply for jobs', type: 'general', status: 'unread', date: '2024-05-03' },
  ]);

  // Messages & Chat
  const [staffMessages, setStaffMessages] = useState([
    { id: 1, from: 'admin@jobconnect.com', subject: 'New Verification Assignment', message: 'You have 3 new agents to verify.', time: '1 hour ago', unread: true },
    { id: 2, from: 'agent1@example.com', subject: 'Document Upload Issue', message: 'I cannot upload my NIN document.', time: '3 hours ago', unread: false },
  ]);

  const [staffChatMessages, setStaffChatMessages] = useState([]);
  const [staffChatInput, setStaffChatInput] = useState('');
  const [selectedStaffContact, setSelectedStaffContact] = useState('');

  // Calls
  const [staffCallTarget, setStaffCallTarget] = useState('');
  const [showStaffCall, setShowStaffCall] = useState(false);

  // Notice Board
  const [staffNoticeBoard, setStaffNoticeBoard] = useState([
    { id: 1, title: 'Verification Targets', content: 'All pending verifications must be completed within 48 hours.', priority: 'urgent', date: '2024-06-01' },
    { id: 2, title: 'Team Meeting', content: 'Weekly team meeting every Monday at 9AM.', priority: 'normal', date: '2024-05-30' },
  ]);

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
    
    // Fetch profile
    if (parsedUser.id) {
      getUserProfile(parsedUser.id)
        .then(res => setProfileData(res.data?.profile || null))
        .catch(err => console.log('Profile fetch error:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  const handleLogout = () => { 
    localStorage.removeItem('user'); 
    navigate('/signin'); 
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

  const handleVerifySubmit = async () => {
    setVerifyLoading(true); 
    setVerifyMsg('');
    try {
      await submitVerification({ 
        user_id: user?.id, 
        email: user?.email, 
        user_type: 'staff', 
        ...verifyForm 
      });
      setVerifyMsg('✅ Verification submitted!');
    } catch { 
      setVerifyMsg('❌ Failed to submit.'); 
    }
    setVerifyLoading(false);
  };

  const handleExportCSV = (data, filename) => {
    const csv = Object.keys(data[0]).join(',') + '\n' + data.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); 
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); 
    a.download = filename; 
    a.click();
  };

  const handleStaffSendChat = () => {
    if (!staffChatInput.trim()) return;
    setStaffChatMessages([...staffChatMessages, { 
      id: Date.now(), 
      sender: 'staff', 
      text: staffChatInput, 
      time: new Date().toLocaleTimeString(), 
      isStaff: true 
    }]);
    setStaffChatInput('');
  };

  const handleStaffReplyMessage = (from) => {
    const reply = prompt(`Reply to ${from}:`);
    if (reply) alert(`✅ Reply sent to ${from}`);
  };

  const handleStaffStartCall = () => {
    if (!staffCallTarget) { 
      alert('Select who to call'); 
      return; 
    }
    setShowStaffCall(true);
    const roomUrl = `https://meet.jit.si/JobConnect-Staff-${Date.now()}`;
    navigator.clipboard?.writeText(roomUrl);
    alert(`📋 Room link copied! Share with ${staffCallTarget} to join.`);
  };

  // ============================================
  // COMPUTED STATS
  // ============================================
  const stats = {
    openTickets: tickets.filter(t => t.status === 'open').length,
    pendingDisputes: disputes.filter(d => d.status === 'pending_agent').length,
    unreadInquiries: inquiries.filter(i => i.status === 'unread').length,
    missedCalls: calls.filter(c => c.status === 'missed').length,
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a1628', color: '#d4a843' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
          <h2>Loading Staff Dashboard...</h2>
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
          <div className="user-avatar">👨‍💼</div>
          {!sidebarCollapsed && (
            <><h3>JobConnect</h3><span className="badge badge-verified">Staff Panel</span></>
          )}
        </div>
        <nav className="sidebar-nav">
          <div className="nav-header">SUPPORT</div>
          <button className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}>
            <i className="fas fa-tachometer-alt"></i> Dashboard
          </button>
          <button className={`nav-item ${activeTab==='tickets'?'active':''}`} onClick={()=>setActiveTab('tickets')}>
            <i className="fas fa-ticket-alt"></i> Tickets
            {stats.openTickets>0 && <span className="notification-badge">{stats.openTickets}</span>}
          </button>
          <button className={`nav-item ${activeTab==='disputes'?'active':''}`} onClick={()=>setActiveTab('disputes')}>
            <i className="fas fa-gavel"></i> Disputes
          </button>
          <button className={`nav-item ${activeTab==='inquiries'?'active':''}`} onClick={()=>setActiveTab('inquiries')}>
            <i className="fas fa-envelope"></i> Inquiries
          </button>
          <hr className="sidebar-divider" />
          <div className="nav-header">COMMUNICATION</div>
          <button className={`nav-item ${activeTab==='staff-messages'?'active':''}`} onClick={()=>setActiveTab('staff-messages')}>
            <i className="fas fa-envelope"></i> Messages
            {staffMessages.filter(m=>m.unread).length>0 && <span className="notification-badge">{staffMessages.filter(m=>m.unread).length}</span>}
          </button>
          <button className={`nav-item ${activeTab==='staff-chat'?'active':''}`} onClick={()=>setActiveTab('staff-chat')}>
            <i className="fas fa-comments"></i> Live Chat
          </button>
          <button className={`nav-item ${activeTab==='staff-calls'?'active':''}`} onClick={()=>setActiveTab('staff-calls')}>
            <i className="fas fa-phone"></i> Make Calls
          </button>
          <button className={`nav-item ${activeTab==='staff-noticeboard'?'active':''}`} onClick={()=>setActiveTab('staff-noticeboard')}>
            <i className="fas fa-clipboard-list"></i> Notice Board
          </button>
          <hr className="sidebar-divider" />
          <div className="nav-header">ACCOUNT</div>
          <button className={`nav-item ${activeTab==='profile'?'active':''}`} onClick={()=>setActiveTab('profile')}>
            <i className="fas fa-user-circle"></i> Profile
          </button>
          <button className={`nav-item ${activeTab==='verification'?'active':''}`} onClick={()=>setActiveTab('verification')}>
            <i className="fas fa-id-card"></i> My Verification
          </button>
          <button className={`nav-item ${activeTab==='password'?'active':''}`} onClick={()=>setActiveTab('password')}>
            <i className="fas fa-lock"></i> Password
          </button>
          <hr className="sidebar-divider" />
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className={`dashboard-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="dash-topbar">
          <div><button className="toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button></div>
          <div className="header-actions">
            <span>Welcome, <strong>{user?.email?.split('@')[0] || 'Staff'}</strong></span>
            <span className="badge badge-verified">Support</span>
            <div className="user-avatar" onClick={()=>setShowDropdown(!showDropdown)} style={{cursor:'pointer'}}>
              {(user?.email?.[0]||'S').toUpperCase()}
            </div>
            {showDropdown && (
              <div className="profile-dropdown show">
                <div className="dropdown-header"><strong>{user?.email}</strong></div>
                <button className="dropdown-item" onClick={()=>{setActiveTab('profile');setShowDropdown(false);}}>Profile</button>
                <button className="dropdown-item" onClick={()=>{setActiveTab('password');setShowDropdown(false);}}>Password</button>
                <button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button>
              </div>
            )}
            <button className="logout-btn-header" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        <div className="welcome-card">
          <div><h4>Welcome, {user?.email?.split('@')[0] || 'Staff'}!</h4><p>Customer Support & Verification Dashboard</p></div>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab==='dashboard' && (
          <div>
            <div className="stats-row">
              <div className="stat-box"><span className="stat-icon">🎫</span><h3>{stats.openTickets}</h3><p>Open Tickets</p></div>
              <div className="stat-box"><span className="stat-icon">⚖️</span><h3>{stats.pendingDisputes}</h3><p>Disputes</p></div>
              <div className="stat-box"><span className="stat-icon">📧</span><h3>{stats.unreadInquiries}</h3><p>Inquiries</p></div>
              <div className="stat-box"><span className="stat-icon">📞</span><h3>{stats.missedCalls}</h3><p>Calls</p></div>
            </div>
          </div>
        )}

        {/* TICKETS TAB */}
        {activeTab==='tickets' && (
          <div className="dash-card">
            <h3>🎫 Support Tickets</h3>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>ID</th><th>User</th><th>Subject</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id}>
                      <td>{t.id}</td><td>{t.user}</td><td>{t.subject}</td>
                      <td><span className={`badge ${t.priority==='high'?'badge-pending':'badge-gold'}`}>{t.priority}</span></td>
                      <td><span className="badge badge-verified">{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DISPUTES TAB */}
        {activeTab==='disputes' && (
          <div className="dash-card">
            <h3>⚖️ Disputes</h3>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>ID</th><th>Seeker</th><th>Agent</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {disputes.map(d => (
                    <tr key={d.id}>
                      <td>{d.id}</td><td>{d.seeker}</td><td>{d.agent}</td>
                      <td>{d.amount}</td><td><span className="badge badge-pending">{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INQUIRIES TAB */}
        {activeTab==='inquiries' && (
          <div className="dash-card">
            <h3>📧 Inquiries</h3>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>From</th><th>Subject</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {inquiries.map(i => (
                    <tr key={i.id}>
                      <td>{i.from}</td><td>{i.subject}</td>
                      <td><span className="badge badge-pending">{i.status}</span></td>
                      <td>{i.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                <div className="form-group"><label>Verification Status</label><input type="text" value={profileData.verification_status || 'pending'} readOnly style={{color: '#28a745', fontWeight: 'bold'}} /></div>
              </>
            ) : (
              <p className="text-muted">Loading profile...</p>
            )}
          </div>
        )}

        {/* VERIFICATION TAB */}
        {activeTab==='verification' && (
          <div className="dash-card form-card">
            <h3>🛡️ Staff Verification</h3>
            <p className="text-muted">All fields required for staff verification</p>
            <div className="form-group"><label>Full Name *</label><input type="text" value={verifyForm.full_name} onChange={e=>setVerifyForm({...verifyForm,full_name:e.target.value})} required /></div>
            <div className="form-group"><label>Date of Birth *</label><input type="date" value={verifyForm.date_of_birth} onChange={e=>setVerifyForm({...verifyForm,date_of_birth:e.target.value})} required /></div>
            <div className="form-group"><label>Address *</label><input type="text" value={verifyForm.address} onChange={e=>setVerifyForm({...verifyForm,address:e.target.value})} required /></div>
            <div className="form-group"><label>NIN *</label><input type="text" maxLength="11" value={verifyForm.nin} onChange={e=>setVerifyForm({...verifyForm,nin:e.target.value})} required /></div>
            <div className="form-group"><label>BVN *</label><input type="text" maxLength="11" value={verifyForm.bvn} onChange={e=>setVerifyForm({...verifyForm,bvn:e.target.value})} required /></div>
            <h4>Bank Details</h4>
            <div className="form-group"><label>Bank Name *</label><input type="text" value={verifyForm.bank_name} onChange={e=>setVerifyForm({...verifyForm,bank_name:e.target.value})} required /></div>
            <div className="form-group"><label>Account Number *</label><input type="text" value={verifyForm.account_number} onChange={e=>setVerifyForm({...verifyForm,account_number:e.target.value})} required /></div>
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
            <button className="btn-gold" onClick={handlePasswordChange}>Update</button>
          </div>
        )}

        {/* STAFF MESSAGES */}
        {activeTab==='staff-messages' && (
          <div className="dash-card">
            <h3><i className="fas fa-envelope"></i> Messages</h3>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>From</th><th>Subject</th><th>Message</th><th>Time</th><th>Action</th></tr></thead>
                <tbody>
                  {staffMessages.map(m=>(
                    <tr key={m.id} style={{background:m.unread?'#f0f7ff':'transparent',fontWeight:m.unread?'bold':'normal'}}>
                      <td>{m.from}</td><td>{m.subject}</td><td>{m.message?.substring(0,40)}...</td><td>{m.time}</td>
                      <td><button className="btn-sm" style={{background:'#0a1628',color:'white',border:'none',padding:'5px 10px',borderRadius:'3px',cursor:'pointer'}} onClick={()=>handleStaffReplyMessage(m.from)}>Reply</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STAFF CHAT */}
        {activeTab==='staff-chat' && (
          <div className="dash-card" style={{display:'flex',flexDirection:'column',height:'60vh'}}>
            <h3><i className="fas fa-comments"></i> Live Chat</h3>
            <div style={{display:'flex',gap:'10px',marginBottom:'15px'}}>
              <select value={selectedStaffContact} onChange={e=>setSelectedStaffContact(e.target.value)} style={{padding:'8px',borderRadius:'5px',border:'2px solid #e0e0e0',flex:1}}>
                <option value="">Select contact...</option>
                <option value="Admin">Admin</option>
                <option value="Agent">Agents</option>
                <option value="Seeker">Job Seekers</option>
              </select>
            </div>
            <div style={{flex:1,overflowY:'auto',border:'1px solid #e0e0e0',borderRadius:'8px',padding:'15px',marginBottom:'15px',background:'#f9f9f9'}}>
              {staffChatMessages.length===0 ? <p className="text-muted" style={{textAlign:'center'}}>Start a conversation</p> :
                staffChatMessages.map(m=>(
                  <div key={m.id} style={{textAlign:m.isStaff?'right':'left',marginBottom:'12px'}}>
                    <div style={{display:'inline-block',background:m.isStaff?'#0a1628':'white',color:m.isStaff?'white':'#333',padding:'10px 15px',borderRadius:'12px',maxWidth:'70%'}}>
                      <p style={{margin:0,fontSize:'14px'}}>{m.text}</p><small style={{opacity:0.7,fontSize:'10px'}}>{m.time}</small>
                    </div>
                  </div>
                ))
              }
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <input type="text" value={staffChatInput} onChange={e=>setStaffChatInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&handleStaffSendChat()} placeholder="Type message..." style={{flex:1,padding:'12px',border:'2px solid #e0e0e0',borderRadius:'8px'}}/>
              <button onClick={handleStaffSendChat} className="btn-sm" style={{background:'#d4a843',color:'#0a1628',border:'none',padding:'12px 20px',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'}}>Send</button>
            </div>
          </div>
        )}

        {/* STAFF CALLS */}
        {activeTab==='staff-calls' && (
          <div className="dash-card">
            <h3><i className="fas fa-phone"></i> Make a Call</h3>
            <div style={{display:'flex',gap:'10px',marginBottom:'20px'}}>
              <select value={staffCallTarget} onChange={e=>setStaffCallTarget(e.target.value)} style={{padding:'10px',borderRadius:'5px',border:'2px solid #e0e0e0',flex:1}}>
                <option value="">Select who to call...</option>
                <option value="Admin">Admin</option>
                <option value="Agent">Agent</option>
                <option value="Seeker">Job Seeker</option>
              </select>
              <button className="btn-sm" style={{background:'#28a745',color:'white',border:'none',padding:'10px 20px',borderRadius:'5px',cursor:'pointer'}} onClick={handleStaffStartCall}>📹 Video Call</button>
            </div>
            {showStaffCall && (
              <div style={{marginTop:'15px'}}>
                <button className="btn btn-red" style={{marginBottom:'10px'}} onClick={()=>setShowStaffCall(false)}>❌ End Call</button>
                <iframe src={`https://meet.jit.si/JobConnect-Staff-${Date.now()}`} style={{width:'100%',height:'400px',border:'none',borderRadius:'10px'}} allow="camera; microphone; fullscreen"/>
              </div>
            )}
          </div>
        )}

        {/* STAFF NOTICE BOARD */}
        {activeTab==='staff-noticeboard' && (
          <div className="dash-card">
            <h3><i className="fas fa-clipboard-list"></i> Notice Board</h3>
            {staffNoticeBoard.map(n=>(
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
      </div>
    </div>
  );
}

export default StaffDashboard;