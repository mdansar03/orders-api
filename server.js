const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database configuration
const { connectDB } = require('./config/database');

// Import routes
const ordersRoutes = require('./routes/orders');
const orderDetailsRoutes = require('./routes/order-details');
const deliveryDetailsRoutes = require('./routes/delivery-details');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const hospitalsRoutes = require('./routes/hospitals');
const doctorsRoutes = require('./routes/doctors');
const appointmentsRoutes = require('./routes/appointments');
const bookedAppointmentsRoutes = require('./routes/booked-appointments');

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

// Protected API routes (authentication required - currently commented out)
app.use('/api/orders', ordersRoutes);
app.use('/api/order-details', orderDetailsRoutes);
app.use('/api/delivery-details', deliveryDetailsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Serve Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// New medical/healthcare API routes (no auth required)
app.use('/api/hospitals', hospitalsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/booked-appointments', bookedAppointmentsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Orders Service API with Medical/Healthcare APIs',
    version: '1.0.0',
    note: 'Authentication has been commented out - all APIs are accessible without auth',
    authentication: {
      type: 'JWT Bearer Token (DISABLED)',
      header: 'Authorization: Bearer <your-jwt-token>',
      loginEndpoint: 'POST /api/auth/login',
      testUsersEndpoint: 'GET /api/auth/test-users',
      status: 'COMMENTED OUT - No authentication required'
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
        'GET /api/orders/{userId} - Get orders for user (auth commented out)',
        'GET /api/order-details/{orderId} - Get order details (auth commented out)',
        'GET /api/delivery-details - Get all deliveries (auth commented out)',
        'GET /api/delivery-details/{deliveryId} - Get delivery details (auth commented out)',
        'GET /api/delivery-details/{deliveryId}/status - Get delivery status (auth commented out)',
        'GET /api/categories - Get all categories (auth commented out)',
        'GET /api/categories/{categoryId} - Get category by ID (auth commented out)',
        'POST /api/products - Get products with optional filters (auth commented out)',
        'GET /api/products/all - Get all products (auth commented out)',
        'GET /api/products/{productId} - Get product by ID (auth commented out)'
      ],
      medical: [
        'GET /api/hospitals - Get all hospitals (CRUD)',
        'GET /api/hospitals/{hospitalId} - Get hospital by ID',
        'POST /api/hospitals - Create new hospital',
        'PUT /api/hospitals/{hospitalId} - Update hospital',
        'DELETE /api/hospitals/{hospitalId} - Delete hospital',
        'GET /api/doctors - Get all doctors (CRUD)',
        'GET /api/doctors/{doctorId} - Get doctor by ID',
        'POST /api/doctors - Create new doctor',
        'PUT /api/doctors/{doctorId} - Update doctor',
        'DELETE /api/doctors/{doctorId} - Delete doctor',
        'GET /api/appointments - Get all appointments (CRUD)',
        'GET /api/appointments/{appointmentId} - Get appointment by ID',
        'POST /api/appointments - Book new appointment',
        'PUT /api/appointments/{appointmentId} - Update appointment',
        'DELETE /api/appointments/{appointmentId} - Cancel appointment',
        'GET /api/booked-appointments - Get all booked appointments (CRUD)',
        'GET /api/booked-appointments/{appointmentId} - Get booked appointment by ID',
        'GET /api/booked-appointments/user/{userId} - Get appointments by user',
        'PUT /api/booked-appointments/{appointmentId} - Update booked appointment',
        'DELETE /api/booked-appointments/{appointmentId} - Cancel booked appointment',
        'POST /api/booked-appointments/{appointmentId}/complete - Mark appointment as completed'
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

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Start Express server after successful DB connection
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
      console.log(`🏥 Hospitals API: http://localhost:${PORT}/api/hospitals`);
      console.log(`👨‍⚕️ Doctors API: http://localhost:${PORT}/api/doctors`);
      console.log(`📅 Appointments API: http://localhost:${PORT}/api/appointments`);
      console.log(`✅ Booked Appointments API: http://localhost:${PORT}/api/booked-appointments`);
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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start the server if run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
