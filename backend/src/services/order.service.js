import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { BusinessSettings } from '../models/BusinessSettings.js';
import { inventoryService } from './inventory.service.js';
import { couponService } from './coupon.service.js';
import { emailService } from './email.service.js';

export const orderService = {
  /**
   * Helper to generate unique order number: NP-YYYYMM-XXXX
   */
  generateOrderNumber: () => {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `NP-${yearMonth}-${randomDigits}`;
  },

  /**
   * Process and create a new order with complete server-side verification
   */
  createOrder: async ({ userId, items, shippingAddress, paymentMethod, couponCode, customerNote }) => {
    if (!items || !items.length) {
      throw new Error('Order must contain at least one product item.');
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.province || !shippingAddress.district || !shippingAddress.municipality || !shippingAddress.ward || !shippingAddress.streetAddress) {
      throw new Error('Please provide complete shipping address details with Nepalese administrative boundaries.');
    }

    // 1. Fetch current business settings for delivery charges
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = await BusinessSettings.create({});
    }

    // 2. Fetch all products from MongoDB and compute authentic prices
    const validatedItems = [];
    let itemsSubtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.status !== 'published') {
        throw new Error(`Product '${item.name || item.productId}' is no longer available.`);
      }

      let unitPrice = product.price;
      let variantName = '';
      let sku = product.sku;

      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (!variant) {
          throw new Error(`Variant for '${product.name}' is no longer available.`);
        }
        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name} (${variant.variantName}). Only ${variant.stock} left.`);
        }
        unitPrice = variant.price;
        variantName = variant.variantName;
        if (variant.sku) sku = variant.sku;
      } else {
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Only ${product.stock} left.`);
        }
      }

      const primaryImage = product.images.find(img => img.isPrimary)?.url || product.images[0]?.url || '';
      const lineSubtotal = unitPrice * item.quantity;
      itemsSubtotal += lineSubtotal;

      validatedItems.push({
        product: product._id,
        variantId: item.variantId || null,
        name: product.name,
        image: primaryImage,
        variantName,
        sku,
        price: unitPrice,
        quantity: item.quantity,
        subtotal: lineSubtotal,
      });
    }

    // 3. Handle Coupon validation if provided
    let couponDiscount = 0;
    let couponApplied = { code: '', discountType: '', discountValue: 0 };
    let couponDocId = null;

    if (couponCode) {
      const couponResult = await couponService.validateCoupon({
        code: couponCode,
        subtotal: itemsSubtotal,
        userId,
      });
      couponDiscount = couponResult.discountAmount;
      couponApplied = {
        code: couponResult.code,
        discountType: couponResult.discountType,
        discountValue: couponResult.discountValue,
      };
      couponDocId = couponResult.couponId;
    }

    // 4. Validate District and Calculate Delivery Fee based on Customer's District
    const selectedDistrict = shippingAddress.district?.trim();
    if (!selectedDistrict) {
      throw new Error('Please select a valid district for delivery.');
    }

    let configuredDeliveryFee = undefined;
    const districtCharges = settings.deliverySettings?.districtCharges;

    if (districtCharges) {
      if (typeof districtCharges.get === 'function') {
        configuredDeliveryFee = districtCharges.get(selectedDistrict);
        if (configuredDeliveryFee === undefined) {
          for (const [dist, fee] of districtCharges.entries()) {
            if (dist.trim().toLowerCase() === selectedDistrict.toLowerCase()) {
              configuredDeliveryFee = fee;
              break;
            }
          }
        }
      } else if (typeof districtCharges === 'object') {
        configuredDeliveryFee = districtCharges[selectedDistrict];
        if (configuredDeliveryFee === undefined) {
          for (const [dist, fee] of Object.entries(districtCharges)) {
            if (dist.trim().toLowerCase() === selectedDistrict.toLowerCase()) {
              configuredDeliveryFee = fee;
              break;
            }
          }
        }
      }
    }

    if (
      configuredDeliveryFee === undefined ||
      configuredDeliveryFee === null ||
      configuredDeliveryFee === '' ||
      isNaN(Number(configuredDeliveryFee)) ||
      Number(configuredDeliveryFee) < 0
    ) {
      throw new Error(`Delivery is currently unavailable for ${selectedDistrict}. No delivery fee has been configured for this district.`);
    }

    // Apply delivery fee ONCE per order, regardless of number of products or quantities
    const deliveryFee = Number(configuredDeliveryFee);
    const discountedSubtotal = Math.max(0, itemsSubtotal - couponDiscount);
    const grandTotal = discountedSubtotal + deliveryFee;
    const orderNumber = orderService.generateOrderNumber();

    // 5. Reserve Inventory
    await inventoryService.reserveStock(validatedItems);

    // 6. Record Coupon usage
    if (couponDocId) {
      await couponService.recordUsage(couponDocId, userId);
    }

    // 7. Create Order in Database
    const order = await Order.create({
      orderNumber,
      customer: userId,
      items: validatedItems,
      pricing: {
        itemsSubtotal,
        couponDiscount,
        deliveryFee,
        grandTotal,
      },
      couponApplied,
      shippingAddress,
      paymentInfo: {
        method: paymentMethod,
        status: 'PENDING',
        transactionId: '',
        paidAt: null,
      },
      orderStatus: 'PENDING',
      orderTimeline: [{
        status: 'PENDING',
        note: `Order placed via ${paymentMethod}`,
        updatedAt: new Date(),
      }],
      customerNote: customerNote || '',
    });

    return order;
  },

  /**
   * Cancel order and restore stock
   */
  cancelOrder: async (orderId, userId, reason = 'Cancelled by customer') => {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    if (userId && order.customer.toString() !== userId.toString()) {
      throw new Error('Not authorized to cancel this order');
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.orderStatus)) {
      throw new Error(`Order cannot be cancelled because it is already in '${order.orderStatus}' state.`);
    }

    // Restore stock
    await inventoryService.releaseStock(order.items);

    order.orderStatus = 'CANCELLED';
    order.orderTimeline.push({
      status: 'CANCELLED',
      note: reason,
      updatedAt: new Date(),
    });

    await order.save();
    return order;
  }
};
