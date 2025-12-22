const express = require('express');
// const { authenticateToken } = require('../middleware/auth'); // COMMENTED OUT - No auth required

const router = express.Router();

// Simple logger for standalone service
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  debug: (message) => console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`)
};

// Mock data for categories
const mockCategories = [
  {
    categoryId: 'cat-001',
    categoryName: 'Electronics',
    description: 'Electronic devices and gadgets',
    createdDate: '2024-01-01T00:00:00Z'
  },
  {
    categoryId: 'cat-002',
    categoryName: 'Clothing',
    description: 'Fashion and apparel',
    createdDate: '2024-01-01T00:00:00Z'
  },
  {
    categoryId: 'cat-003',
    categoryName: 'Home & Garden',
    description: 'Home appliances and garden tools',
    createdDate: '2024-01-01T00:00:00Z'
  },
  {
    categoryId: 'cat-004',
    categoryName: 'Books',
    description: 'Books and educational materials',
    createdDate: '2024-01-01T00:00:00Z'
  },
  {
    categoryId: 'cat-005',
    categoryName: 'Sports & Outdoors',
    description: 'Sports equipment and outdoor gear',
    createdDate: '2024-01-01T00:00:00Z'
  },
  {
    categoryId: 'cat-006',
    categoryName: 'Health & Beauty',
    description: 'Health and beauty products',
    createdDate: '2024-01-01T00:00:00Z'
  }
];

/**
 * Get all categories
 * GET /api/categories
 */
router.get('/', /* authenticateToken, */ async (req, res) => {
  try {
    logger.info('Fetching all categories');
    
    res.json({
      success: true,
      data: {
        categories: mockCategories,
        totalCategories: mockCategories.length
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
    
    const category = mockCategories.find(cat => cat.categoryId === categoryId);
    
    if (!category) {
      logger.warn(`Category not found: ${categoryId}`);
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: `Category with ID ${categoryId} does not exist`,
        availableCategories: mockCategories.map(cat => ({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName
        }))
      });
    }
    
    res.json({
      success: true,
      data: {
        category: category
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
