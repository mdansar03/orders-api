const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Simple logger for standalone service
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  debug: (message) => console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`)
};

// Mock delivery data with detailed tracking information
const mockDeliveryDetails = {
  'DEL-001': {
    deliveryId: 'DEL-001',
    orderId: 'order-001',
    status: 'delivered',
    trackingNumber: 'TRK123456789',
    carrier: 'FedEx',
    deliveryMethod: 'Standard Shipping',
    estimatedDelivery: '2024-01-16T18:00:00Z',
    actualDelivery: '2024-01-15T16:30:00Z',
    deliveryAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    deliveryHistory: [
      {
        timestamp: '2024-01-12T14:30:00Z',
        status: 'shipped',
        location: 'New York, NY',
        description: 'Package shipped from warehouse'
      },
      {
        timestamp: '2024-01-13T08:15:00Z',
        status: 'in_transit',
        location: 'Newark, NJ',
        description: 'Package in transit to destination'
      },
      {
        timestamp: '2024-01-14T12:45:00Z',
        status: 'out_for_delivery',
        location: 'New York, NY',
        description: 'Out for delivery'
      },
      {
        timestamp: '2024-01-15T16:30:00Z',
        status: 'delivered',
        location: 'New York, NY',
        description: 'Package delivered successfully',
        deliveredTo: 'John Doe',
        signature: true
      }
    ]
  },
  'DEL-002': {
    deliveryId: 'DEL-002',
    orderId: 'order-002',
    status: 'delivered',
    trackingNumber: 'TRK987654321',
    carrier: 'UPS',
    deliveryMethod: 'Express Shipping',
    estimatedDelivery: '2024-01-17T12:00:00Z',
    actualDelivery: '2024-01-18T16:45:00Z',
    deliveryAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    deliveryHistory: [
      {
        timestamp: '2024-01-16T10:15:00Z',
        status: 'shipped',
        location: 'New York, NY',
        description: 'Package shipped from warehouse'
      },
      {
        timestamp: '2024-01-17T14:20:00Z',
        status: 'in_transit',
        location: 'Queens, NY',
        description: 'Package in transit to destination'
      },
      {
        timestamp: '2024-01-18T09:30:00Z',
        status: 'out_for_delivery',
        location: 'New York, NY',
        description: 'Out for delivery'
      },
      {
        timestamp: '2024-01-18T16:45:00Z',
        status: 'delivered',
        location: 'New York, NY',
        description: 'Package delivered successfully',
        deliveredTo: 'John Doe',
        signature: true
      }
    ]
  },
  'DEL-003': {
    deliveryId: 'DEL-003',
    orderId: 'order-003',
    status: 'processing',
    trackingNumber: null,
    carrier: 'FedEx',
    deliveryMethod: 'Standard Shipping',
    estimatedDelivery: '2024-01-25T18:00:00Z',
    actualDelivery: null,
    deliveryAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    deliveryHistory: [
      {
        timestamp: '2024-01-18T13:31:00Z',
        status: 'processing',
        location: 'Warehouse',
        description: 'Order confirmed and being prepared for shipment'
      }
    ]
  },
  'DEL-004': {
    deliveryId: 'DEL-004',
    orderId: 'order-004',
    status: 'delivered',
    trackingNumber: 'TRK456789123',
    carrier: 'USPS',
    deliveryMethod: 'Standard Shipping',
    estimatedDelivery: '2024-01-12T18:00:00Z',
    actualDelivery: '2024-01-12T10:20:00Z',
    deliveryAddress: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    },
    deliveryHistory: [
      {
        timestamp: '2024-01-10T11:20:00Z',
        status: 'shipped',
        location: 'Los Angeles, CA',
        description: 'Package shipped from warehouse'
      },
      {
        timestamp: '2024-01-11T15:30:00Z',
        status: 'in_transit',
        location: 'Los Angeles, CA',
        description: 'Package in transit to destination'
      },
      {
        timestamp: '2024-01-12T08:45:00Z',
        status: 'out_for_delivery',
        location: 'Los Angeles, CA',
        description: 'Out for delivery'
      },
      {
        timestamp: '2024-01-12T10:20:00Z',
        status: 'delivered',
        location: 'Los Angeles, CA',
        description: 'Package delivered successfully',
        deliveredTo: 'Jane Smith',
        signature: false
      }
    ]
  },
  'DEL-005': {
    deliveryId: 'DEL-005',
    orderId: '4',
    status: 'in_transit',
    trackingNumber: 'TRK-TEST-001',
    carrier: 'DHL',
    deliveryMethod: 'Standard Shipping',
    estimatedDelivery: '2024-01-26T18:00:00Z',
    actualDelivery: null,
    deliveryAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TC',
      zipCode: '12345',
      country: 'USA'
    },
    deliveryHistory: [
      {
        timestamp: '2024-01-24T14:00:00Z',
        status: 'shipped',
        location: 'Test City, TC',
        description: 'Package shipped from warehouse'
      },
      {
        timestamp: '2024-01-25T09:15:00Z',
        status: 'in_transit',
        location: 'Test City, TC',
        description: 'Package in transit to destination'
      }
    ]
  }
};

/**
 * Get delivery details and status by delivery ID
 * GET /api/delivery-details/{deliveryId}
 */
router.get('/:deliveryId', authenticateToken, async (req, res) => {
  try {
    const { deliveryId } = req.params;
    
    logger.info(`Fetching delivery details for: ${deliveryId}`);
    
    // Get delivery details
    const deliveryDetails = mockDeliveryDetails[deliveryId];
    
    if (!deliveryDetails) {
      logger.warn(`No delivery found with ID: ${deliveryId}`);
      return res.status(404).json({
        success: false,
        error: 'Delivery not found',
        message: `No delivery found with ID: ${deliveryId}`,
        availableDeliveries: Object.keys(mockDeliveryDetails)
      });
    }
    
    logger.info(`Found delivery details for: ${deliveryId}`);
    
    res.json({
      success: true,
      data: deliveryDetails
    });
    
  } catch (error) {
    logger.error('Error fetching delivery details:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve delivery details'
    });
  }
});

/**
 * Get delivery status summary (lightweight endpoint)
 * GET /api/delivery-details/{deliveryId}/status
 */
router.get('/:deliveryId/status', authenticateToken, async (req, res) => {
  try {
    const { deliveryId } = req.params;
    
    logger.info(`Fetching delivery status for: ${deliveryId}`);
    
    const deliveryDetails = mockDeliveryDetails[deliveryId];
    
    if (!deliveryDetails) {
      logger.warn(`No delivery found with ID: ${deliveryId}`);
      return res.status(404).json({
        success: false,
        error: 'Delivery not found',
        message: `No delivery found with ID: ${deliveryId}`
      });
    }
    
    // Return only status information
    const statusInfo = {
      deliveryId: deliveryDetails.deliveryId,
      orderId: deliveryDetails.orderId,
      status: deliveryDetails.status,
      trackingNumber: deliveryDetails.trackingNumber,
      carrier: deliveryDetails.carrier,
      estimatedDelivery: deliveryDetails.estimatedDelivery,
      actualDelivery: deliveryDetails.actualDelivery,
      currentLocation: deliveryDetails.deliveryHistory[deliveryDetails.deliveryHistory.length - 1]?.location || null,
      lastUpdate: deliveryDetails.deliveryHistory[deliveryDetails.deliveryHistory.length - 1]?.timestamp || null
    };
    
    logger.info(`Found delivery status for: ${deliveryId}`);
    
    res.json({
      success: true,
      data: statusInfo
    });
    
  } catch (error) {
    logger.error('Error fetching delivery status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve delivery status'
    });
  }
});

/**
 * Get all deliveries (for testing purposes)
 * GET /api/delivery-details
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    logger.info('Fetching all delivery summaries');
    
    const deliverySummaries = Object.values(mockDeliveryDetails).map(delivery => ({
      deliveryId: delivery.deliveryId,
      orderId: delivery.orderId,
      status: delivery.status,
      trackingNumber: delivery.trackingNumber,
      carrier: delivery.carrier,
      estimatedDelivery: delivery.estimatedDelivery,
      actualDelivery: delivery.actualDelivery
    }));
    
    res.json({
      success: true,
      data: {
        deliveries: deliverySummaries,
        totalDeliveries: deliverySummaries.length
      }
    });
    
  } catch (error) {
    logger.error('Error fetching all deliveries:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve deliveries'
    });
  }
});

module.exports = router;
