import { create } from 'zustand';
import api from '../services/api';

export const useSettingsStore = create((set) => ({
  settings: null,
  isLoading: true,

  fetchPublicSettings: async () => {
    try {
      const response = await api.get('/settings/public');
      set({ settings: response.data.data, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
