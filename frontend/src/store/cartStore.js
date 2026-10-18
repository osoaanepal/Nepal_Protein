import { create } from 'zustand';

const CART_STORAGE_KEY = 'osoaa_cart_items';

const getInitialCart = () => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const useCartStore = create((set, get) => ({
  items: getInitialCart(),
  isDrawerOpen: false,
  coupon: null, // { code, discountAmount, discountType, discountValue }

  // Save cart changes to localStorage
  _persist: (items) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  },

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  /**
   * Add Item to Cart (Handles both simple products & specific variants)
   */
  addItem: (product, variant = null, quantity = 1) => {
    const currentItems = [...get().items];
    const variantId = variant ? variant._id : null;
    const itemKey = `${product._id}_${variantId || 'base'}`;

    const existingIndex = currentItems.findIndex((item) => item.key === itemKey);

    const price = variant ? variant.price : product.price;
    const compareAtPrice = variant ? variant.compareAtPrice : product.compareAtPrice;
    const maxStock = variant ? variant.stock : product.stock;
    const primaryImage = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url || '';

    if (existingIndex > -1) {
      // Check stock limit
      const currentQty = currentItems[existingIndex].quantity;
      const newQty = Math.min(currentQty + quantity, maxStock);
      currentItems[existingIndex].quantity = newQty;
    } else {
      currentItems.push({
        key: itemKey,
        productId: product._id,
        variantId,
        name: product.name,
        slug: product.slug,
        image: primaryImage,
        variantName: variant ? variant.variantName : '',
        sku: variant?.sku || product.sku,
        price,
        compareAtPrice,
        maxStock,
        quantity: Math.min(quantity, maxStock),
      });
    }

    set({ items: currentItems, isDrawerOpen: true });
    get()._persist(currentItems);
  },

  /**
   * Update item quantity
   */
  updateQuantity: (key, quantity) => {
    const currentItems = get().items.map((item) => {
      if (item.key === key) {
        const validQty = Math.max(1, Math.min(quantity, item.maxStock));
        return { ...item, quantity: validQty };
      }
      return item;
    });

    set({ items: currentItems });
    get()._persist(currentItems);
  },

  /**
   * Remove item from cart
   */
  removeItem: (key) => {
    const currentItems = get().items.filter((item) => item.key !== key);
    set({ items: currentItems });
    get()._persist(currentItems);
  },

  /**
   * Clear all items from cart
   */
  clearCart: () => {
    set({ items: [], coupon: null });
    get()._persist([]);
  },

  /**
   * Set validated coupon
   */
  setCoupon: (couponData) => set({ coupon: couponData }),
  removeCoupon: () => set({ coupon: null }),

  /**
   * Computed Cart Metrics
   */
  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getDiscount: () => {
    const coupon = get().coupon;
    if (!coupon) return 0;
    return coupon.discountAmount || 0;
  },

  getGrandTotal: (deliveryFee = 0) => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscount();
    return Math.max(0, subtotal - discount) + deliveryFee;
  },
}));
