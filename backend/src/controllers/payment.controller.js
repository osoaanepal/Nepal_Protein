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
      clientCallbackUrl: req.headers.origin,
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

    // Update order status if not already paid (idempotency check)
    if (order.paymentInfo.status !== 'PAID') {
      order.paymentInfo.status = 'PAID';
      order.paymentInfo.transactionId = transactionId;
      order.paymentInfo.transactionUuid = transactionUuid;
      order.paymentInfo.paidAt = new Date();
      order.orderStatus = 'CONFIRMED';
      order.orderTimeline.push({
        status: 'CONFIRMED',
        note: `Payment verified via eSewa (Ref: ${transactionId})`,
        updatedAt: new Date(),
      });
      await order.save();

      // Dispatch order confirmation email
      const customer = await User.findById(order.customer);
      if (customer) {
        emailService.sendOrderConfirmation({ order, user: customer }).catch(() => {});
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully!',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        transactionId,
        grandTotal: order.pricing.grandTotal,
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
