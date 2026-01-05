const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Simple logger for standalone service
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  debug: (message) => console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`)
};

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, admin]
 *         isActive:
 *           type: boolean
 */

/**
 * Get all users
 * GET /api/users
 */
router.get('/', async (req, res) => {
  try {
    const { role, isActive } = req.query;

    logger.info('Fetching users');

    // Build query
    const query = {};

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const users = await User.find(query).select('-passwordHash').sort({ createdAt: -1 });

    logger.info(`Found ${users.length} users`);

    res.json({
      success: true,
      data: {
        users,
        totalUsers: users.length
      }
    });

  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve users'
    });
  }
});

/**
 * Get user by ID
 * GET /api/users/:userId
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    logger.info(`Fetching user: ${userId}`);

    const user = await User.findOne({ userId }).select('-passwordHash');

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: `User with ID ${userId} does not exist`
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve user'
    });
  }
});

/**
 * Create a new user
 * POST /api/users
 */
router.post('/', async (req, res) => {
  try {
    const { username, email, password, name, role } = req.body;

    // Validation
    if (!username || !email || !password || !name) {
      logger.warn('Create user failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'username, email, password, and name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
      logger.warn(`Create user failed: User already exists - ${username} or ${email}`);
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'Username or email already registered'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate new user ID
    const count = await User.countDocuments();
    const userId = `user-${String(count + 1).padStart(6, '0')}`;

    const newUser = new User({
      userId,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: role || 'user',
      isActive: true
    });

    await newUser.save();

    // Remove password hash from response
    const userResponse = newUser.toObject();
    delete userResponse.passwordHash;

    logger.info(`Created new user: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    logger.error('Error creating user:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'Username or email already registered'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create user'
    });
  }
});

/**
 * Update a user
 * PUT /api/users/:userId
 */
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    logger.info(`Updating user: ${userId}`);

    // Prevent ID change
    delete updateData.userId;

    // If password is being updated, hash it
    if (updateData.password) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(updateData.password, saltRounds);
      delete updateData.password;
    }

    // Normalize username and email if provided
    if (updateData.username) {
      updateData.username = updateData.username.toLowerCase();
    }
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    const user = await User.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: `User with ID ${userId} does not exist`
      });
    }

    logger.info(`Updated user: ${userId}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user
      }
    });

  } catch (error) {
    logger.error('Error updating user:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate entry',
        message: 'Username or email already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update user'
    });
  }
});

/**
 * Delete a user (soft delete - set isActive to false)
 * DELETE /api/users/:userId
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    logger.info(`Deleting user: ${userId}`);

    const user = await User.findOneAndUpdate(
      { userId },
      { $set: { isActive: false } },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: `User with ID ${userId} does not exist`
      });
    }

    logger.info(`Deleted user: ${userId}`);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        user
      }
    });

  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete user'
    });
  }
});

module.exports = router;

