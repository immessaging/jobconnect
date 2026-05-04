import axios from 'axios';

// Use environment variable for production, fallback to localhost for development
const API_URL = 'https://jobconnect-api-gjtw.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// JOB ENDPOINTS
// ============================================
export const getJobs = () => api.get('/api/jobs');
export const getJobDetail = (id) => api.get(`/api/jobs/${id}`);

// ============================================
// AGENT ENDPOINTS
// ============================================
export const getAgentJobs = (agentId) => api.get(`/api/agent/${agentId}/jobs`);
export const postJob = (data) => api.post('/api/agent/post-job', data);

// ============================================
// AUTH ENDPOINTS
// ============================================
export const registerUser = (data) => api.post('/api/auth/register', data);

// ============================================
// DATA ENDPOINTS
// ============================================
export const getTestData = () => api.get('/api/test-data');
export const getTestimonials = () => api.get('/api/testimonials');

// ============================================
// CONTACT ENDPOINTS
// ============================================
export const sendContactMessage = (data) => api.post('/api/contact', data);

// ============================================
// GPS & LOGGING ENDPOINTS
// ============================================
export const trackGPS = (data) => api.post('/api/gps/track', data);
export const logAccess = (data) => api.post('/api/logs/access', data);
export const logActivity = (data) => api.post('/api/logs/activity', data);

// ============================================
// NOTIFICATIONS & ANNOUNCEMENTS
// ============================================
export const getNotifications = (userId) => api.get(`/api/notifications/${userId}`);
export const getAnnouncements = () => api.get('/api/announcements');

// ============================================
// DISPUTE ENDPOINTS
// ============================================
export const agentConfirmDispute = (agreementId) => api.post(`/api/commission/${agreementId}/agent-confirm`);

// ============================================
// ANALYTICS ENDPOINTS
// ============================================
export const getAnalyticsSummary = () => api.get('/api/analytics/summary');
export const getPlatformStats = () => api.get('/api/stats');
export const sendEmail = (data) => api.post('/api/email/send', data);
export const sendNotification = (data) => api.post('/api/email/notify', data); 

export default api;