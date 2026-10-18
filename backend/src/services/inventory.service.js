import { Product } from '../models/Product.js';

export const inventoryService = {
  /**
   * Atomically reserve stock for an array of order items
   */
  reserveStock: async (items) => {
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product '${item.name}' not found.`);
      }

      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (!variant) {
          throw new Error(`Variant for '${item.name}' no longer exists.`);
        }
        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for '${item.name} (${variant.variantName})'. Available: ${variant.stock}`);
        }
        variant.stock -= item.quantity;
      } else {
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for '${product.name}'. Available: ${product.stock}`);
        }
        product.stock -= item.quantity;
      }

      product.soldCount += item.quantity;
      await product.save();
    }
  },

  /**
   * Release and restore stock when an order is cancelled
   */
  releaseStock: async (items) => {
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (variant) {
          variant.stock += item.quantity;
        }
      } else {
        product.stock += item.quantity;
      }

      product.soldCount = Math.max(0, product.soldCount - item.quantity);
      await product.save();
    }
  },

  /**
   * Get products that are running low on stock (< lowStockThreshold)
   */
  getLowStockAlerts: async () => {
    const products = await Product.find({
      status: 'published',
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    }).select('name sku stock lowStockThreshold images price');

    return products;
  }
};
