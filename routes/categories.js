const express = require('express');
const Category = require('../models/Category');
// const { authenticateToken } = require('../middleware/auth'); // COMMENTED OUT - No auth required

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         categoryId:
 *           type: string
 *         categoryName:
 *           type: string
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
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
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of all active categories
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *                     totalCategories:
 *                       type: number
 */
router.get('/', /* authenticateToken, */ async (req, res) => {
  try {
    logger.info('Fetching all categories');

    const categories = await Category.find({ isActive: true });

    res.json({
      success: true,
      data: {
        categories,
        totalCategories: categories.length
      }
    });

  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve categories'
    });
  }
});

/**
 * @swagger
 * /categories/{categoryId}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get('/:categoryId', /* authenticateToken, */ async (req, res) => {
  try {
    const { categoryId } = req.params;

    logger.info(`Fetching category: ${categoryId}`);

    const category = await Category.findOne({ categoryId, isActive: true });

    if (!category) {
      logger.warn(`Category not found: ${categoryId}`);
      const availableCategories = await Category.find({ isActive: true }).select('categoryId categoryName');
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: `Category with ID ${categoryId} does not exist`,
        availableCategories
      });
    }

    res.json({
      success: true,
      data: {
        category
      }
    });

  } catch (error) {
    logger.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve category'
    });
  }
});

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryName
 *             properties:
 *               categoryName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Category already exists
 */
router.post('/', async (req, res) => {
  try {
    const { categoryName, description } = req.body;

    // Validation
    if (!categoryName) {
      logger.warn('Create category failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'categoryName is required'
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      categoryName: new RegExp(`^${categoryName}$`, 'i'),
      isActive: true 
    });

    if (existingCategory) {
      logger.warn(`Create category failed: Category already exists - ${categoryName}`);
      return res.status(409).json({
        success: false,
        error: 'Category already exists',
        message: 'Category with this name already exists'
      });
    }

    // Generate new category ID
    const count = await Category.countDocuments();
    const categoryId = `cat-${String(count + 1).padStart(6, '0')}`;

    const newCategory = new Category({
      categoryId,
      categoryName: categoryName.trim(),
      description: description || '',
      isActive: true
    });

    await newCategory.save();

    logger.info(`Created new category: ${categoryId}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category: newCategory
      }
    });

  } catch (error) {
    logger.error('Error creating category:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Category already exists',
        message: 'Category with this ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create category'
    });
  }
});

/**
 * @swagger
 * /categories/{categoryId}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryName:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category name already exists
 */
router.put('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const updateData = req.body;

    logger.info(`Updating category: ${categoryId}`);

    // Prevent ID change
    delete updateData.categoryId;

    // Check if category name already exists (if being updated)
    if (updateData.categoryName) {
      const existingCategory = await Category.findOne({ 
        categoryName: new RegExp(`^${updateData.categoryName}$`, 'i'),
        isActive: true,
        categoryId: { $ne: categoryId }
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          error: 'Category name already exists',
          message: 'Another category with this name already exists'
        });
      }
    }

    const category = await Category.findOneAndUpdate(
      { categoryId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!category) {
      logger.warn(`Category not found: ${categoryId}`);
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: `Category with ID ${categoryId} does not exist`
      });
    }

    logger.info(`Updated category: ${categoryId}`);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category
      }
    });

  } catch (error) {
    logger.error('Error updating category:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate entry',
        message: 'Category name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update category'
    });
  }
});

/**
 * @swagger
 * /categories/{categoryId}:
 *   delete:
 *     summary: Delete a category (soft delete)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 *       409:
 *         description: Cannot delete category with active products
 */
router.delete('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    logger.info(`Deleting category: ${categoryId}`);

    // Check if category has active products
    const Product = require('../models/Product');
    const productsCount = await Product.countDocuments({ categoryId, isActive: true });

    if (productsCount > 0) {
      logger.warn(`Cannot delete category ${categoryId}: Has ${productsCount} active products`);
      return res.status(409).json({
        success: false,
        error: 'Cannot delete category',
        message: `Category has ${productsCount} active product(s). Please remove or reassign products first.`
      });
    }

    const category = await Category.findOneAndUpdate(
      { categoryId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!category) {
      logger.warn(`Category not found: ${categoryId}`);
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: `Category with ID ${categoryId} does not exist`
      });
    }

    logger.info(`Deleted category: ${categoryId}`);

    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: {
        category
      }
    });

  } catch (error) {
    logger.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete category'
    });
  }
});

module.exports = router;
