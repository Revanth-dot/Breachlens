/**
 * API Service — Handles all backend communication.
 * Uses VITE_API_URL env var in production, Vite proxy in dev.
 */

import axios from 'axios';

// In production, VITE_API_URL should point to the deployed backend
// (e.g. https://breachlens-api.onrender.com)
// In dev, the Vite proxy handles /api requests
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('breachlens_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses — clear token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('breachlens_token');
      localStorage.removeItem('breachlens_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  getProfile: () => api.get('/profile'),
};

// ── Scans ────────────────────────────────────────────

export const scanAPI = {
  startScan: (url) => api.post('/scan', { url }),
  getScans: () => api.get('/scans'),
  getScan: (scanId) => api.get(`/scans/${scanId}`),
  getScanEnhanced: (scanId) => api.get(`/scans/${scanId}/enhanced`),
  getExecutiveSummary: (scanId) => api.get(`/scans/${scanId}/executive-summary`),
  getBreachScenarios: (scanId) => api.get(`/scans/${scanId}/breach-scenarios`),
  compareScans: (scanId, previousScanId) => {
    let url = `/scans/${scanId}/compare`;
    if (previousScanId) url += `?previous_scan_id=${previousScanId}`;
    return api.get(url);
  },
  getDashboardStats: () => api.get('/dashboard/stats'),
};

// ── Reports ──────────────────────────────────────────

export const reportAPI = {
  generateReport: (scanId) => api.post(`/reports/generate/${scanId}`),
  getReports: () => api.get('/reports'),
  downloadReport: (reportId) => api.get(`/reports/${reportId}/download`, { responseType: 'blob' }),
};

export default api;
