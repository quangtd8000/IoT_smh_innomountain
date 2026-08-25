import axios, { AxiosError } from 'axios';

// Get base URL from localStorage or environment or default
export const getBaseUrl = (): string => {
  return localStorage.getItem('smarthome_api_url') || import.meta.env.VITE_API_URL || 'http://192.168.1.35:8000/api';
};

export const setBaseUrl = (url: string) => {
  localStorage.setItem('smarthome_api_url', url);
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Update baseURL dynamically
apiClient.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  const token = localStorage.getItem('smarthome_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to unwrap {"success": true, "data": ...} or handle error
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if already on auth page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('smarthome_token');
        localStorage.removeItem('smarthome_user');
        window.dispatchEvent(new Event('auth_unauthorized'));
      }
    }
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'Đã xảy ra lỗi khi kết nối máy chủ';
    return Promise.reject(new Error(message));
  }
);
