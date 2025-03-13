import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create a base API instance
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Development mode settings
const isDevelopment = process.env.NODE_ENV === 'development';
const bypassAuthInDevelopment = true;

const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // If in development mode with bypass enabled, add a mock token
    if (isDevelopment && bypassAuthInDevelopment) {
      config.headers = config.headers || {};
      config.headers.Authorization = 'Bearer dev-mock-token';
      return config;
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // In development mode with bypass enabled, return a fake successful response for unauthorized errors
    if (isDevelopment && bypassAuthInDevelopment && error.response?.status === 401) {
      console.warn('Development mode: Bypassing 401 Unauthorized error');
      
      // Mock a successful empty response
      return Promise.resolve({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config
      });
    }

    const originalRequest = error.config;

    // If the error is due to an expired token, try to refresh it
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });

        const { token, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails and we're not in dev mode bypass, redirect to login
        if (!(isDevelopment && bypassAuthInDevelopment)) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Generic API request method
const request = async <T = any>(
  config: AxiosRequestConfig
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await api(config);
    return response.data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// API methods
export const apiService = {
  get: <T = any>(url: string, params?: any): Promise<T> =>
    request<T>({ method: 'GET', url, params }),

  post: <T = any>(url: string, data?: any): Promise<T> =>
    request<T>({ method: 'POST', url, data }),

  put: <T = any>(url: string, data?: any): Promise<T> =>
    request<T>({ method: 'PUT', url, data }),

  patch: <T = any>(url: string, data?: any): Promise<T> =>
    request<T>({ method: 'PATCH', url, data }),

  delete: <T = any>(url: string): Promise<T> =>
    request<T>({ method: 'DELETE', url }),
};

export default apiService; 