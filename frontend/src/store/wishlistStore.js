import { create } from 'zustand';
import api from '../services/api';

export const useWishlistStore = create((set, get) => ({
  items: [],
  isLoading: false,

  fetchWishlist: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/wishlist');
      set({ items: response.data?.data || [], isLoading: false });
    } catch (e) {
      set({ items: [], isLoading: false });
    }
  },

  toggleWishlist: async (productId) => {
    try {
      const response = await api.post('/wishlist/toggle', { productId });
      await get().fetchWishlist();
      return response.data;
    } catch (e) {
      throw e;
    }
  },

  removeFromWishlist: async (productId) => {
    try {
      const response = await api.delete(`/wishlist/${productId}`);
      await get().fetchWishlist();
      return response.data;
    } catch (e) {
      throw e;
    }
  },

  isInWishlist: (productId) => {
    if (!productId) return false;
    const targetId = productId.toString();
    return get().items.some((item) => {
      const itemId = item?._id ? item._id.toString() : item?.toString();
      return itemId === targetId;
    });
  },

  clearWishlist: () => set({ items: [], isLoading: false }),
}));
