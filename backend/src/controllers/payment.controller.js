import { paymentService } from '../services/payment.service.js';
import { Order } from '../models/Order.js';
import { emailService } from '../services/email.service.js';
import { User } from '../models/User.js';

export const initiateEsewa = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const payload = await paymentService.createEsewaPaymentPayload({
      order,
    });

    res.status(200).json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
};

export const verifyEsewa = async (req, res, next) => {
  try {
    const { data } = req.body; // Encoded base64 payload from eSewa

    if (!data) {
      return res.status(400).json({ success: false, message: 'Missing payment response data.' });
    }

    const verificationResult = await paymentService.verifyEsewaTransaction({
      encodedResponseData: data,
    });

    const transactionUuid = verificationResult.transactionUuid;
    const baseOrderNumber = transactionUuid ? transactionUuid.replace(/-\d+(-\d+)?$/, '') : '';

    let order = null;
    if (transactionUuid) {
      order = await Order.findOne({
        $or: [
          { 'paymentInfo.transactionUuid': transactionUuid },
          { orderNumber: transactionUuid },
          ...(baseOrderNumber ? [{ orderNumber: baseOrderNumber }] : []),
        ],
      });
    }

    if (!verificationResult.isVerified) {
      return res.status(400).json({
        success: false,
        isUnavailable: !!verificationResult.isUnavailable,
        message: verificationResult.message || 'Payment verification failed.',
        orderId: order?._id,
        orderNumber: order?.orderNumber,
      });
    }

    const { transactionId, totalAmount } = verificationResult;

    if (!order) {
      return res.status(404).json({ success: false, message: 'Associated order not found for this transaction.' });
    }

    // Verify exact grand total match
    if (Math.round(order.pricing.grandTotal) !== Math.round(totalAmount)) {
      return res.status(400).json({
        success: false,
        message: `Payment amount mismatch. Expected: Rs. ${order.pricing.grandTotal}, Received: Rs. ${totalAmount}`,
        orderId: order._id,
        orderNumber: order.orderNumber,
      });
    }

    // NP-SEC-03: Prevent duplicate transaction IDs across different orders
    const existingTxOrder = await Order.findOne({
      _id: { $ne: order._id },
      'paymentInfo.transactionId': transactionId,
    });
    if (existingTxOrder) {
      return res.status(400).json({
        success: false,
        message: `Duplicate transaction ID detected. Transaction ${transactionId} has already been recorded for another order.`,
        orderId: order._id,
        orderNumber: order.orderNumber,
      });
    }

    // NP-SEC-03: Handle idempotent repeated callbacks for the already-paid order
    if (order.paymentInfo?.status === 'PAID') {
      if (order.paymentInfo.transactionId === transactionId) {
        return res.status(200).json({
          success: true,
          message: 'Payment already verified for this order.',
          data: {
            orderId: order._id,
            orderNumber: order.orderNumber,
            transactionId,
            grandTotal: order.pricing.grandTotal,
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'This order has already been paid with a different transaction ID.',
          orderId: order._id,
          orderNumber: order.orderNumber,
        });
      }
    }

    // NP-SEC-03: Atomic state update to prevent race conditions from concurrent callbacks
    let updatedOrder;
    try {
      updatedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          'paymentInfo.status': { $ne: 'PAID' },
        },
        {
          $set: {
            'paymentInfo.status': 'PAID',
            'paymentInfo.transactionId': transactionId,
            'paymentInfo.transactionUuid': transactionUuid,
            'paymentInfo.paidAt': new Date(),
            orderStatus: 'CONFIRMED',
          },
          $push: {
            orderTimeline: {
              status: 'CONFIRMED',
              note: `Payment verified via eSewa (Ref: ${transactionId})`,
              updatedAt: new Date(),
            },
          },
        },
        { new: true }
      );
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return res.status(400).json({
          success: false,
          message: `Duplicate transaction ID detected: ${transactionId}. This payment was already recorded.`,
          orderId: order._id,
          orderNumber: order.orderNumber,
        });
      }
      throw dbErr;
    }

    if (!updatedOrder) {
      // Another concurrent callback updated the order simultaneously
      const freshOrder = await Order.findById(order._id);
      if (freshOrder && freshOrder.paymentInfo?.transactionId === transactionId) {
        return res.status(200).json({
          success: true,
          message: 'Payment already verified for this order.',
          data: {
            orderId: freshOrder._id,
            orderNumber: freshOrder.orderNumber,
            transactionId,
            grandTotal: freshOrder.pricing.grandTotal,
          },
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Order status conflict: payment could not be processed.',
      });
    }

    // Dispatch order confirmation email
    const customer = await User.findById(updatedOrder.customer);
    if (customer) {
      emailService.sendOrderConfirmation({ order: updatedOrder, user: customer }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully!',
      data: {
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        transactionId,
        grandTotal: updatedOrder.pricing.grandTotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const switchToCod = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (order.paymentInfo.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'This order is already marked as paid.' });
    }

    if (!['PENDING'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: `Cannot change payment method for order in '${order.orderStatus}' status.` });
    }

    order.paymentInfo.method = 'COD';
    order.paymentInfo.status = 'PENDING';
    order.orderTimeline.push({
      status: 'PENDING',
      note: 'Payment method switched to Cash on Delivery (COD) following payment gateway issue',
      updatedAt: new Date(),
    });
    await order.save();

    // Dispatch order confirmation email for COD
    const customer = await User.findById(order.customer);
    if (customer) {
      emailService.sendOrderConfirmation({ order, user: customer }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'Order switched to Cash on Delivery (COD) successfully!',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};
