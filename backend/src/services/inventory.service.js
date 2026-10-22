import { Product } from '../models/Product.js';

export const inventoryService = {
  /**
   * Release and restore stock for a single item atomically
   */
  releaseSingleItem: async (item) => {
    try {
      const productId = item.product?._id || item.product || item.productId;
      const variantId = item.variantId?._id || item.variantId || null;
      const quantity = Number(item.quantity);
      if (!productId || isNaN(quantity) || quantity <= 0) return;

      if (variantId) {
        await Product.findOneAndUpdate(
          {
            _id: productId,
            'variants._id': variantId,
          },
          {
            $inc: {
              'variants.$.stock': quantity,
              soldCount: -quantity,
            },
          }
        );
      } else {
        await Product.findOneAndUpdate(
          { _id: productId },
          {
            $inc: {
              stock: quantity,
              soldCount: -quantity,
            },
          }
        );
      }
    } catch (err) {
      console.error(`Error restoring stock for item '${item.name || item.product}':`, err.message);
    }
  },

  /**
   * Atomically reserve stock for an array of order items
   * NP-SEC-04: Atomic conditional reservation with automatic compensating rollback
   */
  reserveStock: async (items) => {
    if (!items || !items.length) return;

    const reservedSoFar = [];

    try {
      for (const item of items) {
        const productId = item.product?._id || item.product || item.productId;
        const variantId = item.variantId?._id || item.variantId || null;
        const quantity = Number(item.quantity);

        if (!productId) {
          throw new Error('Product reference missing in reservation item.');
        }

        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Invalid reservation quantity for item '${item.name || productId}'.`);
        }

        let updatedProduct = null;

        if (variantId) {
          // Atomic conditional update on variant stock
          updatedProduct = await Product.findOneAndUpdate(
            {
              _id: productId,
              'variants._id': variantId,
              'variants.stock': { $gte: quantity },
            },
            {
              $inc: {
                'variants.$.stock': -quantity,
                soldCount: quantity,
              },
            },
            { new: true }
          );
        } else {
          // Atomic conditional update on product stock
          updatedProduct = await Product.findOneAndUpdate(
            {
              _id: productId,
              stock: { $gte: quantity },
            },
            {
              $inc: {
                stock: -quantity,
                soldCount: quantity,
              },
            },
            { new: true }
          );
        }

        if (!updatedProduct) {
          // Identify specific cause of failure for descriptive error
          const existing = await Product.findById(productId);
          if (!existing) {
            throw new Error(`Product '${item.name || productId}' not found.`);
          }

          if (item.variantId) {
            const variant = existing.variants?.id(item.variantId);
            if (!variant) {
              throw new Error(`Variant for '${item.name || existing.name}' no longer exists.`);
            }
            throw new Error(`Insufficient stock for '${item.name || existing.name} (${variant.variantName})'. Available: ${variant.stock}`);
          } else {
            throw new Error(`Insufficient stock for '${existing.name}'. Available: ${existing.stock}`);
          }
        }

        reservedSoFar.push(item);
      }
    } catch (error) {
      // Compensating rollback for all items reserved prior to failure
      for (const reservedItem of reservedSoFar) {
        await inventoryService.releaseSingleItem(reservedItem);
      }
      throw error;
    }
  },

  /**
   * Release and restore stock when an order is cancelled or rolled back
   * NP-SEC-04 / NP-SEC-05: Atomic stock release
   */
  releaseStock: async (items) => {
    if (!items || !items.length) return;
    for (const item of items) {
      await inventoryService.releaseSingleItem(item);
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
