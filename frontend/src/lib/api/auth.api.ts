import { apiClient } from './api.client';

export const authApi = {
  // Directly fires off mapped logic against our backend Rest endpoints securely
  login: async (credentials: { email: string; password?: string; rememberMe?: boolean }) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data; // { access_token: "....", user: { id: "...", ... } }
  },
  
  register: async (payload: Record<string, string>) => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (payload: Record<string, string>) => {
    const response = await apiClient.post('/auth/reset-password', payload);
    return response.data;
  },

  googleSignIn: async (idToken: string) => {
    const response = await apiClient.post('/auth/google-signin', { idToken });
    return response.data;
  },
};
