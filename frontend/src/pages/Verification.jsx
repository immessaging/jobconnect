import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  uploadToCloudinary,
  uploadVerificationDocument,
  getMyVerificationDocuments
} from '../services/api';
import './Verification.css';

const DOC_TYPES = [
  { value: 'utility_bill',   label: 'Utility Bill (NEPA / Water / etc.)' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'voters_card',    label: "Voter's Card" },
  { value: 'nin_slip',       label: 'NIN Slip' }
];

export default function Verification() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

  const [docType, setDocType]   = useState('');
  const [file, setFile]         = useState(null);
  const [notes, setNotes]       = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage]   = useState(null);
  const [myDocs, setMyDocs]     = useState([]);

  useEffect(() => {
    if (!user.id) { navigate('/signin'); return; }
    loadMyDocs();
  }, []);

  const loadMyDocs = async () => {
    try {
      const res = await getMyVerificationDocuments(user.id);
      setMyDocs(res?.data?.data?.documents || []);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!docType) return setMessage({ type: 'error', text: 'Pick a document type' });
    if (!file)    return setMessage({ type: 'error', text: 'Attach a file' });
    if (file.size > 5 * 1024 * 1024) return setMessage({ type: 'error', text: 'Max 5 MB' });

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      await uploadVerificationDocument({
        user_id: user.id,
        document_type: docType,
        document_url: url,
        document_name: file.name,
        user_notes: notes
      });
      setMessage({ type: 'success', text: '✅ Submitted! An admin will review it shortly.' });
      setDocType(''); setFile(null); setNotes('');
      loadMyDocs();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Upload failed. Try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="verification-page">
      <div className="verification-card">
        <h2>🛡️ Account Verification</h2>
        <p className="subtitle">
          Upload any <strong>one</strong> of the documents below to get verified.
          Verified accounts unlock job applications, agent features and payouts.
        </p>

        {message && (
          <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
            {message.text}
          </div>
        )}

        {user.is_verified && (
          <div className="success-message">✅ Your account is already verified.</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} required>
              <option value="">-- Select one --</option>
              {DOC_TYPES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>File (JPG, PNG or PDF — max 5 MB)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={e => setFile(e.target.files[0])}
              required
            />
            {file && <small>{file.name} ({Math.round(file.size/1024)} KB)</small>}
          </div>

          <div className="form-group">
            <label>Additional Notes (optional)</label>
            <textarea
              rows="3"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anything the reviewer should know..."
            />
          </div>

          <button type="submit" className="auth-btn" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Submit for Verification'}
          </button>
        </form>

        {myDocs.length > 0 && (
          <div style={{ marginTop: 30 }}>
            <h3>Your Submissions</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {myDocs.map(d => (
                <li key={d.id} style={{
                  padding: '10px 0',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>📄 {d.document_type.replace('_', ' ')}</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: d.status === 'approved' ? 'green'
                         : d.status === 'rejected' ? 'red' : '#b8860b'
                  }}>
                    {d.status.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}