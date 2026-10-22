import crypto from 'crypto';
import { ENV } from '../config/env.js';
import { paymentService } from '../services/payment.service.js';
import { inventoryService } from '../services/inventory.service.js';
import { couponService } from '../services/coupon.service.js';
import { orderService } from '../services/order.service.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Coupon } from '../models/Coupon.js';
import { verifyEsewa } from '../controllers/payment.controller.js';

console.log('====================================================');
console.log('Nepal Protein Phase 2 Security Remediation Validation');
console.log('====================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
  }
}

async function runTests() {
  // ====================================================
  // GROUP 1: NP-SEC-09: Trusted Payment Callback URLs
  // ====================================================
  console.log('\n--- NP-SEC-09: Trusted Payment Callback URLs ---');

  const mockOrder = {
    _id: '507f1f77bcf86cd799439011',
    orderNumber: 'NP-202610-100001',
    pricing: {
      itemsSubtotal: 1500,
      couponDiscount: 100,
      deliveryFee: 100,
      grandTotal: 1500,
    },
    paymentInfo: {
      transactionUuid: '',
    },
    save: async function () { return this; },
  };

  const payload = await paymentService.createEsewaPaymentPayload({
    order: mockOrder,
    clientCallbackUrl: 'https://malicious-attacker.com', // Should be strictly ignored
  });

  const expectedBase = (ENV.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
  assert(payload.formData.success_url.startsWith(expectedBase), `success_url uses trusted ENV.CLIENT_URL (${payload.formData.success_url})`);
  assert(!payload.formData.success_url.includes('malicious-attacker.com'), 'Ignored attacker-supplied clientCallbackUrl / Origin header');
  assert(payload.formData.failure_url.startsWith(expectedBase), `failure_url uses trusted ENV.CLIENT_URL`);
  assert(payload.formData.signed_field_names === 'total_amount,transaction_uuid,product_code', 'Signed field names formatted per eSewa EPAY v2 spec');

  // ====================================================
  // GROUP 2: NP-SEC-03: eSewa Signature & Verification Security
  // ====================================================
  console.log('\n--- NP-SEC-03: eSewa Signature Verification & Status Check ---');

  const validTxUuid = `NP-202610-100001-${Date.now()}`;
  const validTotalAmount = 1500;
  const validProductCode = ENV.ESEWA.PRODUCT_CODE;
  const validSignature = paymentService.generateEsewaSignature({
    totalAmount: validTotalAmount,
    transactionUuid: validTxUuid,
    productCode: validProductCode,
    secretKey: ENV.ESEWA.SECRET_KEY,
  });

  // Test 1: Valid signature matches
  assert(Boolean(validSignature), 'Generated valid HMAC-SHA256 signature');

  // Test 2: Rejects malformed Base64 data
  const resBadBase64 = await paymentService.verifyEsewaTransaction({
    encodedResponseData: '',
  });
  assert(!resBadBase64.isVerified, 'Rejects empty response data');

  // Test 3: Rejects malformed JSON
  const invalidJsonBase64 = Buffer.from('{ invalid json string ...').toString('base64');
  const resBadJson = await paymentService.verifyEsewaTransaction({
    encodedResponseData: invalidJsonBase64,
  });
  assert(!resBadJson.isVerified, 'Rejects malformed JSON in eSewa response payload');

  // Test 4: Rejects status !== COMPLETE
  const pendingPayload = {
    transaction_code: 'TX123456',
    status: 'PENDING',
    total_amount: validTotalAmount,
    transaction_uuid: validTxUuid,
    product_code: validProductCode,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature: validSignature,
  };
  const resPending = await paymentService.verifyEsewaTransaction({
    encodedResponseData: Buffer.from(JSON.stringify(pendingPayload)).toString('base64'),
  });
  assert(!resPending.isVerified && resPending.message.includes('not completed'), 'Rejects payment with non-COMPLETE status');

  // Test 5: Rejects tampered / invalid HMAC signature
  const tamperedPayload = {
    transaction_code: 'TX123456',
    status: 'COMPLETE',
    total_amount: 100, // Tampered amount (expected 1500)
    transaction_uuid: validTxUuid,
    product_code: validProductCode,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature: validSignature, // Signature was for 1500
  };
  const resTampered = await paymentService.verifyEsewaTransaction({
    encodedResponseData: Buffer.from(JSON.stringify(tamperedPayload)).toString('base64'),
  });
  assert(!resTampered.isVerified && resTampered.message.includes('HMAC signature verification failed'), 'Rejects payment with tampered amount / signature mismatch');

  // Test 6: Timing-safe verification against forged length
  const fakeSigPayload = {
    transaction_code: 'TX123456',
    status: 'COMPLETE',
    total_amount: validTotalAmount,
    transaction_uuid: validTxUuid,
    product_code: validProductCode,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature: 'bad-sig',
  };
  const resFakeSig = await paymentService.verifyEsewaTransaction({
    encodedResponseData: Buffer.from(JSON.stringify(fakeSigPayload)).toString('base64'),
  });
  assert(!resFakeSig.isVerified, 'Timing-safe comparison safely rejects invalid length signature without throwing error');

  // Test 7: Central status check verification when server status check returns unconfirmed status
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      status: 'CANCELED',
      ref_id: 'TX123456',
    }),
  });

  const validPayload = {
    transaction_code: 'TX123456',
    status: 'COMPLETE',
    total_amount: validTotalAmount,
    transaction_uuid: validTxUuid,
    product_code: validProductCode,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature: validSignature,
  };

  const resUnconfirmedServer = await paymentService.verifyEsewaTransaction({
    encodedResponseData: Buffer.from(JSON.stringify(validPayload)).toString('base64'),
  });
  assert(!resUnconfirmedServer.isVerified && resUnconfirmedServer.message.includes('unconfirmed status'), 'Rejects payment when central status check returns CANCELED');

  // Test 8: Central status check server failure / HTTP error
  global.fetch = async () => ({
    ok: false,
    status: 502,
  });
  const resServerHttpErr = await paymentService.verifyEsewaTransaction({
    encodedResponseData: Buffer.from(JSON.stringify(validPayload)).toString('base64'),
  });
  assert(!resServerHttpErr.isVerified && resServerHttpErr.message.includes('HTTP 502'), 'Rejects payment when eSewa server returns HTTP error');

  // Test 9: Complete success when both signature and server status check confirm COMPLETE
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      status: 'COMPLETE',
      ref_id: 'CONFIRMED-REF-999',
    }),
  });
  const resSuccess = await paymentService.verifyEsewaTransaction({
    encodedResponseData: Buffer.from(JSON.stringify(validPayload)).toString('base64'),
  });
  assert(resSuccess.isVerified && resSuccess.transactionId === 'CONFIRMED-REF-999', 'Accepts payment when both HMAC signature and server status check confirm COMPLETE');

  // Restore global.fetch
  global.fetch = originalFetch;

  // ================================= group 3 ====================================
  // GROUP 3: NP-SEC-03: Controller Replay & Duplicate Transaction Protection
  // ==============================================================================
  console.log('\n--- NP-SEC-03: Controller Replay & Duplicate Protection ---');

  // Mock Order Model
  const origOrderFindOne = Order.findOne;
  const origOrderFindOneAndUpdate = Order.findOneAndUpdate;
  const origOrderFindById = Order.findById;

  const mockDbOrders = [
    {
      _id: 'order_1',
      orderNumber: 'NP-202610-100001',
      customer: 'user_1',
      pricing: { grandTotal: 1500 },
      paymentInfo: { status: 'PENDING', transactionId: '', transactionUuid: validTxUuid },
      orderStatus: 'PENDING',
      orderTimeline: [],
    },
    {
      _id: 'order_2',
      orderNumber: 'NP-202610-100002',
      customer: 'user_2',
      pricing: { grandTotal: 2500 },
      paymentInfo: { status: 'PAID', transactionId: 'TX_ALREADY_USED', transactionUuid: 'uuid_2' },
      orderStatus: 'CONFIRMED',
      orderTimeline: [],
    },
  ];

  Order.findOne = async (query) => {
    if (query['paymentInfo.transactionId'] === 'TX_ALREADY_USED') {
      return mockDbOrders[1];
    }
    if (query.$or) {
      return mockDbOrders[0];
    }
    return null;
  };

  Order.findById = async (id) => mockDbOrders.find((o) => o._id === id);

  // Stub paymentService.verifyEsewaTransaction to return confirmed response
  const origVerifyEsewaTx = paymentService.verifyEsewaTransaction;
  paymentService.verifyEsewaTransaction = async () => ({
    isVerified: true,
    transactionId: 'TX_ALREADY_USED',
    transactionUuid: validTxUuid,
    totalAmount: 1500,
  });

  // Test: Duplicate transactionId detection across orders
  let responseStatus = 0;
  let responseData = null;
  const mockRes = {
    status: (code) => {
      responseStatus = code;
      return {
        json: (data) => { responseData = data; },
      };
    },
  };

  await verifyEsewa({ body: { data: 'dummy_encoded_data' } }, mockRes, () => {});
  assert(responseStatus === 400 && responseData?.message?.includes('Duplicate transaction ID detected'), 'Rejects payment when transaction ID is already used on another order');

  // Test: Amount mismatch
  paymentService.verifyEsewaTransaction = async () => ({
    isVerified: true,
    transactionId: 'TX_UNIQUE_NEW',
    transactionUuid: validTxUuid,
    totalAmount: 999, // Mismatched amount
  });
  await verifyEsewa({ body: { data: 'dummy_encoded_data' } }, mockRes, () => {});
  assert(responseStatus === 400 && responseData?.message?.includes('Payment amount mismatch'), 'Rejects payment when paid amount does not match order grand total');

  // Test: Idempotent repeat callback on already-paid order
  mockDbOrders[0].paymentInfo.status = 'PAID';
  mockDbOrders[0].paymentInfo.transactionId = 'TX_PAID_PREVIOUSLY';
  paymentService.verifyEsewaTransaction = async () => ({
    isVerified: true,
    transactionId: 'TX_PAID_PREVIOUSLY',
    transactionUuid: validTxUuid,
    totalAmount: 1500,
  });
  await verifyEsewa({ body: { data: 'dummy_encoded_data' } }, mockRes, () => {});
  assert(responseStatus === 200 && responseData?.message?.includes('already verified'), 'Idempotently returns 200 on repeat callback for already-paid order');

  // Test: Reject repeat callback if order is paid under a different transaction ID
  paymentService.verifyEsewaTransaction = async () => ({
    isVerified: true,
    transactionId: 'TX_DIFFERENT_NOW',
    transactionUuid: validTxUuid,
    totalAmount: 1500,
  });
  await verifyEsewa({ body: { data: 'dummy_encoded_data' } }, mockRes, () => {});
  assert(responseStatus === 400 && responseData?.message?.includes('different transaction ID'), 'Rejects payment if order is already marked paid under a different transaction ID');

  // Reset Order stubs
  Order.findOne = origOrderFindOne;
  Order.findOneAndUpdate = origOrderFindOneAndUpdate;
  Order.findById = origOrderFindById;
  paymentService.verifyEsewaTransaction = origVerifyEsewaTx;

  // ================================= group 4 ====================================
  // GROUP 4: NP-SEC-04: Atomic Inventory Reservation & Compensating Rollback
  // ==============================================================================
  console.log('\n--- NP-SEC-04: Atomic Inventory Reservation & Safe Rollback ---');

  const origProductFindOneAndUpdate = Product.findOneAndUpdate;
  const origProductFindById = Product.findById;

  // In-memory product state
  let productAStock = 1; // Only 1 unit available
  let productASold = 0;
  let productBStock = 5;
  let productBSold = 0;
  let variantCStock = 2;
  let variantCSold = 0;

  Product.findById = async (id) => {
    if (id === 'prod_A') return { _id: 'prod_A', name: 'Product A', stock: productAStock };
    if (id === 'prod_B') return { _id: 'prod_B', name: 'Product B', stock: productBStock };
    if (id === 'prod_C') {
      return {
        _id: 'prod_C',
        name: 'Product C',
        variants: [{ id: () => ({ _id: 'var_C', variantName: '1kg', stock: variantCStock }) }],
      };
    }
    return null;
  };

  Product.findOneAndUpdate = async (query, update, options) => {
    if (query._id === 'prod_A') {
      if (query.stock && query.stock.$gte !== undefined) {
        if (productAStock >= query.stock.$gte) {
          productAStock += update.$inc.stock;
          productASold += update.$inc.soldCount;
          return { _id: 'prod_A', stock: productAStock, soldCount: productASold };
        }
        return null; // Condition not met (insufficient stock)
      }
      // Release
      if (update.$inc?.stock) {
        productAStock += update.$inc.stock;
        productASold += (update.$inc.soldCount || 0);
        return { _id: 'prod_A', stock: productAStock, soldCount: productASold };
      }
    }
    if (query._id === 'prod_B') {
      if (query.stock && query.stock.$gte !== undefined) {
        if (productBStock >= query.stock.$gte) {
          productBStock += update.$inc.stock;
          productBSold += update.$inc.soldCount;
          return { _id: 'prod_B', stock: productBStock, soldCount: productBSold };
        }
        return null;
      }
      // Release
      if (update.$inc?.stock) {
        productBStock += update.$inc.stock;
        productBSold += (update.$inc.soldCount || 0);
        return { _id: 'prod_B', stock: productBStock, soldCount: productBSold };
      }
    }
    if (query._id === 'prod_C' && query['variants._id'] === 'var_C') {
      if (query['variants.stock'] && query['variants.stock'].$gte !== undefined) {
        if (variantCStock >= query['variants.stock'].$gte) {
          variantCStock += update.$inc['variants.$.stock'];
          variantCSold += update.$inc.soldCount;
          return { _id: 'prod_C', variantStock: variantCStock };
        }
        return null;
      }
      if (update.$inc?.['variants.$.stock']) {
        variantCStock += update.$inc['variants.$.stock'];
        variantCSold += (update.$inc.soldCount || 0);
        return { _id: 'prod_C', variantStock: variantCStock };
      }
    }
    return null;
  };

  // Test: Simultaneous attempts to reserve last unit (productAStock = 1)
  const req1 = inventoryService.reserveStock([{ product: 'prod_A', name: 'Product A', quantity: 1 }]);
  const req2 = inventoryService.reserveStock([{ product: 'prod_A', name: 'Product A', quantity: 1 }]);

  const results = await Promise.allSettled([req1, req2]);
  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  assert(succeeded === 1, 'Exactly one concurrent request succeeded in reserving the last stock unit');
  assert(failed === 1, 'The competing concurrent reservation failed with insufficient stock');
  assert(productAStock === 0, 'Final stock for Product A is exactly 0 (no negative stock)');
  assert(productASold === 1, 'Product A soldCount incremented exactly once');

  // Test: Multi-item rollback on partial failure
  // Reset stocks: Product B = 5 (wants 2), Product A = 0 (wants 1 -> will fail)
  productBStock = 5;
  productBSold = 0;
  productAStock = 0;

  let rollbackError = null;
  try {
    await inventoryService.reserveStock([
      { product: 'prod_B', name: 'Product B', quantity: 2 }, // Will succeed initially
      { product: 'prod_A', name: 'Product A', quantity: 1 }, // Will fail (stock is 0)
    ]);
  } catch (err) {
    rollbackError = err;
  }

  assert(Boolean(rollbackError), 'Multi-item reservation failed due to insufficient stock in second item');
  assert(productBStock === 5, 'Compensating rollback restored Product B stock back to initial 5 (not decremented)');
  assert(productBSold === 0, 'Compensating rollback restored Product B soldCount back to 0');

  // Test: Variant atomic reservation and rollback
  let varError = null;
  try {
    await inventoryService.reserveStock([
      { product: 'prod_C', variantId: 'var_C', name: 'Product C', quantity: 2 }, // succeeds (2 left)
      { product: 'prod_A', name: 'Product A', quantity: 1 }, // fails
    ]);
  } catch (err) {
    varError = err;
  }
  assert(Boolean(varError), 'Variant reservation rolled back when downstream item failed');
  assert(variantCStock === 2, 'Variant stock restored to initial 2 after rollback');

  // Reset Product stubs
  Product.findOneAndUpdate = origProductFindOneAndUpdate;
  Product.findById = origProductFindById;

  // ================================= group 5 ====================================
  // GROUP 5: NP-SEC-05: Secure Order Cancellation & Preventing Duplicate Restoration
  // ==============================================================================
  console.log('\n--- NP-SEC-05: Secure Order Cancellation & Guarded Transitions ---');

  const origOrderFindById2 = Order.findById;
  const origOrderFindOneAndUpdate2 = Order.findOneAndUpdate;
  const origReleaseStock = inventoryService.releaseStock;

  let cancelOrderStock = 10;
  let releaseCalls = 0;

  inventoryService.releaseStock = async (items) => {
    releaseCalls++;
    cancelOrderStock += items[0].quantity;
  };

  const testOrderToCancel = {
    _id: 'order_cancel_1',
    customer: 'user_123',
    orderStatus: 'PENDING',
    paymentInfo: { status: 'PENDING' },
    items: [{ product: 'prod_X', name: 'Product X', quantity: 5 }],
  };

  Order.findById = async () => testOrderToCancel;

  // Test: Reject cancellation for paid orders
  testOrderToCancel.paymentInfo.status = 'PAID';
  let paidCancelErr = null;
  try {
    await orderService.cancelOrder('order_cancel_1', 'user_123', 'Testing paid order cancel');
  } catch (err) {
    paidCancelErr = err;
  }
  assert(Boolean(paidCancelErr) && paidCancelErr.message.includes('Paid orders cannot be cancelled directly'), 'Rejects customer cancellation for PAID order');
  assert(releaseCalls === 0, 'Stock was not released for paid order cancellation attempt');

  // Test: Reject cancellation for non-pending orders (e.g. SHIPPED)
  testOrderToCancel.paymentInfo.status = 'PENDING';
  testOrderToCancel.orderStatus = 'SHIPPED';
  let shippedCancelErr = null;
  try {
    await orderService.cancelOrder('order_cancel_1', 'user_123', 'Testing shipped cancel');
  } catch (err) {
    shippedCancelErr = err;
  }
  assert(Boolean(shippedCancelErr) && shippedCancelErr.message.includes('already in \'SHIPPED\' state'), 'Rejects cancellation for SHIPPED orders');

  // Test: Concurrent cancellation of pending order prevents duplicate stock restoration
  testOrderToCancel.orderStatus = 'PENDING';
  testOrderToCancel.paymentInfo.status = 'PENDING';

  // Atomic state guard: exactly one findOneAndUpdate call where orderStatus is PENDING will transition
  let orderStateInDb = 'PENDING';
  Order.findOneAndUpdate = async (query, update, options) => {
    if (query._id === 'order_cancel_1' && query.orderStatus === 'PENDING' && query['paymentInfo.status'].$ne === 'PAID') {
      if (orderStateInDb === 'PENDING') {
        orderStateInDb = 'CANCELLED';
        return {
          ...testOrderToCancel,
          orderStatus: 'CANCELLED',
        };
      }
    }
    return null; // Already cancelled by concurrent caller
  };

  const cancelReq1 = orderService.cancelOrder('order_cancel_1', 'user_123', 'Concurrent cancel 1');
  const cancelReq2 = orderService.cancelOrder('order_cancel_1', 'user_123', 'Concurrent cancel 2');
  const cancelReq3 = orderService.cancelOrder('order_cancel_1', 'user_123', 'Concurrent cancel 3');

  const cancelResults = await Promise.allSettled([cancelReq1, cancelReq2, cancelReq3]);
  const cancelSucceeded = cancelResults.filter((r) => r.status === 'fulfilled').length;
  const cancelFailed = cancelResults.filter((r) => r.status === 'rejected').length;

  assert(cancelSucceeded === 1, 'Exactly one concurrent cancellation request succeeded');
  assert(cancelFailed === 2, 'Subsequent concurrent cancellation requests were rejected');
  assert(releaseCalls === 1, 'Stock was restored exactly ONCE (releaseCalls === 1)');
  assert(cancelOrderStock === 15, 'Stock restored by exactly 5 units (10 -> 15), no duplicate stock restoration');

  // Reset cancellation stubs
  Order.findById = origOrderFindById2;
  Order.findOneAndUpdate = origOrderFindOneAndUpdate2;
  inventoryService.releaseStock = origReleaseStock;

  // ================================= group 6 ====================================
  // GROUP 6: NP-SEC-16: Atomic Coupon Usage Limits
  // ==============================================================================
  console.log('\n--- NP-SEC-16: Atomic Coupon Usage Limits ---');

  const origCouponFindById = Coupon.findById;
  const origCouponFindOneAndUpdate = Coupon.findOneAndUpdate;

  let couponUsedCount = 0;
  const mockCoupon = {
    _id: 'coupon_single_use',
    code: 'SINGLEUSE',
    isActive: true,
    usageLimit: 1, // Only 1 total use permitted
    usedCount: 0,
    perUserLimit: 1,
    endDate: new Date(Date.now() + 86400000),
    usedBy: [],
  };

  Coupon.findById = async () => ({ ...mockCoupon, usedCount: couponUsedCount });

  Coupon.findOneAndUpdate = async (query, update, options) => {
    if (query._id === 'coupon_single_use') {
      if (query.usedCount && query.usedCount.$lt !== undefined) {
        if (couponUsedCount < query.usedCount.$lt) {
          couponUsedCount += update.$inc.usedCount;
          mockCoupon.usedBy.push(update.$push.usedBy);
          return { ...mockCoupon, usedCount: couponUsedCount };
        }
        return null; // Usage limit reached
      }
      if (query.usedCount && query.usedCount.$gt !== undefined) {
        if (couponUsedCount > 0) {
          couponUsedCount += update.$inc.usedCount;
          return { ...mockCoupon, usedCount: couponUsedCount };
        }
        return null;
      }
      if (update.$inc?.usedCount) {
        couponUsedCount += update.$inc.usedCount;
        return { ...mockCoupon, usedCount: couponUsedCount };
      }
    }
    return null;
  };

  // Test: Concurrent redemption of coupon with usageLimit = 1
  const coupReq1 = couponService.recordUsage('coupon_single_use', 'user_A');
  const coupReq2 = couponService.recordUsage('coupon_single_use', 'user_B');
  const coupReq3 = couponService.recordUsage('coupon_single_use', 'user_C');

  const coupResults = await Promise.allSettled([coupReq1, coupReq2, coupReq3]);
  const coupSucceeded = coupResults.filter((r) => r.status === 'fulfilled').length;
  const coupFailed = coupResults.filter((r) => r.status === 'rejected').length;

  assert(coupSucceeded === 1, 'Exactly one concurrent request succeeded in redeeming single-use coupon');
  assert(coupFailed === 2, 'Competing requests were rejected because maximum usage limit was reached');
  assert(couponUsedCount === 1, 'Coupon usedCount is strictly 1 (usage limit not exceeded)');

  // Test: releaseUsage restores coupon count
  const origCouponFindByIdAndUpdate = Coupon.findByIdAndUpdate;
  Coupon.findByIdAndUpdate = async (id, update) => {
    if (update.$inc?.usedCount) {
      couponUsedCount += update.$inc.usedCount;
    }
  };

  await couponService.releaseUsage('coupon_single_use', 'user_A');
  assert(couponUsedCount === 0, 'releaseUsage successfully restored coupon usage count from 1 to 0');

  // Reset coupon stubs
  Coupon.findById = origCouponFindById;
  Coupon.findOneAndUpdate = origCouponFindOneAndUpdate;
  Coupon.findByIdAndUpdate = origCouponFindByIdAndUpdate;

  // ====================================================
  // SUMMARY
  // ====================================================
  console.log('\n====================================================');
  console.log(`Phase 2 Security Tests Complete: ${passedTests} / ${totalTests} Passed`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
