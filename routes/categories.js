const express = require('express');
const Category = require('../models/Category');
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
 * Get all categories
 * GET /api/categories
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
 * Get category by ID
 * GET /api/categories/{categoryId}
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

module.exports = router;
