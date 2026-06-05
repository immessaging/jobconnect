import React from 'react';
import { Link } from 'react-router-dom';
import './StaticPages.css';

function Privacy() {
  const lastUpdated = 'June 4, 2024';

  return (
    <div className="static-page">
      {/* Hero */}
      <div className="page-hero">
        <h1>🔒 Privacy Policy</h1>
        <p>GDPR & NDPR Compliant | Last Updated: {lastUpdated}</p>
      </div>

      <div className="page-content">
        {/* Introduction */}
        <section className="privacy-section">
          <h2>Introduction</h2>
          <p>
            JobConnect Nigeria ("we," "our," or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our platform. We comply with the <strong>Nigeria Data Protection Regulation (NDPR)</strong> 
            and the <strong>EU General Data Protection Regulation (GDPR)</strong>.
          </p>
          <p>
            By using JobConnect, you consent to the data practices described in this policy.
          </p>
        </section>

        {/* 1. Information We Collect */}
        <section className="privacy-section">
          <h2>1. Information We Collect</h2>
          
          <h3>1.1 Personal Information</h3>
          <ul>
            <li><strong>Account Data:</strong> Full name, email address, phone number, and password (hashed).</li>
            <li><strong>Identity Verification:</strong> NIN (National Identification Number), BVN (Bank Verification Number), date of birth, and passport photograph.</li>
            <li><strong>Bank Details:</strong> Bank name, account number, and account name (for agents and staff).</li>
            <li><strong>Next of Kin:</strong> Name, phone number, and address of next of kin.</li>
            <li><strong>Guarantor Details:</strong> Name, phone number, and address of guarantor (for agents).</li>
            <li><strong>Emergency Contact:</strong> Name and phone number of emergency contact.</li>
            <li><strong>Social Media:</strong> Social media handles (optional).</li>
          </ul>

          <h3>1.2 Documents</h3>
          <ul>
            <li>Passport photographs</li>
            <li>Government-issued ID cards</li>
            <li>CV/Resume documents</li>
            <li>Academic certificates</li>
            <li>Utility bills (for address verification)</li>
          </ul>

          <h3>1.3 Automatically Collected Data</h3>
          <ul>
            <li><strong>GPS Location:</strong> With your explicit consent, we collect your device GPS coordinates for location verification and fraud prevention.</li>
            <li><strong>Device Information:</strong> Browser type, operating system, device type, and IP address.</li>
            <li><strong>Usage Data:</strong> Pages visited, time spent, and actions taken on the platform.</li>
            <li><strong>Cookies:</strong> We use essential cookies for platform functionality. See our <Link to="/cookies">Cookie Policy</Link>.</li>
          </ul>
        </section>

        {/* 2. How We Use Your Data */}
        <section className="privacy-section">
          <h2>2. How We Use Your Data</h2>
          <ul>
            <li><strong>Identity Verification:</strong> To verify your identity using NIN, BVN, and biometric data through authorized verification partners (NIBSS, NIMC).</li>
            <li><strong>Job Matching:</strong> To connect verified job seekers with verified agents and employers.</li>
            <li><strong>Payment Processing:</strong> To process commission payments and hold funds in escrow.</li>
            <li><strong>Fraud Prevention:</strong> To detect and prevent fraudulent activities, fake profiles, and scam job listings.</li>
            <li><strong>Communication:</strong> To send you notifications about job applications, verification status, and platform updates.</li>
            <li><strong>Platform Improvement:</strong> To analyze usage patterns and improve our services.</li>
            <li><strong>Legal Compliance:</strong> To comply with Nigerian laws, NDPR requirements, and law enforcement requests.</li>
          </ul>
        </section>

        {/* 3. Data Sharing */}
        <section className="privacy-section">
          <h2>3. Data Sharing & Disclosure</h2>
          <p>We do NOT sell your personal data. We may share your data with:</p>
          <ul>
            <li><strong>Verification Partners:</strong> NIBSS (for BVN), NIMC (for NIN), and IdentityPass for KYC verification.</li>
            <li><strong>Agents:</strong> Your name and qualifications are shared with agents when you apply for jobs.</li>
            <li><strong>Employers:</strong> After commission payment, your contact details are shared with the organization.</li>
            <li><strong>Payment Processors:</strong> Bank details for commission payouts.</li>
            <li><strong>Law Enforcement:</strong> When required by law or to protect our rights and users.</li>
          </ul>
        </section>

        {/* 4. Data Storage & Security */}
        <section className="privacy-section">
          <h2>4. Data Storage & Security</h2>
          <ul>
            <li>All data is stored on secure servers with <strong>SSL/TLS encryption</strong>.</li>
            <li>Passwords are hashed using <strong>bcrypt</strong> (never stored in plain text).</li>
            <li>Database is hosted on <strong>Supabase (PostgreSQL)</strong> with encryption at rest.</li>
            <li>Files uploaded are stored securely on <strong>Cloudinary</strong>.</li>
            <li>We implement <strong>rate limiting</strong> and <strong>SQL injection prevention</strong>.</li>
            <li>Regular security audits and vulnerability assessments are conducted.</li>
          </ul>
        </section>

        {/* 5. Data Retention */}
        <section className="privacy-section">
          <h2>5. Data Retention</h2>
          <ul>
            <li><strong>Account Data:</strong> Retained for the life of your account plus 12 months after deletion.</li>
            <li><strong>Verification Data:</strong> NIN/BVN data is not stored after verification confirmation (only verification status is kept).</li>
            <li><strong>Transaction Data:</strong> Retained for 7 years for legal and audit purposes.</li>
            <li><strong>GPS Data:</strong> Retained for 90 days for dispute resolution.</li>
            <li><strong>Documents:</strong> Retained until account deletion or verification expiry.</li>
          </ul>
        </section>

        {/* 6. Your Rights (NDPR & GDPR) */}
        <section className="privacy-section">
          <h2>6. Your Rights Under NDPR & GDPR</h2>
          <div className="rights-grid">
            <div className="right-card">
              <span className="right-icon">📋</span>
              <h4>Right to Access</h4>
              <p>You can request a copy of all personal data we hold about you.</p>
            </div>
            <div className="right-card">
              <span className="right-icon">✏️</span>
              <h4>Right to Rectification</h4>
              <p>You can update or correct inaccurate personal data.</p>
            </div>
            <div className="right-card">
              <span className="right-icon">🗑️</span>
              <h4>Right to Erasure</h4>
              <p>You can request deletion of your account and all associated data.</p>
            </div>
            <div className="right-card">
              <span className="right-icon">🚫</span>
              <h4>Right to Restrict Processing</h4>
              <p>You can limit how we use your data.</p>
            </div>
            <div className="right-card">
              <span className="right-icon">📤</span>
              <h4>Right to Data Portability</h4>
              <p>You can request your data in a machine-readable format.</p>
            </div>
            <div className="right-card">
              <span className="right-icon">❌</span>
              <h4>Right to Withdraw Consent</h4>
              <p>You can withdraw consent at any time for optional data processing.</p>
            </div>
          </div>
        </section>

        {/* 7. Cookies */}
        <section className="privacy-section">
          <h2>7. Cookies & Tracking</h2>
          <p>We use essential cookies for:</p>
          <ul>
            <li><strong>Authentication:</strong> To keep you logged in securely.</li>
            <li><strong>Security:</strong> To prevent CSRF attacks and unauthorized access.</li>
            <li><strong>Preferences:</strong> To remember your preferences (e.g., cookie consent).</li>
          </ul>
          <p>We do NOT use third-party tracking cookies or sell data to advertisers.</p>
        </section>

        {/* 8. Children's Privacy */}
        <section className="privacy-section">
          <h2>8. Children's Privacy</h2>
          <p>
            JobConnect is not intended for individuals under the age of 18. 
            We do not knowingly collect data from children. If you believe a child has provided us with personal data, 
            please contact us immediately.
          </p>
        </section>

        {/* 9. Changes to This Policy */}
        <section className="privacy-section">
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by:
          </p>
          <ul>
            <li>Posting the new Privacy Policy on this page</li>
            <li>Sending an email notification to registered users</li>
            <li>Updating the "Last Updated" date at the top</li>
          </ul>
          <p>Continued use of the platform after changes constitutes acceptance of the new policy.</p>
        </section>

        {/* 10. Contact Information */}
        <section className="privacy-section contact-section">
          <h2>10. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or wish to exercise your data rights:</p>
          
          <div className="contact-details">
            <div className="contact-item">
              <span className="contact-icon">📧</span>
              <div>
                <strong>Email:</strong>
                <p>eitsolutions556@gmail.com</p>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <div>
                <strong>Phone:</strong>
                <p>+234 816 346 4557</p>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <div>
                <strong>Address:</strong>
                <p>Lagos, Nigeria</p>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">🌐</span>
              <div>
                <strong>Data Protection Officer:</strong>
                <p>DPO@jobconnect.ng</p>
              </div>
            </div>
          </div>
        </section>

        {/* Complaint */}
        <section className="privacy-section complaint-section">
          <h2>11. Lodge a Complaint</h2>
          <p>
            If you believe your data rights have been violated, you have the right to lodge a complaint with:
          </p>
          <ul>
            <li>
              <strong>Nigeria Data Protection Bureau (NDPB):</strong>{' '}
              <a href="https://ndpb.gov.ng" target="_blank" rel="noreferrer">ndpb.gov.ng</a>
            </li>
            <li>
              <strong>Our Data Protection Officer:</strong> DPO@jobconnect.ng
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default Privacy;