const express = require('express');
const Order = require('../models/Order');
// const { authenticateToken } = require('../middleware/auth'); // COMMENTED OUT - No auth required

const router = express.Router();

// Simple logger for standalone service
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  debug: (message) => console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`)
};

/**
 * Get orders for a specific user
 * GET /api/orders/{userId}
 */
router.get('/:userId', /* authenticateToken, */ async (req, res) => {
  try {
    const { userId } = req.params;

    logger.info(`Fetching orders for user: ${userId}`);

    // Get orders for the user, sorted by creation date (newest first)
    const userOrders = await Order.find({ userId }).sort({ createdAt: -1 });

    if (!userOrders || userOrders.length === 0) {
      logger.warn(`No orders found for user ID: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'No orders found',
        message: `No orders found for user ID: ${userId}`
      });
    }

    logger.info(`Found ${userOrders.length} orders for user: ${userId}`);

    // Transform to match the expected format
    const transformedOrders = userOrders.map(order => ({
      orderId: order.orderId,
      updatedDate: order.updatedAt,
      creationDate: order.createdAt
    }));

    res.json({
      success: true,
      data: {
        userId,
        orders: transformedOrders,
        totalOrders: userOrders.length
      }
    });

  } catch (error) {
    logger.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve orders'
    });
  }
});

module.exports = router;
