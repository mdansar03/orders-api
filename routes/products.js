const express = require('express');
const Product = require('../models/Product');
// const { authenticateToken } = require('../middleware/auth'); // COMMENTED OUT - No auth required

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *         productName:
 *           type: string
 *         price:
 *           type: number
 *         description:
 *           type: string
 *         categoryName:
 *           type: string
 *         inStock:
 *           type: boolean
 *         imageUrl:
 *           type: string
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
 * /products:
 *   post:
 *     summary: Get products with optional filtering
 *     tags: [Products]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryName:
 *                 type: string
 *               inStock:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: List of products matching criteria
 */
router.post('/', /* authenticateToken, */ async (req, res) => {
  try {
    const { categoryName, inStock } = req.body || {};

    logger.info(`Fetching products with filters - Category: ${categoryName || 'all'}, InStock: ${inStock !== undefined ? inStock : 'all'}`);

    // Build query
    const query = { isActive: true };

    if (categoryName) {
      query.categoryName = new RegExp(`^${categoryName}$`, 'i'); // Case-insensitive exact match
    }

    if (inStock !== undefined) {
      query.inStock = inStock;
    }

    const products = await Product.find(query);

    if (categoryName && products.length === 0) {
      const availableCategories = await Product.distinct('categoryName', { isActive: true });
      logger.warn(`No products found for category: ${categoryName}`);
      return res.status(404).json({
        success: false,
        error: 'No products found',
        message: `No products found for category: ${categoryName}`,
        availableCategories
      });
    }

    // Get unique categories from filtered products
    const categoriesInResults = [...new Set(products.map(p => p.categoryName))];

    logger.info(`Found ${products.length} products`);

    res.json({
      success: true,
      data: {
        products,
        totalProducts: products.length,
        categoriesInResults,
        filters: {
          categoryName: categoryName || null,
          inStock: inStock !== undefined ? inStock : null
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve products'
    });
  }
});

/**
 * @swagger
 * /products/all:
 *   get:
 *     summary: Get all active products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all active products
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
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get('/all', /* authenticateToken, */ async (req, res) => {
  try {
    logger.info('Fetching all products via GET endpoint');

    const products = await Product.find({ isActive: true });
    const categoriesInResults = [...new Set(products.map(p => p.categoryName))];

    res.json({
      success: true,
      data: {
        products,
        totalProducts: products.length,
        categoriesInResults
      }
    });

  } catch (error) {
    logger.error('Error fetching all products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve products'
    });
  }
});

/**
 * @swagger
 * /products/{productId}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:productId', /* authenticateToken, */ async (req, res) => {
  try {
    const { productId } = req.params;

    logger.info(`Fetching product: ${productId}`);

    const product = await Product.findOne({ productId, isActive: true });

    if (!product) {
      logger.warn(`Product not found: ${productId}`);
      const availableProducts = await Product.find({ isActive: true }).select('productId productName categoryName').limit(20);
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: `Product with ID ${productId} does not exist`,
        availableProducts
      });
    }

    res.json({
      success: true,
      data: {
        product
      }
    });

  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve product'
    });
  }
});

module.exports = router;
