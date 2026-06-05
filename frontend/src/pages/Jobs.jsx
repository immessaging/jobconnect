import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJobs } from '../services/api';
import './Jobs.css';

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError('');
      
      try {
        const res = await getJobs();
        console.log('📦 Jobs API Response:', res.data); // Debug log
        
        // Handle both response formats:
        // Format 1: { success: true, data: { jobs: [...] } }
        // Format 2: { success: true, jobs: [...] }
        // Format 3: { jobs: [...] }
        const jobList = res.data?.data?.jobs || res.data?.jobs || res.data || [];
        
        console.log('✅ Jobs loaded:', jobList.length);
        setJobs(Array.isArray(jobList) ? jobList : []);
        setLoading(false);
        
      } catch (err) {
        console.error('❌ Failed to load jobs:', err);
        setError('Failed to load jobs. Please check your connection and try again.');
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const formatSalary = (min, max, type) => {
    const minVal = Number(min) || 0;
    const maxVal = Number(max) || 0;
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    });
    return `${formatter.format(minVal)} - ${formatter.format(maxVal)} / ${type || 'monthly'}`;
  };

  // Filter jobs by search term
  const filteredJobs = jobs.filter(job => 
    (job.title && job.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (job.qualification && job.qualification.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (job.skills && job.skills.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Loading state
  if (loading) {
    return (
      <div className="loading" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '40px'
      }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '20px', color: '#666' }}>Loading verified jobs...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="error" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
        <p style={{ color: '#dc3545', fontSize: '18px', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-gold" 
          style={{
            padding: '12px 24px',
            background: '#d4a843',
            color: '#0a1628',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="jobs-page">
      <div className="page-header">
        <h1>Available Jobs</h1>
        <p>Verified job listings from trusted agents across Nigeria</p>
        
        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search jobs by title, qualification, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="search-clear" 
              onClick={() => setSearchTerm('')}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                cursor: 'pointer',
                marginLeft: '10px'
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="no-jobs" style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f8f9fa',
          borderRadius: '10px',
          marginTop: '30px'
        }}>
          <div className="no-jobs-icon" style={{ fontSize: '4rem', marginBottom: '15px' }}>📭</div>
          <h3 style={{ color: '#0a1628', marginBottom: '10px' }}>
            {searchTerm ? 'No matching jobs found' : 'No jobs available'}
          </h3>
          <p style={{ color: '#666' }}>
            {searchTerm 
              ? 'Try a different search term' 
              : 'No active jobs at the moment. Check back soon!'}
          </p>
          {searchTerm && (
            <button 
              className="btn btn-gold" 
              onClick={() => setSearchTerm('')}
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                background: '#d4a843',
                color: '#0a1628',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="results-count" style={{
            margin: '20px 0',
            color: '#666',
            fontSize: '14px'
          }}>
            Showing <strong>{filteredJobs.length}</strong> job{filteredJobs.length !== 1 ? 's' : ''}
            {searchTerm && <span> for "<strong>{searchTerm}</strong>"</span>}
          </p>
          <div className="grid">
            {filteredJobs.map(job => (
              <div key={job.id} className="card job-card">
                <div className="job-card-header">
                  <h2>{job.title || 'Untitled Job'}</h2>
                  <div className="job-badges">
                    {job.verified_badge && (
                      <span className="badge badge-verified">✓ Verified</span>
                    )}
                    <span className="badge badge-gold">{job.status || 'active'}</span>
                  </div>
                </div>
                
                <div className="job-card-body">
                  <div className="job-detail">
                    <span className="label">📋 Qualification:</span>
                    <span>{job.qualification || 'Not specified'}</span>
                  </div>
                  <div className="job-detail">
                    <span className="label">💼 Experience:</span>
                    <span>{job.experience || 'Not specified'}</span>
                  </div>
                  {job.skills && (
                    <div className="job-detail">
                      <span className="label">🛠️ Skills:</span>
                      <span>{job.skills}</span>
                    </div>
                  )}
                  <div className="job-salary">
                    💰 {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
                  </div>
                  <div className="job-type">
                    <span className="badge badge-gold">{job.salary_type || 'monthly'}</span>
                  </div>
                </div>

                <div className="job-card-footer">
                  <div className="job-posted-date">
                    📅 Posted: {job.posted_date ? new Date(job.posted_date).toLocaleDateString('en-NG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Recently'}
                  </div>
                  <Link to={`/jobs/${job.id}`} className="btn btn-red">
                    View Details & Apply →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Jobs;