const express = require('express');
const Doctor = require('../models/Doctor');
// const { authenticateToken } = require('../middleware/auth'); // COMMENTED OUT - No auth required

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Doctor:
 *       type: object
 *       properties:
 *         doctorId:
 *           type: string
 *         name:
 *           type: string
 *         specialty:
 *           type: string
 *         hospitalId:
 *           type: string
 *         hospitalName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         experience:
 *           type: number
 *         rating:
 *           type: number
 *         consultationFee:
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
 * /doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of doctors
 */
router.get('/', async (req, res) => {
  try {
    const { specialty, hospitalId, isActive } = req.query;

    logger.info('Fetching doctors');

    // Build query
    const query = {};

    if (specialty) {
      query.specialty = { $regex: `^${specialty}$`, $options: 'i' };
    }

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true; // Default to active doctors only
    }

    const doctors = await Doctor.find(query);

    logger.info(`Found ${doctors.length} doctors`);

    res.json({
      success: true,
      data: {
        doctors,
        totalDoctors: doctors.length
      }
    });

  } catch (error) {
    logger.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve doctors'
    });
  }
});

/**
 * @swagger
 * /doctors/{doctorId}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Doctor details
 *       404:
 *         description: Doctor not found
 */
router.get('/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    logger.info(`Fetching doctor: ${doctorId}`);

    const doctor = await Doctor.findOne({ doctorId });

    if (!doctor) {
      logger.warn(`Doctor not found: ${doctorId}`);
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
        message: `Doctor with ID ${doctorId} does not exist`
      });
    }

    res.json({
      success: true,
      data: {
        doctor
      }
    });

  } catch (error) {
    logger.error('Error fetching doctor:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve doctor'
    });
  }
});

/**
 * Create a new doctor
 * POST /api/doctors
 */
router.post('/', async (req, res) => {
  try {
    const { name, specialty, hospitalId, hospitalName, email, phone, experience, qualification, consultationFee, rating, availableDays, availableTimeSlots } = req.body;

    // Validation
    if (!name || !specialty || !hospitalId || !email || !phone) {
      logger.warn('Create doctor failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'name, specialty, hospitalId, email, and phone are required'
      });
    }

    // Generate new doctor ID
    const count = await Doctor.countDocuments();
    const doctorId = `doc-${String(count + 1).padStart(3, '0')}`;

    const newDoctor = new Doctor({
      doctorId,
      name,
      specialty,
      hospitalId,
      hospitalName: hospitalName || 'Unknown Hospital',
      email,
      phone,
      experience: experience || 0,
      qualification: qualification || '',
      consultationFee: consultationFee || 0,
      rating: rating || 0,
      availableDays: availableDays || [],
      availableTimeSlots: availableTimeSlots || [],
      isActive: true
    });

    await newDoctor.save();

    logger.info(`Created new doctor: ${doctorId}`);

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: {
        doctor: newDoctor
      }
    });

  } catch (error) {
    logger.error('Error creating doctor:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create doctor'
    });
  }
});

/**
 * Update a doctor
 * PUT /api/doctors/:doctorId
 */
router.put('/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const updateData = req.body;

    logger.info(`Updating doctor: ${doctorId}`);

    // Prevent ID change
    delete updateData.doctorId;

    const doctor = await Doctor.findOneAndUpdate(
      { doctorId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      logger.warn(`Doctor not found: ${doctorId}`);
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
        message: `Doctor with ID ${doctorId} does not exist`
      });
    }

    logger.info(`Updated doctor: ${doctorId}`);

    res.json({
      success: true,
      message: 'Doctor updated successfully',
      data: {
        doctor
      }
    });

  } catch (error) {
    logger.error('Error updating doctor:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update doctor'
    });
  }
});

/**
 * Delete a doctor (soft delete - set isActive to false)
 * DELETE /api/doctors/:doctorId
 */
router.delete('/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    logger.info(`Deleting doctor: ${doctorId}`);

    const doctor = await Doctor.findOneAndUpdate(
      { doctorId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!doctor) {
      logger.warn(`Doctor not found: ${doctorId}`);
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
        message: `Doctor with ID ${doctorId} does not exist`
      });
    }

    logger.info(`Deleted doctor: ${doctorId}`);

    res.json({
      success: true,
      message: 'Doctor deleted successfully',
      data: {
        doctor
      }
    });

  } catch (error) {
    logger.error('Error deleting doctor:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete doctor'
    });
  }
});

module.exports = router;
