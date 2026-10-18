import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('osoaa_token') || null,
  isLoading: true,
  isCheckingAuth: false,
  error: null,

  // Check current session on app boot
  checkAuth: async () => {
    if (get().isCheckingAuth) return;
    set({ isCheckingAuth: true, isLoading: true, error: null });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.user, isLoading: false, isCheckingAuth: false });
    } catch (err) {
      set({ user: null, token: null, isLoading: false, isCheckingAuth: false });
      localStorage.removeItem('osoaa_token');
    }
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      if (token) {
        localStorage.setItem('osoaa_token', token);
      }
      set({ user, token, isLoading: false, error: null });
      return { success: true, user };
    } catch (err) {
      set({ isLoading: false, error: err.customMessage });
      return {
        success: false,
        message: err.customMessage,
        code: err.code,
        email: err.email,
      };
    }
  },

  // Register
  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', formData);
      set({ isLoading: false });
      return { success: true, message: response.data.message, email: response.data.email };
    } catch (err) {
      set({ isLoading: false, error: err.customMessage });
      return { success: false, message: err.customMessage };
    }
  },

  // Verify OTP
  verifyOtp: async (email, otp) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      const { user, token } = response.data;
      if (token) {
        localStorage.setItem('osoaa_token', token);
      }
      set({ user, token, isLoading: false });
      return { success: true, message: response.data.message, user };
    } catch (err) {
      set({ isLoading: false, error: err.customMessage });
      return { success: false, message: err.customMessage };
    }
  },

  // Resend OTP
  resendOtp: async (email, purpose = 'EMAIL_VERIFICATION') => {
    try {
      const response = await api.post('/auth/resend-otp', { email, purpose });
      return { success: true, message: response.data.message };
    } catch (err) {
      return { success: false, message: err.customMessage };
    }
  },

  // Forgot Password
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/forgot-password', { email });
      set({ isLoading: false });
      return { success: true, message: response.data.message };
    } catch (err) {
      set({ isLoading: false, error: err.customMessage });
      return { success: false, message: err.customMessage };
    }
  },

  // Reset Password
  resetPassword: async (email, otp, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/reset-password', { email, otp, newPassword });
      set({ isLoading: false });
      return { success: true, message: response.data.message };
    } catch (err) {
      set({ isLoading: false, error: err.customMessage });
      return { success: false, message: err.customMessage };
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore
    } finally {
      localStorage.removeItem('osoaa_token');
      set({ user: null, token: null });
    }
  },

  // Update user profile in local state
  setUser: (user) => set({ user }),
}));
