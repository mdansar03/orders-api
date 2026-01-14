const express = require('express');
const Hospital = require('../models/Hospital');
// const { authenticateToken } = require('../middleware/auth'); // COMMENTED OUT - No auth required

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Hospital:
 *       type: object
 *       properties:
 *         hospitalId:
 *           type: string
 *         name:
 *           type: string
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *             country:
 *               type: string
 *         specialties:
 *           type: array
 *           items:
 *             type: string
 *         rating:
 *           type: number
 *         isActive:
 *           type: boolean
 */

// Simple logger for standalone service
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  debug: (message) => console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`)
};

/**
 * @swagger
 * /hospitals:
 *   get:
 *     summary: Get all hospitals
 *     tags: [Hospitals]
 *     parameters:
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Filter by medical specialty
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *     responses:
 *       200:
 *         description: List of hospitals
 */
router.get('/', async (req, res) => {
  try {
    const { specialty, city, isActive } = req.query;

    logger.info('Fetching hospitals');

    // Build query
    const query = {};

    if (specialty) {
      query.specialties = { $regex: specialty, $options: 'i' };
    }

    if (city) {
      query['address.city'] = { $regex: `^${city}$`, $options: 'i' };
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true; // Default to active hospitals only
    }

    const hospitals = await Hospital.find(query);

    logger.info(`Found ${hospitals.length} hospitals`);

    res.json({
      success: true,
      data: {
        hospitals,
        totalHospitals: hospitals.length
      }
    });

  } catch (error) {
    logger.error('Error fetching hospitals:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve hospitals'
    });
  }
});

/**
 * @swagger
 * /hospitals/{hospitalId}:
 *   get:
 *     summary: Get hospital by ID
 *     tags: [Hospitals]
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Hospital details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hospital'
 *       404:
 *         description: Hospital not found
 */
router.get('/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;

    logger.info(`Fetching hospital: ${hospitalId}`);

    const hospital = await Hospital.findOne({ hospitalId });

    if (!hospital) {
      logger.warn(`Hospital not found: ${hospitalId}`);
      return res.status(404).json({
        success: false,
        error: 'Hospital not found',
        message: `Hospital with ID ${hospitalId} does not exist`
      });
    }

    res.json({
      success: true,
      data: {
        hospital
      }
    });

  } catch (error) {
    logger.error('Error fetching hospital:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve hospital'
    });
  }
});

/**
 * @swagger
 * /hospitals:
 *   post:
 *     summary: Create a new hospital
 *     tags: [Hospitals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hospital'
 *     responses:
 *       201:
 *         description: Hospital created successfully
 */
router.post('/', async (req, res) => {
  try {
    const { name, address, phone, email, specialties, facilities, totalDoctors, totalBeds, rating } = req.body;

    // Validation
    if (!name || !address || !phone || !email) {
      logger.warn('Create hospital failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'name, address, phone, and email are required'
      });
    }

    // Generate new hospital ID
    const count = await Hospital.countDocuments();
    const hospitalId = `hosp-${String(count + 1).padStart(3, '0')}`;

    const newHospital = new Hospital({
      hospitalId,
      name,
      address,
      phone,
      email,
      specialties: specialties || [],
      facilities: facilities || [],
      totalDoctors: totalDoctors || 0,
      totalBeds: totalBeds || 0,
      rating: rating || 0,
      isActive: true
    });

    await newHospital.save();

    logger.info(`Created new hospital: ${hospitalId}`);

    res.status(201).json({
      success: true,
      message: 'Hospital created successfully',
      data: {
        hospital: newHospital
      }
    });

  } catch (error) {
    logger.error('Error creating hospital:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create hospital'
    });
  }
});

/**
 * @swagger
 * /hospitals/{hospitalId}:
 *   put:
 *     summary: Update a hospital
 *     tags: [Hospitals]
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hospital'
 *     responses:
 *       200:
 *         description: Hospital updated successfully
 */
router.put('/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const updateData = req.body;

    logger.info(`Updating hospital: ${hospitalId}`);

    // Prevent ID change
    delete updateData.hospitalId;

    const hospital = await Hospital.findOneAndUpdate(
      { hospitalId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!hospital) {
      logger.warn(`Hospital not found: ${hospitalId}`);
      return res.status(404).json({
        success: false,
        error: 'Hospital not found',
        message: `Hospital with ID ${hospitalId} does not exist`
      });
    }

    logger.info(`Updated hospital: ${hospitalId}`);

    res.json({
      success: true,
      message: 'Hospital updated successfully',
      data: {
        hospital
      }
    });

  } catch (error) {
    logger.error('Error updating hospital:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update hospital'
    });
  }
});

/**
 * @swagger
 * /hospitals/{hospitalId}:
 *   delete:
 *     summary: Delete a hospital (soft delete)
 *     tags: [Hospitals]
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hospital deleted successfully
 */
router.delete('/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;

    logger.info(`Deleting hospital: ${hospitalId}`);

    const hospital = await Hospital.findOneAndUpdate(
      { hospitalId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!hospital) {
      logger.warn(`Hospital not found: ${hospitalId}`);
      return res.status(404).json({
        success: false,
        error: 'Hospital not found',
        message: `Hospital with ID ${hospitalId} does not exist`
      });
    }

    logger.info(`Deleted hospital: ${hospitalId}`);

    res.json({
      success: true,
      message: 'Hospital deleted successfully',
      data: {
        hospital
      }
    });

  } catch (error) {
    logger.error('Error deleting hospital:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete hospital'
    });
  }
});

module.exports = router;
