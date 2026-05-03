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
    getJobs()
      .then(res => {
        setJobs(res.data.jobs);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load jobs. Make sure backend is running on http://localhost:5000');
        setLoading(false);
      });
  }, []);

  const formatSalary = (min, max, type) => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    });
    return `${formatter.format(min)} - ${formatter.format(max)} / ${type}`;
  };

  // Filter jobs by search term
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.qualification.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.skills && job.skills.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Loading verified jobs...</p>
    </div>
  );

  if (error) return (
    <div className="error">
      <p>⚠️ {error}</p>
      <button onClick={() => window.location.reload()} className="btn btn-gold" style={{marginTop: '15px'}}>
        Retry
      </button>
    </div>
  );

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
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="no-jobs">
          <div className="no-jobs-icon">📭</div>
          <h3>No jobs found</h3>
          <p>{searchTerm ? 'Try a different search term' : 'No active jobs at the moment. Check back soon!'}</p>
          {searchTerm && (
            <button className="btn btn-gold" onClick={() => setSearchTerm('')}>
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="results-count">
            Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
            {searchTerm && <span> for "{searchTerm}"</span>}
          </p>
          <div className="grid">
            {filteredJobs.map(job => (
              <div key={job.id} className="card job-card">
                <div className="job-card-header">
                  <h2>{job.title}</h2>
                  <div className="job-badges">
                    {job.verified_badge && (
                      <span className="badge badge-verified">✓ Verified</span>
                    )}
                    <span className="badge badge-gold">{job.status}</span>
                  </div>
                </div>
                
                <div className="job-card-body">
                  <div className="job-detail">
                    <span className="label">📋 Qualification:</span>
                    <span>{job.qualification}</span>
                  </div>
                  <div className="job-detail">
                    <span className="label">💼 Experience:</span>
                    <span>{job.experience}</span>
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
                    <span className="badge badge-gold">{job.salary_type}</span>
                  </div>
                </div>

                <div className="job-card-footer">
                  <div className="job-posted-date">
                    📅 Posted: {new Date(job.posted_date).toLocaleDateString('en-NG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
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