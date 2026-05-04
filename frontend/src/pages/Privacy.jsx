import React from 'react';
import './StaticPages.css';

function Privacy() {
  return (
    <div className="static-page">
      <div className="page-hero">
        <h1>Privacy Policy</h1>
        <p>GDPR & NDPR Compliant</p>
      </div>
      <div className="page-content">
        <section>
          <h2>1. Data We Collect</h2>
          <ul>
            <li>Email address and phone number</li>
            <li>Name and date of birth</li>
            <li>NIN, BVN (for agents)</li>
            <li>GPS location (with explicit consent)</li>
            <li>Uploaded documents (CV, certificates)</li>
          </ul>
        </section>
        <section>
          <h2>2. How We Use Your Data</h2>
          <ul>
            <li>Verify identity for job matching</li>
            <li>Process commission payments</li>
            <li>Track job application status</li>
            <li>Prevent fraud</li>
          </ul>
        </section>
        <section>
          <h2>3. Your Rights (GDPR/NDPR)</h2>
          <ul>
            <li>Right to access your data</li>
            <li>Right to delete your account</li>
            <li>Right to withdraw consent</li>
            <li>Right to data portability</li>
          </ul>
        </section>
        <section>
          <h2>4. Contact: +2348163464557</h2>
          <p>📧 eitsolutions556@gmail.com</p>
          <p>📍 Lagos, Nigeria</p>
        </section>
      </div>
    </div>
  );
}

export default Privacy;