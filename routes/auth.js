const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Simple logger for consistency
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  debug: (message) => console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`)
};

// Mock users for testing purposes
// In production, this would come from a database
const mockUsers = {
  'testuser': {
    userId: 'user-123',
    username: 'testuser',
    // password: 'password123' (hashed)
    passwordHash: '$2a$10$Hw8Rouw64jrSTxcNr1G7Zu4IVkpNdR70gmndOGOl91oKTXPOAkLpq',
    email: 'testuser@example.com',
    role: 'user',
    name: 'Test User'
  },
  'admin': {
    userId: 'user-admin',
    username: 'admin',
    // password: 'admin123' (hashed)
    passwordHash: '$2a$10$WZWczEW.Vy/r9YUq9GtAuu.Sln6xzAS8dVqmmQHMg/nMAarJ.blxW',
    email: 'admin@example.com',
    role: 'admin',
    name: 'Admin User'
  },
  'user456': {
    userId: 'user-456',
    username: 'user456',
    // password: 'user456' (hashed)
    passwordHash: '$2a$10$o2lBCyeYtczA6ueH7CM67.cnnhjpYdOYDqiadddp8Hqcu49pJzgMK',
    email: 'user456@example.com',
    role: 'user',
    name: 'Jane Smith'
  },
  'user789': {
    userId: 'user-789',
    username: 'user789',
    // password: 'user789' (hashed)
    passwordHash: '$2a$10$VV/Sq6oJweeKrv30ukLwbeDbT8C2RQOS7WrH.oRfvq1CVkBLK2p9C',
    email: 'user789@example.com',
    role: 'user',
    name: 'Bob Johnson'
  }
};

/**
 * Generate JWT token for a user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const payload = {
    userId: user.userId,
    username: user.username,
    email: user.email,
    role: user.role,
    name: user.name
  };

  // Token expires in 24 hours
  return jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
};

/**
 * Login endpoint - authenticate user and return JWT token
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      logger.warn('Login attempt with missing credentials');
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'Username and password are required'
      });
    }

    // Find user
    const user = mockUsers[username];
    if (!user) {
      logger.warn(`Login attempt with invalid username: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid username or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn(`Login attempt with invalid password for user: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user);
    
    logger.info(`Successful login for user: ${username}`);
    
    res.json({
      success: true,
      data: {
        token: token,
        user: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          role: user.role,
          name: user.name
        },
        expiresIn: '24h'
      }
    });

  } catch (error) {
    logger.error('Error during login:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during authentication'
    });
  }
});

/**
 * Token validation endpoint - verify if token is still valid
 * POST /api/auth/verify
 */
router.post('/verify', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authentication token is required'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        logger.warn(`Token verification failed: ${err.message}`);
        return res.status(403).json({
          success: false,
          error: 'Invalid token',
          message: err.message
        });
      }

      res.json({
        success: true,
        data: {
          valid: true,
          user: {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name
          },
          expiresAt: new Date(decoded.exp * 1000).toISOString()
        }
      });
    });

  } catch (error) {
    logger.error('Error during token verification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during token verification'
    });
  }
});

/**
 * Get available test users - for development/testing purposes only
 * GET /api/auth/test-users
 */
router.get('/test-users', (req, res) => {
  try {
    const testUsers = Object.values(mockUsers).map(user => ({
      username: user.username,
      role: user.role,
      email: user.email,
      name: user.name,
      // Note: In production, NEVER expose password information
      testPassword: user.username === 'testuser' ? 'password123' : 
                   user.username === 'admin' ? 'admin123' : 
                   user.username // For other users, password is same as username
    }));

    res.json({
      success: true,
      data: {
        message: 'Test users available for authentication testing',
        users: testUsers,
        instructions: {
          loginEndpoint: 'POST /api/auth/login',
          requiredFields: ['username', 'password'],
          example: {
            username: 'testuser',
            password: 'password123'
          }
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching test users:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Logout endpoint (optional - for client-side token cleanup)
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  // Since JWT is stateless, logout is typically handled client-side
  // by removing the token from storage
  logger.info('Logout endpoint called');
  
  res.json({
    success: true,
    data: {
      message: 'Logout successful',
      instructions: 'Please remove the JWT token from your client storage'
    }
  });
});

module.exports = router;
