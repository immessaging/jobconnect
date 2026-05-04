import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitVerification } from '../services/api';
import './Dashboard.css';

function StaffDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const unreadCount = 3;

  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  // Full staff verification form
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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/signin'); return; }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/signin'); };

  const handlePasswordChange = () => {
    setPasswordMsg('');
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) { setPasswordMsg('❌ All fields required'); return; }
    if (passwordForm.newPass.length < 6) { setPasswordMsg('❌ Min 6 characters'); return; }
    if (passwordForm.newPass !== passwordForm.confirm) { setPasswordMsg('❌ Passwords do not match'); return; }
    setPasswordMsg('✅ Password changed!'); setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  const handleVerifySubmit = async () => {
    setVerifyLoading(true); setVerifyMsg('');
    try {
      await submitVerification({ user_id: user?.id, email: user?.email, user_type: 'staff', ...verifyForm });
      setVerifyMsg('✅ Verification submitted!');
    } catch { setVerifyMsg('❌ Failed to submit.'); }
    setVerifyLoading(false);
  };

  const handleExportCSV = (data, filename) => {
    const csv = Object.keys(data[0]).join(',') + '\n' + data.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  const stats = {
    openTickets: tickets.filter(t => t.status === 'open').length,
    pendingDisputes: disputes.filter(d => d.status === 'pending_agent').length,
    unreadInquiries: inquiries.filter(i => i.status === 'unread').length,
    missedCalls: calls.filter(c => c.status === 'missed').length,
    ticketsResolved: 32, avgResponseTime: '12 min', customerSatisfaction: '4.8/5', verificationsProcessed: 25,
  };

  return (
    <div className="dashboard">
      <div className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header"><div className="user-avatar">👨‍💼</div>{!sidebarCollapsed && <><h3>JobConnect</h3><span className="badge badge-verified">Staff Panel</span></>}</div>
        <nav className="sidebar-nav">
          <div className="nav-header">SUPPORT</div>
          <button className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}><i className="fas fa-tachometer-alt"></i> Dashboard</button>
          <button className={`nav-item ${activeTab==='tickets'?'active':''}`} onClick={()=>setActiveTab('tickets')}><i className="fas fa-ticket-alt"></i> Tickets{stats.openTickets>0&&<span className="notification-badge">{stats.openTickets}</span>}</button>
          <button className={`nav-item ${activeTab==='calls'?'active':''}`} onClick={()=>setActiveTab('calls')}><i className="fas fa-phone"></i> Calls</button>
          <button className={`nav-item ${activeTab==='disputes'?'active':''}`} onClick={()=>setActiveTab('disputes')}><i className="fas fa-gavel"></i> Disputes</button>
          <button className={`nav-item ${activeTab==='inquiries'?'active':''}`} onClick={()=>setActiveTab('inquiries')}><i className="fas fa-envelope"></i> Inquiries</button>
          <hr className="sidebar-divider" /><div className="nav-header">VERIFICATION</div>
          <button className={`nav-item ${activeTab==='verifications'?'active':''}`} onClick={()=>setActiveTab('verifications')}><i className="fas fa-check-double"></i> Verify Users</button>
          <button className={`nav-item ${activeTab==='verification-queue'?'active':''}`} onClick={()=>setActiveTab('verification-queue')}><i className="fas fa-list-check"></i> Queue</button>
          <hr className="sidebar-divider" /><div className="nav-header">ACCOUNT</div>
          <button className={`nav-item ${activeTab==='profile'?'active':''}`} onClick={()=>setActiveTab('profile')}><i className="fas fa-user-circle"></i> Profile</button>
          <button className={`nav-item ${activeTab==='verification'?'active':''}`} onClick={()=>setActiveTab('verification')}><i className="fas fa-id-card"></i> My Verification</button>
          <button className={`nav-item ${activeTab==='password'?'active':''}`} onClick={()=>setActiveTab('password')}><i className="fas fa-lock"></i> Password</button>
          <hr className="sidebar-divider" />
          <button className="nav-item logout-btn" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Logout</button>
        </nav>
      </div>

      <div className={`dashboard-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="dash-topbar"><div><button className="toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>☰</button></div><div className="header-actions"><span>Welcome, <strong>{user?.email?.split('@')[0] || 'Staff'}</strong></span><span className="badge badge-verified">Support</span><div className="user-avatar" onClick={()=>setShowDropdown(!showDropdown)} style={{cursor:'pointer'}}>{(user?.email?.[0]||'S').toUpperCase()}</div>{showDropdown&&(<div className="profile-dropdown show"><div className="dropdown-header"><strong>{user?.email}</strong></div><button className="dropdown-item" onClick={()=>{setActiveTab('profile');setShowDropdown(false);}}>Profile</button><button className="dropdown-item" onClick={()=>{setActiveTab('password');setShowDropdown(false);}}>Password</button><button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button></div>)}<button className="logout-btn-header" onClick={handleLogout}>🚪 Logout</button></div></div>
        <div className="welcome-card"><div><h4>Welcome, {user?.email?.split('@')[0] || 'Staff'}!</h4><p>Customer Support & Verification Dashboard</p></div></div>

        {/* VERIFICATION TAB - FULL STAFF FIELDS */}
        {activeTab === 'verification' && (
          <div className="dash-card form-card">
            <h3>🛡️ Staff Verification</h3>
            <p className="text-muted">All fields required for staff verification</p>
            <div className="verification-checklist"><h4>Required:</h4><p>✅ Email</p><p>✅ Phone</p><p>⏳ Full Name</p><p>⏳ DOB</p><p>⏳ Address</p><p>⏳ Passport</p><p>⏳ Full Photo</p><p>⏳ NIN</p><p>⏳ BVN</p><p>⏳ Bank Details</p><p>⏳ DOB Cert</p><p>⏳ Academic Cert</p><p>⏳ Guarantor</p><p>⏳ Next of Kin</p><p>⏳ Emergency Contact</p><p>⏳ Social Media</p></div>
            <div className="form-group"><label>Full Name *</label><input type="text" placeholder="Full legal name" value={verifyForm.full_name} onChange={e=>setVerifyForm({...verifyForm,full_name:e.target.value})} required /></div>
            <div className="form-group"><label>Date of Birth *</label><input type="date" value={verifyForm.date_of_birth} onChange={e=>setVerifyForm({...verifyForm,date_of_birth:e.target.value})} required /></div>
            <div className="form-group"><label>Address *</label><input type="text" placeholder="Full address" value={verifyForm.address} onChange={e=>setVerifyForm({...verifyForm,address:e.target.value})} required /></div>
            <div className="form-group"><label>Upload Passport</label><input type="file" /></div>
            <div className="form-group"><label>Upload Full Photo</label><input type="file" /></div>
            <div className="form-group"><label>NIN *</label><input type="text" placeholder="11-digit NIN" maxLength="11" value={verifyForm.nin} onChange={e=>setVerifyForm({...verifyForm,nin:e.target.value})} required /></div>
            <div className="form-group"><label>BVN *</label><input type="text" placeholder="11-digit BVN" maxLength="11" value={verifyForm.bvn} onChange={e=>setVerifyForm({...verifyForm,bvn:e.target.value})} required /></div>
            <h4 style={{marginTop:'20px',color:'#0a1628'}}>Bank Details</h4>
            <div className="form-group"><label>Bank Name *</label><input type="text" placeholder="Your bank" value={verifyForm.bank_name} onChange={e=>setVerifyForm({...verifyForm,bank_name:e.target.value})} required /></div>
            <div className="form-group"><label>Account Number *</label><input type="text" placeholder="10-digit NUBAN" value={verifyForm.account_number} onChange={e=>setVerifyForm({...verifyForm,account_number:e.target.value})} required /></div>
            <h4 style={{marginTop:'20px',color:'#0a1628'}}>Guarantor Details</h4>
            <div className="form-group"><label>Guarantor Name *</label><input type="text" placeholder="Full name" value={verifyForm.guarantor_name} onChange={e=>setVerifyForm({...verifyForm,guarantor_name:e.target.value})} required /></div>
            <div className="form-group"><label>Guarantor Phone *</label><input type="tel" placeholder="080xxxxxxxx" value={verifyForm.guarantor_phone} onChange={e=>setVerifyForm({...verifyForm,guarantor_phone:e.target.value})} required /></div>
            <div className="form-group"><label>Guarantor Address</label><input type="text" placeholder="Address" value={verifyForm.guarantor_address} onChange={e=>setVerifyForm({...verifyForm,guarantor_address:e.target.value})} /></div>
            <h4 style={{marginTop:'20px',color:'#0a1628'}}>Next of Kin</h4>
            <div className="form-group"><label>Next of Kin Name *</label><input type="text" placeholder="Full name" value={verifyForm.next_of_kin_name} onChange={e=>setVerifyForm({...verifyForm,next_of_kin_name:e.target.value})} required /></div>
            <div className="form-group"><label>Next of Kin Phone *</label><input type="tel" placeholder="080xxxxxxxx" value={verifyForm.next_of_kin_phone} onChange={e=>setVerifyForm({...verifyForm,next_of_kin_phone:e.target.value})} required /></div>
            <div className="form-group"><label>Next of Kin Address</label><input type="text" placeholder="Address" value={verifyForm.next_of_kin_address} onChange={e=>setVerifyForm({...verifyForm,next_of_kin_address:e.target.value})} /></div>
            <h4 style={{marginTop:'20px',color:'#0a1628'}}>Emergency Contact</h4>
            <div className="form-group"><label>Emergency Contact Name *</label><input type="text" placeholder="Full name" value={verifyForm.emergency_contact_name} onChange={e=>setVerifyForm({...verifyForm,emergency_contact_name:e.target.value})} required /></div>
            <div className="form-group"><label>Emergency Contact Phone *</label><input type="tel" placeholder="080xxxxxxxx" value={verifyForm.emergency_contact_phone} onChange={e=>setVerifyForm({...verifyForm,emergency_contact_phone:e.target.value})} required /></div>
            <h4 style={{marginTop:'20px',color:'#0a1628'}}>Social Media</h4>
            <div className="form-group"><label>Social Media 1</label><input type="text" placeholder="@username" value={verifyForm.social_media_1} onChange={e=>setVerifyForm({...verifyForm,social_media_1:e.target.value})} /></div>
            <div className="form-group"><label>Social Media 2</label><input type="text" placeholder="@username" value={verifyForm.social_media_2} onChange={e=>setVerifyForm({...verifyForm,social_media_2:e.target.value})} /></div>
            <button className="btn-gold" onClick={handleVerifySubmit} disabled={verifyLoading}>{verifyLoading ? '⏳ Submitting...' : '📤 Submit Verification'}</button>
            {verifyMsg && <div className={verifyMsg.includes('✅')?'success-message':'error-message'} style={{marginTop:'15px'}}>{verifyMsg}</div>}
          </div>
        )}

        {/* Password Tab */}
        {activeTab==='password'&&(<div className="dash-card form-card"><h3>🔒 Change Password</h3>{passwordMsg&&<div className={passwordMsg.includes('✅')?'success-message':'error-message'}>{passwordMsg}</div>}<div className="form-group"><label>Current</label><input type="password" value={passwordForm.current} onChange={e=>setPasswordForm({...passwordForm,current:e.target.value})}/></div><div className="form-group"><label>New</label><input type="password" value={passwordForm.newPass} onChange={e=>setPasswordForm({...passwordForm,newPass:e.target.value})}/></div><div className="form-group"><label>Confirm</label><input type="password" value={passwordForm.confirm} onChange={e=>setPasswordForm({...passwordForm,confirm:e.target.value})}/></div><button className="btn-gold" onClick={handlePasswordChange}>Update</button></div>)}

        {/* Dashboard Tab */}
        {activeTab==='dashboard'&&(<div><div className="stats-row"><div className="stat-box"><span className="stat-icon">🎫</span><h3>{stats.openTickets}</h3><p>Open Tickets</p></div><div className="stat-box"><span className="stat-icon">⚖️</span><h3>{stats.pendingDisputes}</h3><p>Disputes</p></div><div className="stat-box"><span className="stat-icon">📧</span><h3>{stats.unreadInquiries}</h3><p>Inquiries</p></div><div className="stat-box"><span className="stat-icon">📞</span><h3>{stats.missedCalls}</h3><p>Calls</p></div></div></div>)}

        {/* Other tabs */}
        {['tickets','calls','disputes','inquiries','verifications','verification-queue','reports','analytics','messages','notifications','profile'].includes(activeTab)&&activeTab!=='verification'&&activeTab!=='password'&&activeTab!=='dashboard'&&(<div className="dash-card"><h3>{activeTab}</h3><p className="text-muted">Content available</p></div>)}
      </div>
    </div>
  );
}

export default StaffDashboard;