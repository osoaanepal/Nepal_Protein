import { orderService } from '../services/order.service.js';
import { paymentService } from '../services/payment.service.js';
import { Order } from '../models/Order.js';
import { emailService } from '../services/email.service.js';
import { getPaginationParams, buildPaginationMetadata } from '../utils/pagination.js';
import { maskName, maskPhone } from '../utils/security.js';

export const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode, customerNote } = req.body;

    const order = await orderService.createOrder({
      userId: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      couponCode,
      customerNote,
    });

    // If eSewa selected, generate eSewa payment form data
    let paymentPayload = null;
    if (paymentMethod === 'ESEWA') {
      paymentPayload = await paymentService.createEsewaPaymentPayload({
        order,
      });
    } else if (paymentMethod === 'COD') {
      // Send confirmation email asynchronously
      emailService.sendOrderConfirmation({ order, user: req.user }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
        paymentPayload,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query, {
      defaultLimit: 10,
      maxLimit: 50,
    });

    const [orders, total] = await Promise.all([
      Order.find({ customer: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ customer: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: buildPaginationMetadata(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name email phone');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization: customer can view their own, admin can view all
    if (req.user.role !== 'admin' && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const cancelMyOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await orderService.cancelOrder(req.params.id, req.user._id, reason);
    res.status(200).json({ success: true, message: 'Order has been cancelled', data: order });
  } catch (error) {
    next(error);
  }
};

export const trackOrderByNumber = async (req, res, next) => {
  try {
    const { orderNumber, phone } = req.query;
    if (!orderNumber || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide both Order Number and Phone Number.' });
    }

    const order = await Order.findOne({
      orderNumber: orderNumber.trim(),
      'shippingAddress.phone': phone.trim(),
    }).select('orderNumber orderStatus orderTimeline pricing shippingAddress paymentInfo createdAt');

    if (!order) {
      return res.status(404).json({ success: false, message: 'No matching order found with the provided details.' });
    }

    // NP-SEC-12: Mask sensitive customer PII in public tracking payload
    const maskedTrackingData = {
      _id: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      orderTimeline: order.orderTimeline,
      createdAt: order.createdAt,
      pricing: {
        grandTotal: order.pricing?.grandTotal,
      },
      paymentInfo: {
        method: order.paymentInfo?.method,
        status: order.paymentInfo?.status,
      },
      shippingAddress: {
        fullName: maskName(order.shippingAddress?.fullName),
        phone: maskPhone(order.shippingAddress?.phone),
        streetAddress: '*** Protected for Privacy ***',
        ward: order.shippingAddress?.ward,
        municipality: order.shippingAddress?.municipality,
        district: order.shippingAddress?.district,
        province: order.shippingAddress?.province,
      },
    };

    res.status(200).json({ success: true, data: maskedTrackingData });
  } catch (error) {
    next(error);
  }
};
