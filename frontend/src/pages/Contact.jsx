import React, { useState } from 'react';
import axios from '../services/api';
import './StaticPages.css';

function Contact() {
  const [form, setForm] = useState({ name:'', email:'', subject:'', message:'' });
  const [status, setStatus] = useState({ loading:false, success:'', error:'' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading:true, success:'', error:'' });

    try {
      const response = await axios.post('/api/contact', form);
      setStatus({ loading:false, success:'✅ Message sent successfully! We will get back to you within 24 hours.', error:'' });
      setForm({ name:'', email:'', subject:'', message:'' });
      setTimeout(() => setStatus({ loading:false, success:'', error:'' }), 5000);
    } catch (err) {
      setStatus({ loading:false, success:'', error:'❌ Failed to send message. Please try again.' });
    }
  };

  return (
    <div className="static-page">
      <div className="page-hero">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you</p>
      </div>
      <div className="page-content">
        <div className="contact-grid">
          <div className="contact-info">
            <h3>Get In Touch</h3>
            <p>📧 support@jobconnect.ng</p>
            <p>📞 0800-JOBCONNECT</p>
            <p>📍 123 Marina Road, Lagos Island, Lagos, Nigeria</p>
            <p>🕐 Monday - Friday: 8:00 AM - 6:00 PM</p>
            <p>🕐 Saturday: 10:00 AM - 2:00 PM</p>
            <div style={{marginTop:'20px', padding:'15px', background:'#f0f7ff', borderRadius:'8px'}}>
              <h4>Quick Response</h4>
              <p style={{fontSize:'13px'}}>We typically respond within 2-4 hours during business hours.</p>
            </div>
          </div>
          
          <form className="contact-form" onSubmit={handleSubmit}>
            {status.success && <div className="success-message">{status.success}</div>}
            {status.error && <div className="error-message">{status.error}</div>}
            
            <div className="form-group">
              <label>Your Name *</label>
              <input type="text" placeholder="Full Name" value={form.name} 
                onChange={e=>setForm({...form,name:e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Your Email *</label>
              <input type="email" placeholder="your@email.com" value={form.email} 
                onChange={e=>setForm({...form,email:e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Subject *</label>
              <select value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} required>
                <option value="">Select a topic</option>
                <option>General Inquiry</option>
                <option>Job Seeker Support</option>
                <option>Agent Partnership</option>
                <option>Verification Help</option>
                <option>Payment Issue</option>
                <option>Dispute Resolution</option>
                <option>Report a Problem</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Your Message *</label>
              <textarea rows="5" placeholder="Describe your issue or question in detail..." 
                value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-red" disabled={status.loading}>
              {status.loading ? '⏳ Sending...' : '📤 Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Contact;