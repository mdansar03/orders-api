const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
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
 * Generate a real working image URL from Unsplash Source
 * @param {string} categoryName - Category name to generate relevant image
 * @param {number} width - Image width (default: 800)
 * @param {number} height - Image height (default: 600)
 * @returns {string} Image URL
 */
const generateImageUrl = (categoryName = 'product', width = 800, height = 600) => {
  // Map categories to relevant Unsplash search terms
  const categoryMap = {
    'electronics': 'electronics',
    'clothing': 'fashion',
    'food': 'food',
    'books': 'books',
    'furniture': 'furniture',
    'sports': 'sports',
    'toys': 'toys',
    'beauty': 'cosmetics',
    'health': 'health',
    'automotive': 'car',
    'default': 'product'
  };

  const searchTerm = categoryMap[categoryName.toLowerCase()] || categoryMap['default'];
  
  // Use Unsplash Source API for real working images
  // Format: https://source.unsplash.com/{width}x{height}/?{search_term}
  return `https://source.unsplash.com/${width}x${height}/?${searchTerm}`;
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

/**
 * @swagger
 * /products/create:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - categoryId
 *               - categoryName
 *               - price
 *             properties:
 *               productName:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               categoryName:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stockQuantity:
 *                 type: number
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Missing required fields or invalid data
 *       404:
 *         description: Category not found
 */
router.post('/create', async (req, res) => {
  try {
    const { productName, categoryId, categoryName, description, price, stockQuantity, imageUrl } = req.body;

    // Validation
    if (!productName || !categoryId || !categoryName || price === undefined) {
      logger.warn('Create product failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'productName, categoryId, categoryName, and price are required'
      });
    }

    // Validate price
    if (price < 0 || typeof price !== 'number') {
      logger.warn('Create product failed: Invalid price');
      return res.status(400).json({
        success: false,
        error: 'Invalid price',
        message: 'Price must be a positive number'
      });
    }

    // Check if category exists
    const category = await Category.findOne({ categoryId, isActive: true });
    if (!category) {
      logger.warn(`Create product failed: Category not found - ${categoryId}`);
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: `Category with ID ${categoryId} does not exist`
      });
    }

    // Generate new product ID
    const count = await Product.countDocuments();
    const productId = `prod-${String(count + 1).padStart(6, '0')}`;

    // Generate real image URL if not provided
    const finalImageUrl = imageUrl || generateImageUrl(categoryName);

    const newProduct = new Product({
      productId,
      productName,
      categoryId,
      categoryName,
      description: description || '',
      price,
      stockQuantity: stockQuantity || 0,
      inStock: (stockQuantity || 0) > 0,
      imageUrl: finalImageUrl,
      isActive: true
    });

    await newProduct.save();

    logger.info(`Created new product: ${productId}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product: newProduct
      }
    });

  } catch (error) {
    logger.error('Error creating product:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Product already exists',
        message: 'Product with this ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create product'
    });
  }
});

/**
 * @swagger
 * /products/{productId}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               categoryName:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stockQuantity:
 *                 type: number
 *               inStock:
 *                 type: boolean
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
router.put('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;

    logger.info(`Updating product: ${productId}`);

    // Prevent ID change
    delete updateData.productId;

    // If categoryId is being updated, validate it
    if (updateData.categoryId) {
      const category = await Category.findOne({ categoryId: updateData.categoryId, isActive: true });
      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
          message: `Category with ID ${updateData.categoryId} does not exist`
        });
      }
    }

    // Update inStock based on stockQuantity if stockQuantity is being updated
    if (updateData.stockQuantity !== undefined) {
      updateData.inStock = updateData.stockQuantity > 0;
    }

    // Generate new image URL if categoryName changed and no imageUrl provided
    if (updateData.categoryName && !updateData.imageUrl) {
      const existingProduct = await Product.findOne({ productId });
      if (existingProduct && existingProduct.categoryName !== updateData.categoryName) {
        updateData.imageUrl = generateImageUrl(updateData.categoryName);
      }
    }

    const product = await Product.findOneAndUpdate(
      { productId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!product) {
      logger.warn(`Product not found: ${productId}`);
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: `Product with ID ${productId} does not exist`
      });
    }

    logger.info(`Updated product: ${productId}`);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product
      }
    });

  } catch (error) {
    logger.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update product'
    });
  }
});

/**
 * @swagger
 * /products/{productId}:
 *   delete:
 *     summary: Delete a product (soft delete)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    logger.info(`Deleting product: ${productId}`);

    const product = await Product.findOneAndUpdate(
      { productId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!product) {
      logger.warn(`Product not found: ${productId}`);
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: `Product with ID ${productId} does not exist`
      });
    }

    logger.info(`Deleted product: ${productId}`);

    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: {
        product
      }
    });

  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete product'
    });
  }
});

/**
 * @swagger
 * /products/update-images:
 *   post:
 *     summary: Update all products with real images from Unsplash
 *     tags: [Products]
 *     description: Updates all active products with real working images based on their categories
 *     responses:
 *       200:
 *         description: Products updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated:
 *                       type: number
 *                     total:
 *                       type: number
 *                     results:
 *                       type: array
 */
router.post('/update-images', async (req, res) => {
  try {
    logger.info('Starting image update for all products');

    // Get all active products
    const products = await Product.find({ isActive: true });

    if (products.length === 0) {
      return res.json({
        success: true,
        message: 'No products found to update',
        data: {
          updated: 0,
          total: 0
        }
      });
    }

    let updatedCount = 0;
    const updateResults = [];

    // Update each product with a real image based on its category
    for (const product of products) {
      try {
        const newImageUrl = generateImageUrl(product.categoryName);
        
        await Product.updateOne(
          { productId: product.productId },
          { $set: { imageUrl: newImageUrl } }
        );

        updatedCount++;
        updateResults.push({
          productId: product.productId,
          productName: product.productName,
          categoryName: product.categoryName,
          newImageUrl: newImageUrl,
          status: 'updated'
        });

        logger.info(`Updated image for product: ${product.productId} (${product.productName})`);
      } catch (error) {
        logger.error(`Error updating product ${product.productId}:`, error);
        updateResults.push({
          productId: product.productId,
          productName: product.productName,
          status: 'failed',
          error: error.message
        });
      }
    }

    logger.info(`Image update completed: ${updatedCount}/${products.length} products updated`);

    res.json({
      success: true,
      message: `Successfully updated images for ${updatedCount} out of ${products.length} products`,
      data: {
        updated: updatedCount,
        total: products.length,
        results: updateResults
      }
    });

  } catch (error) {
    logger.error('Error updating product images:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update product images'
    });
  }
});

module.exports = router;
