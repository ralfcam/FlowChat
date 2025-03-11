import apiService from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  avatar?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

const authService = {
  // Login with email and password
  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await apiService.post<LoginResponse>('/auth/login', data);
    
    // Store tokens in localStorage
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    return response;
  },

  // Register a new user
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await apiService.post<LoginResponse>('/auth/register', data);
    
    // Store tokens in localStorage
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    return response;
  },

  // Logout the current user
  logout: async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiService.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  },

  // Refresh the access token
  refreshToken: async (): Promise<{ token: string; refreshToken: string }> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiService.post<{ token: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken }
    );

    // Update tokens in localStorage
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);

    return response;
  },

  // Get the current user profile
  getCurrentUser: async (): Promise<User> => {
    return apiService.get<User>('/auth/me');
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    return apiService.put<User>('/auth/profile', data);
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    return apiService.post('/auth/change-password', { currentPassword, newPassword });
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // Get the current token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },
};

export default authService; 