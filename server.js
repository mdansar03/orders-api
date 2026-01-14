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
const usersRoutes = require('./routes/users');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const hospitalsRoutes = require('./routes/hospitals');
const doctorsRoutes = require('./routes/doctors');
const appointmentsRoutes = require('./routes/appointments');
const bookedAppointmentsRoutes = require('./routes/booked-appointments');
const patientsRoutes = require('./routes/patients');
const doctorSchedulesRoutes = require('./routes/doctor-schedules');
const doctorAvailabilitiesRoutes = require('./routes/doctor-availabilities');

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

// User management routes (CRUD)
app.use('/api/users', usersRoutes);

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
app.use('/api/patients', patientsRoutes);
app.use('/api/doctor-schedules', doctorSchedulesRoutes);
app.use('/api/doctor-availabilities', doctorAvailabilitiesRoutes);

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
        'GET /api/users - Get all users (CRUD)',
        'GET /api/users/{userId} - Get user by ID',
        'POST /api/users - Create new user',
        'PUT /api/users/{userId} - Update user',
        'DELETE /api/users/{userId} - Delete user',
        'POST /api/cart - Add item to cart (no auth)',
        'GET /api/cart/{userId} - Get cart items (no auth)',
        'PUT /api/cart/{userId}/{productId} - Update item quantity (no auth)',
        'DELETE /api/cart/{userId}/{productId} - Remove item from cart (no auth)',
        'DELETE /api/cart/{userId} - Clear entire cart (no auth)'
      ],
      protected: [
        'GET /api/orders - Get all orders with filters (CRUD)',
        'GET /api/orders/user/{userId} - Get orders for user',
        'GET /api/orders/{orderId} - Get order by ID',
        'POST /api/orders - Create new order',
        'PUT /api/orders/{orderId} - Update order',
        'DELETE /api/orders/{orderId} - Cancel/Delete order',
        'GET /api/order-details/{orderId} - Get order details',
        'GET /api/delivery-details - Get all deliveries',
        'GET /api/delivery-details/{deliveryId} - Get delivery details',
        'GET /api/delivery-details/{deliveryId}/status - Get delivery status',
        'GET /api/categories - Get all categories (CRUD)',
        'GET /api/categories/{categoryId} - Get category by ID',
        'POST /api/categories - Create new category',
        'PUT /api/categories/{categoryId} - Update category',
        'DELETE /api/categories/{categoryId} - Delete category',
        'POST /api/products - Get products with optional filters',
        'POST /api/products/create - Create new product',
        'GET /api/products/all - Get all products',
        'GET /api/products/{productId} - Get product by ID',
        'PUT /api/products/{productId} - Update product',
        'DELETE /api/products/{productId} - Delete product'
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
        'POST /api/booked-appointments/{appointmentId}/complete - Mark appointment as completed',
        'GET /api/patients - Get all patients (CRUD)',
        'POST /api/patients - Create new patient',
        'GET /api/doctor-schedules - Get doctor schedules (CRUD)',
        'POST /api/doctor-schedules - Create doctor schedule',
        'GET /api/doctor-availabilities - Get doctor availabilities',
        'POST /api/doctor-availabilities/generate - Generate slots from schedules'
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
      console.log(`👤 Users API: http://localhost:${PORT}/api/users (CRUD)`);
      console.log(`📦 Orders API: http://localhost:${PORT}/api/orders (CRUD)`);
      console.log(`📝 Order Details API: http://localhost:${PORT}/api/order-details/{orderId}`);
      console.log(`🚚 Delivery Details API: http://localhost:${PORT}/api/delivery-details/{deliveryId}`);
      console.log(`🏷️  Categories API: http://localhost:${PORT}/api/categories (CRUD)`);
      console.log(`📱 Products API: http://localhost:${PORT}/api/products (CRUD)`);
      console.log(`🏥 Hospitals API: http://localhost:${PORT}/api/hospitals (CRUD)`);
      console.log(`👨‍⚕️ Doctors API: http://localhost:${PORT}/api/doctors (CRUD)`);
      console.log(`📅 Appointments API: http://localhost:${PORT}/api/appointments (CRUD)`);
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
