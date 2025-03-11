import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import authService, { User, LoginData, RegisterData } from '../services/authService';

// Flag to disable authentication in development mode
const isDevelopment = process.env.NODE_ENV === 'development';
// Set this to true to bypass authentication in development mode
const bypassAuthInDevelopment = true;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// Mock user for development mode
const mockUser: User = {
  id: 'dev-user-id',
  name: 'Development User',
  email: 'dev@example.com',
  role: 'admin',
  avatar: 'https://via.placeholder.com/150',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(isDevelopment && bypassAuthInDevelopment ? mockUser : null);
  const [loading, setLoading] = useState<boolean>(!isDevelopment || !bypassAuthInDevelopment);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isDevelopment && bypassAuthInDevelopment);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Skip auth check in development mode if bypassing auth
      if (isDevelopment && bypassAuthInDevelopment) {
        setIsAuthenticated(true);
        setUser(mockUser);
        setLoading(false);
        return;
      }

      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        // If there's an error, clear the tokens
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (data: LoginData) => {
    // In development mode with bypass enabled, just simulate a successful login
    if (isDevelopment && bypassAuthInDevelopment) {
      setUser(mockUser);
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    // In development mode with bypass enabled, just simulate a successful registration
    if (isDevelopment && bypassAuthInDevelopment) {
      setUser(mockUser);
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // In development mode with bypass enabled, just simulate a logout
    if (isDevelopment && bypassAuthInDevelopment) {
      console.log('Development mode: Simulating logout');
      return;
    }

    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    // In development mode with bypass enabled, just simulate a profile update
    if (isDevelopment && bypassAuthInDevelopment) {
      setUser({...mockUser, ...data});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 