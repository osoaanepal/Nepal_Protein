import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { inventoryService } from '../services/inventory.service.js';

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      revenueResult,
      ordersByStatus,
      recentOrders,
      revenueTrends
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'PENDING' }),
      Order.countDocuments({ orderStatus: 'DELIVERED' }),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ status: 'published' }),
      Product.countDocuments({
        status: 'published',
        $expr: { $lte: ['$stock', '$lowStockThreshold'] }
      }),
      // Total revenue from confirmed/paid/delivered orders
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$pricing.grandTotal' } } }
      ]),
      // Status breakdown
      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ]),
      // 5 Most recent orders
      Order.find()
        .populate('customer', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(5),
      // 30 Days daily revenue aggregation
      Order.aggregate([
        {
          $match: {
            orderStatus: { $ne: 'CANCELLED' },
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            dailyRevenue: { $sum: '$pricing.grandTotal' },
            ordersCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          pendingOrders,
          deliveredOrders,
          totalCustomers,
          totalProducts,
          lowStockProducts,
        },
        ordersByStatus: ordersByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        revenueTrends,
        recentOrders,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, page = 1, limit = 15, search } = req.query;
    const query = {};

    if (status && status !== 'ALL') query.orderStatus = status;
    if (paymentStatus && paymentStatus !== 'ALL') query['paymentInfo.status'] = paymentStatus;

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusAdmin = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus, adminNotes, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const previousStatus = order.orderStatus;

    if (orderStatus && orderStatus !== order.orderStatus) {
      // If status changing to CANCELLED from non-cancelled, release stock
      if (orderStatus === 'CANCELLED' && previousStatus !== 'CANCELLED') {
        await inventoryService.releaseStock(order.items);
      }
      // If transitioning from CANCELLED to active, re-reserve stock
      if (previousStatus === 'CANCELLED' && orderStatus !== 'CANCELLED') {
        await inventoryService.reserveStock(order.items);
      }

      order.orderStatus = orderStatus;
      order.orderTimeline.push({
        status: orderStatus,
        note: note || `Order status updated to ${orderStatus} by Admin`,
        updatedAt: new Date(),
      });
    }

    if (paymentStatus) {
      order.paymentInfo.status = paymentStatus;
      if (paymentStatus === 'PAID' && !order.paymentInfo.paidAt) {
        order.paymentInfo.paidAt = new Date();
      }
    }

    if (adminNotes !== undefined) {
      order.adminNotes = adminNotes;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 15 } = req.query;
    const query = { role: 'customer' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [customers, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(query),
    ]);

    // Attach order metrics to each customer
    const enrichedCustomers = await Promise.all(
      customers.map(async (cust) => {
        const orderStats = await Order.aggregate([
          { $match: { customer: cust._id, orderStatus: { $ne: 'CANCELLED' } } },
          {
            $group: {
              _id: null,
              orderCount: { $sum: 1 },
              totalSpend: { $sum: '$pricing.grandTotal' }
            }
          }
        ]);

        return {
          ...cust,
          orderCount: orderStats[0]?.orderCount || 0,
          totalSpend: orderStats[0]?.totalSpend || 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedCustomers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleCustomerActive = async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    customer.isActive = !customer.isActive;
    await customer.save();

    res.status(200).json({
      success: true,
      message: `Customer ${customer.isActive ? 'activated' : 'deactivated'} successfully`,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};
