const jwt = require('jsonwebtoken');

// Simple logger for consistency with the rest of the app
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  debug: (message) => console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`)
};

/**
 * JWT Authentication Middleware
 * Verifies Bearer tokens in the Authorization header
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn(`Missing authentication token for ${req.method} ${req.path}`);
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'Authentication token is required. Please provide a valid Bearer token in the Authorization header.'
      });
    }

    // Get JWT secret from environment variables
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        message: 'Authentication service is not properly configured'
      });
    }

    // Verify the token
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        logger.warn(`Invalid token attempt for ${req.method} ${req.path}: ${err.message}`);
        
        let message = 'Invalid token';
        if (err.name === 'TokenExpiredError') {
          message = 'Token has expired';
        } else if (err.name === 'JsonWebTokenError') {
          message = 'Invalid token format';
        } else if (err.name === 'NotBeforeError') {
          message = 'Token not active yet';
        }

        return res.status(403).json({
          success: false,
          error: 'Authentication failed',
          message: message
        });
      }

      // Token is valid, attach user info to request
      req.user = decoded;
      logger.info(`Authenticated user ${decoded.userId} for ${req.method} ${req.path}`);
      next();
    });

  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred while processing authentication'
    });
  }
};

/**
 * Optional: Role-based authorization middleware
 * Can be chained after authenticateToken for additional protection
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to access this resource'
        });
      }

      const userRole = req.user.role || 'user';
      
      if (!roles.includes(userRole)) {
        logger.warn(`User ${req.user.userId} with role '${userRole}' attempted to access resource requiring roles: ${roles.join(', ')}`);
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `Access denied. Required role(s): ${roles.join(', ')}`
        });
      }

      logger.info(`User ${req.user.userId} authorized with role '${userRole}' for ${req.method} ${req.path}`);
      next();
    } catch (error) {
      logger.error('Authorization middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization error',
        message: 'An error occurred while checking permissions'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
