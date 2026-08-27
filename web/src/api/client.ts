import axios, { AxiosError } from 'axios';

// Get base URL from localStorage or environment or default
export const getBaseUrl = (): string => {
  const saved = localStorage.getItem('smarthome_api_url');
  // Nếu url cũ lưu IP cứng 192.168.1.35:8000 làm lỗi khi ra ngoài mạng, tự dọn dẹp về /api
  if (saved && (saved.includes('192.168.1.35:8000') || saved.includes(':8000'))) {
    localStorage.removeItem('smarthome_api_url');
    return '/api';
  }
  return saved || import.meta.env.VITE_API_URL || '/api';
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
