const express = require('express');
const Order = require('../models/Order');
// const { authenticateToken } = require('../middleware/auth'); // COMMENTED OUT - No auth required

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         orderId:
 *           type: string
 *         userId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         totalAmount:
 *           type: number
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               productName:
 *                 type: string
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *               subtotal:
 *                 type: number
 *         shippingAddress:
 *           type: object
 *         paymentMethod:
 *           type: string
 *           enum: [credit_card, debit_card, paypal, cash_on_delivery]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 */

// Simple logger for standalone service
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  debug: (message) => console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`)
};

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders with optional filters
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     totalOrders:
 *                       type: number
 */
router.get('/', async (req, res) => {
  try {
    const { userId, status, paymentStatus } = req.query;

    logger.info('Fetching orders');

    // Build query
    const query = {};

    if (userId) {
      query.userId = userId;
    }

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    logger.info(`Found ${orders.length} orders`);

    res.json({
      success: true,
      data: {
        orders,
        totalOrders: orders.length
      }
    });

  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve orders'
    });
  }
});

/**
 * Get orders for a specific user (backward compatible route)
 * GET /api/orders/{userId}
 */
const getUserOrdersHandler = async (req, res) => {
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
};

// Support both old and new route patterns
router.get('/user/:userId', /* authenticateToken, */ getUserOrdersHandler);

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID (or userId for backward compatibility)
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Check if this looks like a userId (starts with "user-")
    // If so, treat it as a user orders request for backward compatibility
    if (orderId.startsWith('user-')) {
      req.params.userId = orderId;
      return getUserOrdersHandler(req, res);
    }

    logger.info(`Fetching order: ${orderId}`);

    const order = await Order.findOne({ orderId });

    if (!order) {
      logger.warn(`Order not found: ${orderId}`);
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        message: `Order with ID ${orderId} does not exist`
      });
    }

    res.json({
      success: true,
      data: {
        order
      }
    });

  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve order'
    });
  }
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - items
 *             properties:
 *               userId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - productName
 *                     - quantity
 *                     - price
 *                   properties:
 *                     productId:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     price:
 *                       type: number
 *               shippingAddress:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, debit_card, paypal, cash_on_delivery]
 *               totalAmount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Missing required fields or invalid data
 */
router.post('/', async (req, res) => {
  try {
    const { userId, items, shippingAddress, paymentMethod, totalAmount } = req.body;

    // Validation
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      logger.warn('Create order failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'userId, items (array with at least one item) are required'
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.productId || !item.productName || !item.quantity || item.price === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Invalid item data',
          message: 'Each item must have productId, productName, quantity, and price'
        });
      }
    }

    // Calculate total if not provided
    let calculatedTotal = 0;
    const processedItems = items.map(item => {
      const subtotal = item.price * item.quantity;
      calculatedTotal += subtotal;
      return {
        ...item,
        subtotal
      };
    });

    const finalTotal = totalAmount || calculatedTotal;

    if (finalTotal < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid total amount',
        message: 'Total amount must be positive'
      });
    }

    // Generate new order ID
    const count = await Order.countDocuments();
    const orderId = `ord-${String(count + 1).padStart(8, '0')}`;

    const newOrder = new Order({
      orderId,
      userId,
      items: processedItems,
      totalAmount: finalTotal,
      shippingAddress: shippingAddress || {},
      paymentMethod: paymentMethod || 'credit_card',
      status: 'pending',
      paymentStatus: 'pending'
    });

    await newOrder.save();

    logger.info(`Created new order: ${orderId}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: newOrder
      }
    });

  } catch (error) {
    logger.error('Error creating order:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Order already exists',
        message: 'Order with this ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create order'
    });
  }
});

/**
 * @swagger
 * /orders/{orderId}:
 *   put:
 *     summary: Update an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed, refunded]
 *               items:
 *                 type: array
 *               shippingAddress:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 */
router.put('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const updateData = req.body;

    logger.info(`Updating order: ${orderId}`);

    // Prevent ID change
    delete updateData.orderId;

    // If items are being updated, recalculate total
    if (updateData.items && Array.isArray(updateData.items)) {
      let calculatedTotal = 0;
      updateData.items = updateData.items.map(item => {
        const subtotal = item.price * item.quantity;
        calculatedTotal += subtotal;
        return {
          ...item,
          subtotal
        };
      });
      updateData.totalAmount = calculatedTotal;
    }

    const order = await Order.findOneAndUpdate(
      { orderId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!order) {
      logger.warn(`Order not found: ${orderId}`);
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        message: `Order with ID ${orderId} does not exist`
      });
    }

    logger.info(`Updated order: ${orderId}`);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: {
        order
      }
    });

  } catch (error) {
    logger.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update order'
    });
  }
});

/**
 * @swagger
 * /orders/{orderId}:
 *   delete:
 *     summary: Delete or cancel an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: hardDelete
 *         schema:
 *           type: boolean
 *         description: If true, permanently delete. If false, soft delete (cancel)
 *     responses:
 *       200:
 *         description: Order deleted/cancelled successfully
 *       404:
 *         description: Order not found
 */
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { hardDelete } = req.query; // Optional: hard delete vs soft delete

    logger.info(`Deleting order: ${orderId}`);

    let order;

    if (hardDelete === 'true') {
      // Hard delete - remove from database
      order = await Order.findOneAndDelete({ orderId });
    } else {
      // Soft delete - update status to cancelled
      // First get the order to check payment status
      const existingOrder = await Order.findOne({ orderId });
      const paymentStatus = existingOrder && existingOrder.paymentStatus === 'paid' ? 'refunded' : 'pending';
      
      order = await Order.findOneAndUpdate(
        { orderId },
        { 
          $set: { 
            status: 'cancelled',
            paymentStatus: paymentStatus
          } 
        },
        { new: true }
      );
    }

    if (!order) {
      logger.warn(`Order not found: ${orderId}`);
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        message: `Order with ID ${orderId} does not exist`
      });
    }

    logger.info(`${hardDelete === 'true' ? 'Deleted' : 'Cancelled'} order: ${orderId}`);

    res.json({
      success: true,
      message: hardDelete === 'true' ? 'Order deleted successfully' : 'Order cancelled successfully',
      data: {
        order
      }
    });

  } catch (error) {
    logger.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete order'
    });
  }
});

module.exports = router;
