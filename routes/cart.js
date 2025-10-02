const express = require('express');

const router = express.Router();

// Simple logger for standalone service
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  debug: (message) => console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`)
};

// In-memory cart storage (userId -> cart items)
const cartStorage = {
  // Example structure:
  // 'user-123': [
  //   {
  //     productId: 'prod-001',
  //     productName: 'Product Name',
  //     price: 29.99,
  //     quantity: 2,
  //     image: 'https://example.com/image.jpg',
  //     addedAt: '2024-01-15T14:30:00Z'
  //   }
  // ]
};

/**
 * Add item to cart
 * POST /api/cart
 * Body: { userId, productId, productName, price, quantity, image?, categoryId? }
 */
router.post('/', async (req, res) => {
  try {
    const { userId, productId, productName, price, quantity, image, categoryId } = req.body;
    
    // Validation
    if (!userId || !productId || !productName || price === undefined || !quantity) {
      logger.warn('Add to cart failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'userId, productId, productName, price, and quantity are required',
        requiredFields: ['userId', 'productId', 'productName', 'price', 'quantity']
      });
    }
    
    // Validate quantity
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      logger.warn('Add to cart failed: Invalid quantity');
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity',
        message: 'Quantity must be a positive integer'
      });
    }
    
    // Validate price
    if (price < 0 || typeof price !== 'number') {
      logger.warn('Add to cart failed: Invalid price');
      return res.status(400).json({
        success: false,
        error: 'Invalid price',
        message: 'Price must be a positive number'
      });
    }
    
    // Initialize cart for user if doesn't exist
    if (!cartStorage[userId]) {
      cartStorage[userId] = [];
    }
    
    // Check if product already exists in cart
    const existingItemIndex = cartStorage[userId].findIndex(item => item.productId === productId);
    
    if (existingItemIndex !== -1) {
      // Update quantity if product exists
      cartStorage[userId][existingItemIndex].quantity += quantity;
      cartStorage[userId][existingItemIndex].updatedAt = new Date().toISOString();
      
      logger.info(`Updated cart for user ${userId}: productId ${productId}, new quantity: ${cartStorage[userId][existingItemIndex].quantity}`);
      
      return res.status(200).json({
        success: true,
        message: 'Product quantity updated in cart',
        data: {
          cartItem: cartStorage[userId][existingItemIndex],
          totalItems: cartStorage[userId].length,
          totalQuantity: cartStorage[userId].reduce((sum, item) => sum + item.quantity, 0)
        }
      });
    } else {
      // Add new product to cart
      const newItem = {
        productId,
        productName,
        price,
        quantity,
        image: image || null,
        categoryId: categoryId || null,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      cartStorage[userId].push(newItem);
      
      logger.info(`Added to cart for user ${userId}: productId ${productId}, quantity: ${quantity}`);
      
      return res.status(201).json({
        success: true,
        message: 'Product added to cart successfully',
        data: {
          cartItem: newItem,
          totalItems: cartStorage[userId].length,
          totalQuantity: cartStorage[userId].reduce((sum, item) => sum + item.quantity, 0)
        }
      });
    }
    
  } catch (error) {
    logger.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to add item to cart'
    });
  }
});

/**
 * Get cart items for a user
 * GET /api/cart/:userId
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    logger.info(`Fetching cart for user: ${userId}`);
    
    // Get cart for the user
    const userCart = cartStorage[userId] || [];
    
    // Calculate totals
    const totalItems = userCart.length;
    const totalQuantity = userCart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = userCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    logger.info(`Found ${totalItems} items in cart for user: ${userId}`);
    
    res.json({
      success: true,
      data: {
        userId,
        items: userCart,
        summary: {
          totalItems,
          totalQuantity,
          totalPrice: parseFloat(totalPrice.toFixed(2))
        }
      }
    });
    
  } catch (error) {
    logger.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve cart'
    });
  }
});

/**
 * Remove specific product from cart
 * DELETE /api/cart/:userId/:productId
 */
router.delete('/:userId/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    logger.info(`Removing product ${productId} from cart for user: ${userId}`);
    
    // Check if cart exists
    if (!cartStorage[userId] || cartStorage[userId].length === 0) {
      logger.warn(`Cart is empty for user: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'Cart not found',
        message: `Cart is empty for user: ${userId}`
      });
    }
    
    // Find product index
    const productIndex = cartStorage[userId].findIndex(item => item.productId === productId);
    
    if (productIndex === -1) {
      logger.warn(`Product ${productId} not found in cart for user: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: `Product ${productId} not found in cart`
      });
    }
    
    // Remove product
    const removedItem = cartStorage[userId].splice(productIndex, 1)[0];
    
    logger.info(`Removed product ${productId} from cart for user: ${userId}`);
    
    // Calculate new totals
    const totalItems = cartStorage[userId].length;
    const totalQuantity = cartStorage[userId].reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartStorage[userId].reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    res.json({
      success: true,
      message: 'Product removed from cart successfully',
      data: {
        removedItem,
        remainingItems: cartStorage[userId],
        summary: {
          totalItems,
          totalQuantity,
          totalPrice: parseFloat(totalPrice.toFixed(2))
        }
      }
    });
    
  } catch (error) {
    logger.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to remove item from cart'
    });
  }
});

/**
 * Clear entire cart for a user
 * DELETE /api/cart/:userId
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    logger.info(`Clearing cart for user: ${userId}`);
    
    // Check if cart exists
    if (!cartStorage[userId] || cartStorage[userId].length === 0) {
      logger.warn(`Cart already empty for user: ${userId}`);
      return res.json({
        success: true,
        message: 'Cart is already empty',
        data: {
          userId,
          itemsCleared: 0
        }
      });
    }
    
    const itemsCleared = cartStorage[userId].length;
    cartStorage[userId] = [];
    
    logger.info(`Cleared ${itemsCleared} items from cart for user: ${userId}`);
    
    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        userId,
        itemsCleared
      }
    });
    
  } catch (error) {
    logger.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to clear cart'
    });
  }
});

/**
 * Update product quantity in cart
 * PUT /api/cart/:userId/:productId
 * Body: { quantity }
 */
router.put('/:userId/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { quantity } = req.body;
    
    // Validation
    if (quantity === undefined) {
      logger.warn('Update cart failed: Missing quantity');
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'quantity is required'
      });
    }
    
    // Validate quantity
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      logger.warn('Update cart failed: Invalid quantity');
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity',
        message: 'Quantity must be a positive integer'
      });
    }
    
    logger.info(`Updating quantity for product ${productId} in cart for user: ${userId}`);
    
    // Check if cart exists
    if (!cartStorage[userId] || cartStorage[userId].length === 0) {
      logger.warn(`Cart not found for user: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'Cart not found',
        message: `Cart is empty for user: ${userId}`
      });
    }
    
    // Find product
    const productIndex = cartStorage[userId].findIndex(item => item.productId === productId);
    
    if (productIndex === -1) {
      logger.warn(`Product ${productId} not found in cart for user: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: `Product ${productId} not found in cart`
      });
    }
    
    // Update quantity
    cartStorage[userId][productIndex].quantity = quantity;
    cartStorage[userId][productIndex].updatedAt = new Date().toISOString();
    
    logger.info(`Updated quantity for product ${productId} to ${quantity} for user: ${userId}`);
    
    // Calculate new totals
    const totalItems = cartStorage[userId].length;
    const totalQuantity = cartStorage[userId].reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartStorage[userId].reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    res.json({
      success: true,
      message: 'Cart updated successfully',
      data: {
        updatedItem: cartStorage[userId][productIndex],
        summary: {
          totalItems,
          totalQuantity,
          totalPrice: parseFloat(totalPrice.toFixed(2))
        }
      }
    });
    
  } catch (error) {
    logger.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update cart'
    });
  }
});

module.exports = router;

