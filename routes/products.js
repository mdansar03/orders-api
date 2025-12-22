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

// Mock data for products
const mockProducts = [
  // Electronics
  {
    productId: 'prod-001',
    productName: 'iPhone 15 Pro',
    categoryId: 'cat-001',
    categoryName: 'Electronics',
    description: 'Latest iPhone model with advanced features',
    price: 999.99,
    inStock: true,
    createdDate: '2024-01-01T00:00:00Z'
  },
  {
    productId: 'prod-002',
    productName: 'Samsung Galaxy S24',
    categoryId: 'cat-001',
    categoryName: 'Electronics',
    description: 'High-end Android smartphone',
    price: 899.99,
    inStock: true,
    createdDate: '2024-01-02T00:00:00Z'
  },
  {
    productId: 'prod-003',
    productName: 'MacBook Pro 14"',
    categoryId: 'cat-001',
    categoryName: 'Electronics',
    description: 'Professional laptop for developers',
    price: 1999.99,
    inStock: false,
    createdDate: '2024-01-03T00:00:00Z'
  },
  
  // Clothing
  {
    productId: 'prod-004',
    productName: 'Nike Air Jordan',
    categoryId: 'cat-002',
    categoryName: 'Clothing',
    description: 'Classic basketball sneakers',
    price: 150.00,
    inStock: true,
    createdDate: '2024-01-04T00:00:00Z'
  },
  {
    productId: 'prod-005',
    productName: 'Levi\'s 501 Jeans',
    categoryId: 'cat-002',
    categoryName: 'Clothing',
    description: 'Classic denim jeans',
    price: 89.99,
    inStock: true,
    createdDate: '2024-01-05T00:00:00Z'
  },
  {
    productId: 'prod-006',
    productName: 'Adidas Hoodie',
    categoryId: 'cat-002',
    categoryName: 'Clothing',
    description: 'Comfortable cotton hoodie',
    price: 65.00,
    inStock: true,
    createdDate: '2024-01-06T00:00:00Z'
  },
  
  // Home & Garden
  {
    productId: 'prod-007',
    productName: 'Dyson V15 Vacuum',
    categoryId: 'cat-003',
    categoryName: 'Home & Garden',
    description: 'Powerful cordless vacuum cleaner',
    price: 449.99,
    inStock: true,
    createdDate: '2024-01-07T00:00:00Z'
  },
  {
    productId: 'prod-008',
    productName: 'Garden Tool Set',
    categoryId: 'cat-003',
    categoryName: 'Home & Garden',
    description: 'Complete set of gardening tools',
    price: 79.99,
    inStock: false,
    createdDate: '2024-01-08T00:00:00Z'
  },
  
  // Books
  {
    productId: 'prod-009',
    productName: 'JavaScript: The Good Parts',
    categoryId: 'cat-004',
    categoryName: 'Books',
    description: 'Essential JavaScript programming book',
    price: 29.99,
    inStock: true,
    createdDate: '2024-01-09T00:00:00Z'
  },
  {
    productId: 'prod-010',
    productName: 'Clean Code',
    categoryId: 'cat-004',
    categoryName: 'Books',
    description: 'A handbook of agile software craftsmanship',
    price: 35.99,
    inStock: true,
    createdDate: '2024-01-10T00:00:00Z'
  },
  
  // Sports & Outdoors
  {
    productId: 'prod-011',
    productName: 'Mountain Bike',
    categoryId: 'cat-005',
    categoryName: 'Sports & Outdoors',
    description: 'Professional mountain bike for trails',
    price: 799.99,
    inStock: true,
    createdDate: '2024-01-11T00:00:00Z'
  },
  {
    productId: 'prod-012',
    productName: 'Camping Tent',
    categoryId: 'cat-005',
    categoryName: 'Sports & Outdoors',
    description: '4-person waterproof camping tent',
    price: 129.99,
    inStock: true,
    createdDate: '2024-01-12T00:00:00Z'
  },
  
  // Health & Beauty
  {
    productId: 'prod-013',
    productName: 'Skincare Set',
    categoryId: 'cat-006',
    categoryName: 'Health & Beauty',
    description: 'Complete facial skincare routine',
    price: 89.99,
    inStock: true,
    createdDate: '2024-01-13T00:00:00Z'
  },
  {
    productId: 'prod-014',
    productName: 'Vitamin C Supplements',
    categoryId: 'cat-006',
    categoryName: 'Health & Beauty',
    description: 'High-quality vitamin C tablets',
    price: 19.99,
    inStock: true,
    createdDate: '2024-01-14T00:00:00Z'
  }
];

/**
 * Get products (using POST method as requested for testing)
 * POST /api/products
 * 
 * Request body can include:
 * {
 *   "categoryName": "Electronics" // optional - filter by category
 *   "inStock": true // optional - filter by stock status
 * }
 */
router.post('/', /* authenticateToken, */ async (req, res) => {
  try {
    const { categoryName, inStock } = req.body || {};
    
    logger.info(`Fetching products with filters - Category: ${categoryName || 'all'}, InStock: ${inStock !== undefined ? inStock : 'all'}`);
    
    let filteredProducts = [...mockProducts];
    
    // Filter by category if provided
    if (categoryName) {
      filteredProducts = filteredProducts.filter(product => 
        product.categoryName.toLowerCase() === categoryName.toLowerCase()
      );
      
      if (filteredProducts.length === 0) {
        const availableCategories = [...new Set(mockProducts.map(p => p.categoryName))];
        logger.warn(`No products found for category: ${categoryName}`);
        return res.status(404).json({
          success: false,
          error: 'No products found',
          message: `No products found for category: ${categoryName}`,
          availableCategories: availableCategories
        });
      }
    }
    
    // Filter by stock status if provided
    if (inStock !== undefined) {
      filteredProducts = filteredProducts.filter(product => product.inStock === inStock);
    }
    
    // Get unique categories from filtered products
    const categoriesInResults = [...new Set(filteredProducts.map(p => p.categoryName))];
    
    logger.info(`Found ${filteredProducts.length} products`);
    
    res.json({
      success: true,
      data: {
        products: filteredProducts,
        totalProducts: filteredProducts.length,
        categoriesInResults: categoriesInResults,
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
 * Get all products (simple GET endpoint for convenience)
 * GET /api/products/all
 */
router.get('/all', /* authenticateToken, */ async (req, res) => {
  try {
    logger.info('Fetching all products via GET endpoint');
    
    const categoriesInResults = [...new Set(mockProducts.map(p => p.categoryName))];
    
    res.json({
      success: true,
      data: {
        products: mockProducts,
        totalProducts: mockProducts.length,
        categoriesInResults: categoriesInResults
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
 * Get product by ID
 * GET /api/products/{productId}
 */
router.get('/:productId', /* authenticateToken, */ async (req, res) => {
  try {
    const { productId } = req.params;
    
    logger.info(`Fetching product: ${productId}`);
    
    const product = mockProducts.find(prod => prod.productId === productId);
    
    if (!product) {
      logger.warn(`Product not found: ${productId}`);
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: `Product with ID ${productId} does not exist`,
        availableProducts: mockProducts.map(prod => ({
          productId: prod.productId,
          productName: prod.productName,
          categoryName: prod.categoryName
        }))
      });
    }
    
    res.json({
      success: true,
      data: {
        product: product
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
