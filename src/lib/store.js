import { create } from 'zustand';
import { pb } from './pocketbase';

export const useAuthStore = create((set) => ({
  user: pb.authStore.model,
  isLoading: true,

  checkAuth: () => {
    set({ user: pb.authStore.model, isLoading: false });
  },

  login: async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      set({ user: authData.record });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  logout: () => {
    pb.authStore.clear();
    set({ user: null });
  }
}));