const express = require('express');

const router = express.Router();

// Simple logger for standalone service
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  debug: (message) => console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`)
};

// Mock data for order details
const mockOrderDetails = {
  'order-001': {
    orderId: 'order-001',
    status: 'shipped',
    orderDetails: {
      customerInfo: {
        userId: 'user-123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123'
      },
      items: [
        {
          itemId: 'item-001',
          name: 'Wireless Bluetooth Headphones',
          quantity: 1,
          unitPrice: 99.99,
          totalPrice: 99.99
        },
        {
          itemId: 'item-002',
          name: 'Phone Case',
          quantity: 2,
          unitPrice: 15.99,
          totalPrice: 31.98
        }
      ],
      shipping: {
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        method: 'Standard Shipping',
        cost: 5.99,
        trackingNumber: 'TRK123456789',
        deliveryId: 'DEL-001'
      },
      payment: {
        method: 'Credit Card',
        last4Digits: '4567',
        totalAmount: 137.96,
        paymentDate: '2024-01-10T09:15:00Z'
      },
      timestamps: {
        orderPlaced: '2024-01-10T09:15:00Z',
        paymentProcessed: '2024-01-10T09:16:00Z',
        shipped: '2024-01-12T14:30:00Z',
        estimatedDelivery: '2024-01-16T18:00:00Z'
      }
    }
  },
  'order-002': {
    orderId: 'order-002',
    status: 'delivered',
    orderDetails: {
      customerInfo: {
        userId: 'user-123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123'
      },
      items: [
        {
          itemId: 'item-003',
          name: 'Gaming Mouse',
          quantity: 1,
          unitPrice: 49.99,
          totalPrice: 49.99
        }
      ],
      shipping: {
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        method: 'Express Shipping',
        cost: 12.99,
        trackingNumber: 'TRK987654321',
        deliveryId: 'DEL-002'
      },
      payment: {
        method: 'PayPal',
        last4Digits: null,
        totalAmount: 62.98,
        paymentDate: '2024-01-15T11:20:00Z'
      },
      timestamps: {
        orderPlaced: '2024-01-15T11:20:00Z',
        paymentProcessed: '2024-01-15T11:21:00Z',
        shipped: '2024-01-16T10:15:00Z',
        delivered: '2024-01-18T16:45:00Z'
      }
    }
  },
  'order-003': {
    orderId: 'order-003',
    status: 'processing',
    orderDetails: {
      customerInfo: {
        userId: 'user-123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123'
      },
      items: [
        {
          itemId: 'item-004',
          name: 'Laptop Stand',
          quantity: 1,
          unitPrice: 79.99,
          totalPrice: 79.99
        },
        {
          itemId: 'item-005',
          name: 'USB-C Hub',
          quantity: 1,
          unitPrice: 35.99,
          totalPrice: 35.99
        }
      ],
      shipping: {
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        method: 'Standard Shipping',
        cost: 5.99,
        trackingNumber: null,
        deliveryId: 'DEL-003'
      },
      payment: {
        method: 'Credit Card',
        last4Digits: '4567',
        totalAmount: 121.97,
        paymentDate: '2024-01-18T13:30:00Z'
      },
      timestamps: {
        orderPlaced: '2024-01-18T13:30:00Z',
        paymentProcessed: '2024-01-18T13:31:00Z',
        shipped: null,
        estimatedDelivery: '2024-01-25T18:00:00Z'
      }
    }
  },
  'order-004': {
    orderId: 'order-004',
    status: 'delivered',
    orderDetails: {
      customerInfo: {
        userId: 'user-456',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-0456'
      },
      items: [
        {
          itemId: 'item-006',
          name: 'Wireless Keyboard',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99
        }
      ],
      shipping: {
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        method: 'Standard Shipping',
        cost: 5.99,
        trackingNumber: 'TRK456789123',
        deliveryId: 'DEL-004'
      },
      payment: {
        method: 'Debit Card',
        last4Digits: '8901',
        totalAmount: 135.98,
        paymentDate: '2024-01-08T15:45:00Z'
      },
      timestamps: {
        orderPlaced: '2024-01-08T15:45:00Z',
        paymentProcessed: '2024-01-08T15:46:00Z',
        shipped: '2024-01-10T11:20:00Z',
        delivered: '2024-01-12T10:20:00Z'
      }
    }
  },
  // Add the test case that was failing
  '4': {
    orderId: '4',
    status: 'shipped',
    orderDetails: {
      customerInfo: {
        userId: '4',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1-555-TEST'
      },
      items: [
        {
          itemId: 'item-test-001',
          name: 'Test Product',
          quantity: 1,
          unitPrice: 29.99,
          totalPrice: 29.99
        }
      ],
      shipping: {
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TC',
          zipCode: '12345',
          country: 'USA'
        },
        method: 'Standard Shipping',
        cost: 5.99,
        trackingNumber: 'TRK-TEST-001',
        deliveryId: 'DEL-005'
      },
      payment: {
        method: 'Credit Card',
        last4Digits: '1234',
        totalAmount: 35.98,
        paymentDate: '2024-01-23T10:00:00Z'
      },
      timestamps: {
        orderPlaced: '2024-01-23T10:00:00Z',
        paymentProcessed: '2024-01-23T10:01:00Z',
        shipped: '2024-01-24T14:00:00Z',
        estimatedDelivery: '2024-01-26T18:00:00Z'
      }
    }
  }
};

/**
 * Get detailed information for a specific order
 * GET /api/order-details/{orderId}
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    logger.info(`Fetching order details for: ${orderId}`);
    
    // Get order details
    const orderDetails = mockOrderDetails[orderId];
    
    if (!orderDetails) {
      logger.warn(`No order found with ID: ${orderId}`);
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        message: `No order found with ID: ${orderId}`,
        availableOrders: Object.keys(mockOrderDetails)
      });
    }
    
    logger.info(`Found order details for: ${orderId}`);
    
    res.json({
      success: true,
      data: orderDetails
    });
    
  } catch (error) {
    logger.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve order details'
    });
  }
});

module.exports = router;
