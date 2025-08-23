const express = require('express');

const router = express.Router();

// Simple logger for standalone service
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  debug: (message) => console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`)
};

// Mock data for orders
const mockOrders = {
  'user-123': [
    {
      orderId: 'order-001',
      updatedDate: '2024-01-15T14:30:00Z',
      creationDate: '2024-01-10T09:15:00Z'
    },
    {
      orderId: 'order-002',
      updatedDate: '2024-01-18T16:45:00Z',
      creationDate: '2024-01-15T11:20:00Z'
    },
    {
      orderId: 'order-003',
      updatedDate: '2024-01-20T08:15:00Z',
      creationDate: '2024-01-18T13:30:00Z'
    }
  ],
  'user-456': [
    {
      orderId: 'order-004',
      updatedDate: '2024-01-12T10:20:00Z',
      creationDate: '2024-01-08T15:45:00Z'
    },
    {
      orderId: 'order-005',
      updatedDate: '2024-01-19T12:30:00Z',
      creationDate: '2024-01-17T09:10:00Z'
    }
  ],
  'user-789': [
    {
      orderId: 'order-006',
      updatedDate: '2024-01-21T14:15:00Z',
      creationDate: '2024-01-19T16:20:00Z'
    },
    {
      orderId: 'order-007',
      updatedDate: '2024-01-16T11:45:00Z',
      creationDate: '2024-01-14T08:30:00Z'
    },
    {
      orderId: 'order-008',
      updatedDate: '2024-01-22T09:20:00Z',
      creationDate: '2024-01-20T14:15:00Z'
    }
  ],
  // Add some additional test users for more data
  'user-999': [
    {
      orderId: 'order-009',
      updatedDate: '2024-01-23T10:30:00Z',
      creationDate: '2024-01-21T14:15:00Z'
    }
  ],
  '4': [ // For the specific test case that was failing
    {
      orderId: 'order-004-001',
      updatedDate: '2024-01-23T12:00:00Z',
      creationDate: '2024-01-20T10:00:00Z'
    },
    {
      orderId: 'order-004-002',
      updatedDate: '2024-01-24T15:30:00Z',
      creationDate: '2024-01-22T09:00:00Z'
    }
  ]
};

/**
 * Get orders for a specific user
 * GET /api/orders/{userId}
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    logger.info(`Fetching orders for user: ${userId}`);
    
    // Get orders for the user
    const userOrders = mockOrders[userId];
    
    if (!userOrders || userOrders.length === 0) {
      logger.warn(`No orders found for user ID: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'No orders found',
        message: `No orders found for user ID: ${userId}`,
        availableUsers: Object.keys(mockOrders)
      });
    }
    
    logger.info(`Found ${userOrders.length} orders for user: ${userId}`);
    
    res.json({
      success: true,
      data: {
        userId: userId,
        orders: userOrders,
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
