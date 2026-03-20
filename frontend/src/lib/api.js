import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, new_password: newPassword }),
  verifyResetToken: (token) => api.get(`/auth/verify-reset-token/${token}`),
  // Microsoft OAuth endpoints
  getMicrosoftConfig: () => api.get('/auth/microsoft/config'),
  microsoftAuth: (data) => api.post('/auth/microsoft/authenticate', data),
};

// User Management API (Admin)
export const userAPI = {
  createUser: (data) => api.post('/admin/users', data),
  getAllUsers: () => api.get('/admin/users'),
  getStaffMembers: () => api.get('/admin/staff'),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  resetUserPassword: (userId, newPassword) => api.post(`/admin/users/${userId}/reset-password`, { new_password: newPassword }),
};

// Transcript Request API
export const requestAPI = {
  create: (data) => api.post('/requests', data),
  getAll: () => api.get('/requests'),
  getAllRequests: () => api.get('/requests/all'),
  getById: (id) => api.get(`/requests/${id}`),
  update: (id, data) => api.patch(`/requests/${id}`, data),
  editAsStudent: (id, data) => api.put(`/requests/${id}/edit`, data),
  uploadDocument: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/requests/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getDocument: (documentId) => api.get(`/documents/${documentId}`),
};

// Recommendation Letter Request API
export const recommendationAPI = {
  create: (data) => api.post('/recommendations', data),
  getAll: () => api.get('/recommendations'),
  getAllRequests: () => api.get('/recommendations/all'),
  getById: (id) => api.get(`/recommendations/${id}`),
  update: (id, data) => api.patch(`/recommendations/${id}`, data),
  editAsStudent: (id, data) => api.put(`/recommendations/${id}/edit`, data),
  uploadDocument: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/recommendations/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Export API
export const exportAPI = {
  transcripts: (format, status = null) => {
    const params = status ? `?status=${status}` : '';
    return api.get(`/export/transcripts/${format}${params}`, { responseType: 'blob' });
  },
  recommendations: (format, status = null) => {
    const params = status ? `?status=${status}` : '';
    return api.get(`/export/recommendations/${format}${params}`, { responseType: 'blob' });
  },
};

// Notification API
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

// Analytics API
export const analyticsAPI = {
  get: () => api.get('/analytics'),
};

// Admin Data Management API
export const dataManagementAPI = {
  getSummary: () => api.get('/admin/data-summary'),
  exportAllData: () => api.get('/admin/export-all-data/pdf', { responseType: 'blob' }),
  exportAllDataJSON: () => api.get('/admin/export-all-data/json', { responseType: 'blob' }),
  importDataJSON: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/import-data/json', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  clearAllData: () => api.delete('/admin/clear-all-data'),
};

export default api;
