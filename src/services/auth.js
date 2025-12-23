import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api';

export const authService = {
  async signup(username, email, password) {
    try {
      const response = await api.post(API_ENDPOINTS.SIGNUP, {
        username,
        email,
        password,
      });
      
      const { user, token } = response.data;
      
      // Save token and user data
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return { user, token };
    } catch (error) {
      throw error.response?.data?.detail || 'Errore durante la registrazione';
    }
  },

  async login(usernameOrEmail, password) {
    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, {
        username_or_email: usernameOrEmail,
        password,
      });
      
      const { user, token } = response.data;
      
      // Save token and user data
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return { user, token };
    } catch (error) {
      throw error.response?.data?.detail || 'Errore durante il login';
    }
  },

  async logout() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  async getCurrentUser() {
    try {
      const response = await api.get(API_ENDPOINTS.ME);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Errore nel recuperare i dati utente';
    }
  },

  async isAuthenticated() {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  },

  async getStoredUser() {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
