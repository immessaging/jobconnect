import axios from 'axios';

// Use environment variable for production, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'https://jobconnect-api-gjtw.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor for admin routes
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.email) {
    config.headers['X-User-Data'] = JSON.stringify({
      id: user.id,
      email: user.email,
      adminLevel: user.adminLevel || 'admin'
    });
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

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
export const loginUser = (data) => api.post('/api/auth/login', data);

// ============================================
// DATA ENDPOINTS
// ============================================
export const getTestData = () => api.get('/api/test-data');
export const getTestimonials = () => api.get('/api/testimonials');

// ============================================
// USERS LIST (for chat/calls)
// ============================================
export const getUsersList = () => api.get('/api/users-list');

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

// ============================================
// EMAIL ENDPOINTS
// ============================================
export const send_Email = (data) => api.post('/api/email/send', data);
export const sendNotification = (data) => api.post('/api/email/notify', data);

// ============================================
// VERIFICATION ENDPOINTS
// ============================================
export const submitVerification = (data) => api.post('/api/verify/submit', data);
export const getVerifications = () => api.get('/api/admin/verifications');
export const verifyUser = (userId, action) => api.post(`/api/admin/verify/${userId}`, { action });

// ============================================
// KYC VERIFICATION
// ============================================
export const verifyBVN = (data) => api.post('/api/kyc/verify-bvn', data);
export const verifyVNIN = (data) => api.post('/api/kyc/verify-vnin', data);
export const uploadUtilityBill = (data) => api.post('/api/kyc/upload-utility-bill', data);
export const getKYCStatus = (userId) => api.get(`/api/kyc/status/${userId}`);

// ============================================
// USER PROFILE
// ============================================
export const getUserProfile = (userId) => api.get(`/api/user/profile/${userId}`);

// ============================================
// ADMIN USER MANAGEMENT
// ============================================
export const adminGetAllUsers = () => api.get('/api/admin/users');
export const adminGetUser = (userId) => api.get(`/api/admin/user/${userId}`);
export const adminUpdateUser = (userId, data) => api.put(`/api/admin/user/${userId}`, data);
export const adminDeleteUser = (userId) => api.delete(`/api/admin/user/${userId}`);
export const adminToggleUserStatus = (userId) => api.post(`/api/admin/user/${userId}/toggle-status`);
export const adminResetPassword = (userId, newPassword) => api.post(`/api/admin/user/${userId}/reset-password`, { new_password: newPassword });

// ============================================
// ADMIN JOB MANAGEMENT
// ============================================
export const adminGetAllJobs = () => api.get('/api/admin/jobs');
export const adminUpdateJob = (jobId, data) => api.put(`/api/admin/job/${jobId}`, data);
export const adminDeleteJob = (jobId) => api.delete(`/api/admin/job/${jobId}`);

// ============================================
// ADMIN TESTIMONIALS
// ============================================
export const adminCreateTestimonial = (data) => api.post('/api/admin/testimonials', data);
export const adminUpdateTestimonial = (data) => api.put('/api/admin/testimonials', data);
export const adminDeleteTestimonial = (id) => api.delete(`/api/admin/testimonials?id=${id}`);

// ============================================
// ADMIN LOGS
// ============================================
export const getAccessLogs = () => api.get('/api/admin/access-logs');
export const getActivityLogs = () => api.get('/api/admin/activity-logs');
export const getAuditLogs = () => api.get('/api/admin/audit-logs');

// ============================================
// ADMIN COMMUNICATION
// ============================================
export const sendMessage = (data) => api.post('/api/admin/message/send', data);
export const broadcastMessage = (data) => api.post('/api/admin/broadcast', data);
export const getUserMessages = (userId) => api.get(`/api/admin/messages/${userId}`);
export const sendEmail = (data) => api.post('/api/admin/send-email', data);
export const sendSMS = (data) => api.post('/api/admin/send-sms', data);

// ============================================
// GPS ENDPOINTS
// ============================================
export const getGPSHistory = (userId) => api.get(`/api/gps/history/${userId}`);
export const getAllUserLocations = () => api.get('/api/gps/all-users');

// ============================================
// CLOUDINARY FILE UPLOAD
// ============================================
const CLOUD_NAME = 'dsvum6ztj';
const UPLOAD_PRESET = 'jobconnect_uploads';

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  
  const data = await response.json();
  return data.secure_url;
};

export default api;