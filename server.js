const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const ordersRoutes = require('./routes/orders');
const orderDetailsRoutes = require('./routes/order-details');

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

// API routes
app.use('/api/orders', ordersRoutes);
app.use('/api/order-details', orderDetailsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Orders Service API',
    version: '1.0.0',
    endpoints: [
      'GET /health - Health check',
      'GET /api/orders/{userId} - Get orders for user',
      'GET /api/order-details/{orderId} - Get order details'
    ],
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
  console.log(`📦 Orders API: http://localhost:${PORT}/api/orders/{userId}`);
  console.log(`📝 Order Details API: http://localhost:${PORT}/api/order-details/{orderId}`);
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
