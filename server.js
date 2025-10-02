const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const ordersRoutes = require('./routes/orders');
const orderDetailsRoutes = require('./routes/order-details');
const deliveryDetailsRoutes = require('./routes/delivery-details');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');

const app = express();
const PORT = process.env.PORT || 3008;

// CORS configuration - allow all origins for easy deployment
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'orders-service',
    version: '1.0.0'
  });
});

// Authentication routes (no auth required for these)
app.use('/api/auth', authRoutes);

// Cart routes (no auth required)
app.use('/api/cart', cartRoutes);

// Protected API routes (authentication required)
app.use('/api/orders', ordersRoutes);
app.use('/api/order-details', orderDetailsRoutes);
app.use('/api/delivery-details', deliveryDetailsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Orders Service API with JWT Authentication',
    version: '1.0.0',
    authentication: {
      type: 'JWT Bearer Token',
      header: 'Authorization: Bearer <your-jwt-token>',
      loginEndpoint: 'POST /api/auth/login',
      testUsersEndpoint: 'GET /api/auth/test-users'
    },
    endpoints: {
      public: [
        'GET /health - Health check',
        'POST /api/auth/login - User authentication',
        'POST /api/auth/verify - Token validation',
        'GET /api/auth/test-users - Get test user credentials',
        'POST /api/auth/logout - Logout (client-side token cleanup)',
        'POST /api/cart - Add item to cart (no auth)',
        'GET /api/cart/{userId} - Get cart items (no auth)',
        'PUT /api/cart/{userId}/{productId} - Update item quantity (no auth)',
        'DELETE /api/cart/{userId}/{productId} - Remove item from cart (no auth)',
        'DELETE /api/cart/{userId} - Clear entire cart (no auth)'
      ],
      protected: [
        'GET /api/orders/{userId} - Get orders for user (requires auth)',
        'GET /api/order-details/{orderId} - Get order details (requires auth)',
        'GET /api/delivery-details - Get all deliveries (requires auth)',
        'GET /api/delivery-details/{deliveryId} - Get delivery details (requires auth)',
        'GET /api/delivery-details/{deliveryId}/status - Get delivery status (requires auth)',
        'GET /api/categories - Get all categories (requires auth)',
        'GET /api/categories/{categoryId} - Get category by ID (requires auth)',
        'POST /api/products - Get products with optional filters (requires auth)',
        'GET /api/products/all - Get all products (requires auth)',
        'GET /api/products/{productId} - Get product by ID (requires auth)'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Orders Service running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🛒 Cart API: http://localhost:${PORT}/api/cart (no auth)`);
  console.log(`📦 Orders API: http://localhost:${PORT}/api/orders/{userId}`);
  console.log(`📝 Order Details API: http://localhost:${PORT}/api/order-details/{orderId}`);
  console.log(`🚚 Delivery Details API: http://localhost:${PORT}/api/delivery-details/{deliveryId}`);
  console.log(`🏷️  Categories API: http://localhost:${PORT}/api/categories`);
  console.log(`📱 Products API: http://localhost:${PORT}/api/products (POST method)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
