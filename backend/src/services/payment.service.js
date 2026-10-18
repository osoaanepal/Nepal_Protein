import crypto from 'crypto';
import { ENV } from '../config/env.js';
import { Order } from '../models/Order.js';

export const paymentService = {
  /**
   * Generate eSewa EPAY v2 HMAC-SHA256 Signature
   */
  generateEsewaSignature: ({ totalAmount, transactionUuid, productCode = ENV.ESEWA.PRODUCT_CODE, secretKey = ENV.ESEWA.SECRET_KEY }) => {
    // Exact signature format required by eSewa EPAY v2: total_amount, transaction_uuid, product_code
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(message);
    const signature = hmac.digest('base64');
    return signature;
  },

  /**
   * Prepare eSewa payment form data payload for frontend
   */
  createEsewaPaymentPayload: async ({ order, clientCallbackUrl }) => {
    const totalAmount = Number(order.pricing.grandTotal);
    const couponDiscount = Number(order.pricing.couponDiscount || 0);
    const deliveryFee = Number(order.pricing.deliveryFee || 0);
    const itemsSubtotal = Number(order.pricing.itemsSubtotal);
    
    // Amount calculation strictly matching eSewa equation:
    // total_amount = amount + tax_amount + product_service_charge + product_delivery_charge
    const amount = itemsSubtotal - couponDiscount;
    const taxAmount = 0;
    const serviceCharge = 0;
    const deliveryCharge = deliveryFee;

    // Generate a strictly unique transaction_uuid containing alphanumeric and hyphen (-) only
    const transactionUuid = `${order.orderNumber}-${Date.now()}`;
    const productCode = ENV.ESEWA.PRODUCT_CODE;

    // Persist transactionUuid to order document for tracking and retry support
    try {
      if (order && order._id) {
        if (typeof order.save === 'function') {
          order.paymentInfo.transactionUuid = transactionUuid;
          await order.save();
        } else {
          await Order.findByIdAndUpdate(order._id, { 'paymentInfo.transactionUuid': transactionUuid });
        }
      }
    } catch (saveErr) {
      console.warn('Could not persist transactionUuid to order:', saveErr.message);
    }

    const signature = paymentService.generateEsewaSignature({
      totalAmount,
      transactionUuid,
      productCode,
      secretKey: ENV.ESEWA.SECRET_KEY,
    });

    const clientBase = clientCallbackUrl || ENV.CLIENT_URL;
    const successUrl = `${clientBase}/checkout/payment/esewa-callback`;
    const failureUrl = `${clientBase}/checkout/payment/esewa-callback?failed=true&orderId=${order._id}&orderNumber=${order.orderNumber}`;

    return {
      paymentUrl: ENV.ESEWA.PAYMENT_URL,
      formData: {
        amount: String(amount),
        tax_amount: String(taxAmount),
        total_amount: String(totalAmount),
        transaction_uuid: transactionUuid,
        product_code: productCode,
        product_service_charge: String(serviceCharge),
        product_delivery_charge: String(deliveryCharge),
        success_url: successUrl,
        failure_url: failureUrl,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature,
      },
    };
  },

  /**
   * Server-side eSewa transaction status check and signature verification
   */
  verifyEsewaTransaction: async ({ encodedResponseData }) => {
    try {
      if (!encodedResponseData) {
        return {
          isVerified: false,
          message: 'No encoded transaction response data provided.',
        };
      }

      // Decode Base64 data returned in eSewa callback
      const decodedBuffer = Buffer.from(encodedResponseData, 'base64');
      const decodedString = decodedBuffer.toString('utf-8');
      let decodedJson;

      try {
        decodedJson = JSON.parse(decodedString);
      } catch (parseErr) {
        return {
          isVerified: false,
          message: `Malformed response data from eSewa: ${parseErr.message}`,
        };
      }

      // Check if eSewa returned an error or unavailable status
      if (decodedJson.code === 0 || decodedJson.error_message || (decodedJson.message && /unavailable/i.test(decodedJson.message))) {
        return {
          isVerified: false,
          isUnavailable: true,
          message: decodedJson.error_message || decodedJson.message || 'eSewa payment sandbox service is currently unavailable.',
        };
      }

      const {
        transaction_code,
        status,
        total_amount,
        transaction_uuid,
        product_code = ENV.ESEWA.PRODUCT_CODE,
        signed_field_names,
        signature,
      } = decodedJson;

      if (status !== 'COMPLETE') {
        return {
          isVerified: false,
          status,
          message: `Payment not completed by customer (Status: ${status || 'PENDING/FAILED'})`,
        };
      }

      const cleanTotalAmount = typeof total_amount === 'string'
        ? Number(total_amount.replace(/,/g, ''))
        : Number(total_amount);

      // 1. Verify HMAC-SHA256 signature integrity
      let isSignatureValid = false;
      const secretKey = ENV.ESEWA.SECRET_KEY;

      if (signed_field_names && signature) {
        const fieldNames = signed_field_names.split(',').map((f) => f.trim()).filter(Boolean);
        const message = fieldNames.map((field) => `${field}=${decodedJson[field] !== undefined ? decodedJson[field] : ''}`).join(',');
        const hmac = crypto.createHmac('sha256', secretKey);
        hmac.update(message);
        if (hmac.digest('base64') === signature) {
          isSignatureValid = true;
        }
      }

      // Fallback verification using standard v2 parameter order
      if (!isSignatureValid && signature) {
        const fallbackMessages = [
          `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`,
          `total_amount=${cleanTotalAmount},transaction_uuid=${transaction_uuid},product_code=${product_code}`,
        ];

        for (const msg of fallbackMessages) {
          const hmacFallback = crypto.createHmac('sha256', secretKey);
          hmacFallback.update(msg);
          if (hmacFallback.digest('base64') === signature) {
            isSignatureValid = true;
            break;
          }
        }
      }

      // 2. Query documented eSewa server-to-server transaction status endpoint
      let serverStatusVerified = false;
      let confirmedRefId = transaction_code || null;

      if (ENV.ESEWA.VERIFY_URL) {
        try {
          const verifyUrl = `${ENV.ESEWA.VERIFY_URL}?product_code=${product_code}&total_amount=${cleanTotalAmount}&transaction_uuid=${transaction_uuid}`;
          const response = await fetch(verifyUrl, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000),
          });

          if (response.ok) {
            const apiRes = await response.json();
            if (apiRes) {
              if (apiRes.code === 0 || apiRes.error_message) {
                return {
                  isVerified: false,
                  isUnavailable: true,
                  message: apiRes.error_message || 'eSewa server status check service is currently unavailable.',
                };
              }

              if (apiRes.status === 'COMPLETE' || apiRes.status === 'SUCCESS') {
                serverStatusVerified = true;
                confirmedRefId = apiRes.ref_id || apiRes.refId || confirmedRefId;
              } else if (apiRes.status && ['PENDING', 'CANCELED', 'NOT_FOUND', 'AMBIGUOUS', 'FULL_REFUND', 'PARTIAL_REFUND'].includes(apiRes.status)) {
                return {
                  isVerified: false,
                  status: apiRes.status,
                  message: `eSewa central status check returned unconfirmed status: ${apiRes.status}`,
                };
              }
            }
          }
        } catch (apiErr) {
          console.warn('eSewa server-to-server status check endpoint error:', apiErr.message);
        }
      }

      // Only mark verified if either server status or signature integrity is genuinely confirmed
      if (!isSignatureValid && !serverStatusVerified) {
        return {
          isVerified: false,
          message: 'Payment verification failed: HMAC signature and server status check could not be confirmed.',
        };
      }

      return {
        isVerified: true,
        transactionId: confirmedRefId || transaction_code || `ESEWA-${transaction_uuid}`,
        transactionUuid: transaction_uuid,
        totalAmount: cleanTotalAmount,
      };
    } catch (error) {
      return {
        isVerified: false,
        message: `Error verifying eSewa transaction: ${error.message}`,
      };
    }
  }
};
