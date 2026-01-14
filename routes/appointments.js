const express = require('express');
const Appointment = require('../models/Appointment');
// const { authenticateToken } = require('../middleware/auth'); // COMMENTED OUT - No auth required

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       properties:
 *         appointmentId:
 *           type: string
 *         userId:
 *           type: string
 *         doctorId:
 *           type: string
 *         hospitalId:
 *           type: string
 *         appointmentDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [booked, cancelled, completed, no-show]
 *         reason:
 *           type: string
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
 * /appointments:
 *   get:
 *     summary: Get all appointments
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of appointments
 */
router.get('/', async (req, res) => {
  try {
    const { userId, doctorId, hospitalId, status, date } = req.query;

    logger.info('Fetching appointments');

    // Build query
    const query = {};

    if (userId) {
      query.userId = userId;
    }

    if (doctorId) {
      query.doctorId = doctorId;
    }

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    if (status) {
      query.status = status;
    }

    if (date) {
      // Filter by date (ignoring time)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query).sort({ appointmentDate: 1 });

    logger.info(`Found ${appointments.length} appointments`);

    res.json({
      success: true,
      data: {
        appointments,
        totalAppointments: appointments.length
      }
    });

  } catch (error) {
    logger.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve appointments'
    });
  }
});

/**
 * @swagger
 * /appointments/{appointmentId}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Appointment details
 *       404:
 *         description: Appointment not found
 */
router.get('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;

    logger.info(`Fetching appointment: ${appointmentId}`);

    const appointment = await Appointment.findOne({ appointmentId });

    if (!appointment) {
      logger.warn(`Appointment not found: ${appointmentId}`);
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: `Appointment with ID ${appointmentId} does not exist`
      });
    }

    res.json({
      success: true,
      data: {
        appointment
      }
    });

  } catch (error) {
    logger.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve appointment'
    });
  }
});

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Book a new appointment
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               userName:
 *                 type: string
 *               doctorId:
 *                 type: string
 *               doctorName:
 *                 type: string
 *               hospitalId:
 *                 type: string
 *               hospitalName:
 *                 type: string
 *               appointmentDate:
 *                 type: string
 *                 format: date-time
 *               timeSlot:
 *                 type: object
 *                 properties:
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *               availabilityId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 */
router.post('/', async (req, res) => {
  try {
    const { userId, userName, doctorId, doctorName, hospitalId, hospitalName, appointmentDate, timeSlot, reason, notes, consultationFee } = req.body;

    // Validation
    if (!userId || !userName || !doctorId || !doctorName || !hospitalId || !appointmentDate || !timeSlot) {
      logger.warn('Book appointment failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'userId, userName, doctorId, doctorName, hospitalId, appointmentDate, and timeSlot are required'
      });
    }

    // Validate timeSlot structure
    if (!timeSlot.startTime || !timeSlot.endTime) {
      logger.warn('Book appointment failed: Invalid timeSlot format');
      return res.status(400).json({
        success: false,
        error: 'Invalid timeSlot format',
        message: 'timeSlot must include startTime and endTime'
      });
    }

    // Validate date
    const appointmentDateTime = new Date(appointmentDate);
    if (isNaN(appointmentDateTime.getTime())) {
      logger.warn('Book appointment failed: Invalid date format');
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
        message: 'appointmentDate must be in valid format'
      });
    }

    // Check if appointment date is in the past
    if (appointmentDateTime < new Date()) {
      logger.warn('Book appointment failed: Appointment date is in the past');
      return res.status(400).json({
        success: false,
        error: 'Invalid appointment date',
        message: 'Appointment date cannot be in the past'
      });
    }

    // Generate new appointment ID
    const count = await Appointment.countDocuments();
    const appointmentId = `apt-${String(count + 1).padStart(6, '0')}`;

    const newAppointment = new Appointment({
      appointmentId,
      userId,
      userName,
      doctorId,
      doctorName,
      hospitalId,
      hospitalName: hospitalName || 'Unknown Hospital',
      appointmentDate: appointmentDateTime,
      timeSlot,
      reason: reason || 'General consultation',
      notes: notes || '',
      consultationFee: consultationFee || 0,
      status: 'booked',
      paymentStatus: 'pending'
    });

    await newAppointment.save();

    // If availabilityId is provided, mark it as booked
    if (req.body.availabilityId) {
      const DoctorAvailability = require('../models/DoctorAvailability');
      await DoctorAvailability.findOneAndUpdate(
        { availabilityId: req.body.availabilityId },
        { $set: { isBooked: true, appointmentId: appointmentId } }
      );
    }

    logger.info(`Booked new appointment: ${appointmentId}`);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointment: newAppointment
      }
    });

  } catch (error) {
    logger.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to book appointment'
    });
  }
});

/**
 * @swagger
 * /appointments/{appointmentId}:
 *   put:
 *     summary: Update an appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 */
router.put('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const updateData = req.body;

    logger.info(`Updating appointment: ${appointmentId}`);

    // Prevent ID change
    delete updateData.appointmentId;

    // Validate date if provided
    if (updateData.appointmentDate) {
      const appointmentDateTime = new Date(updateData.appointmentDate);
      if (isNaN(appointmentDateTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format',
          message: 'appointmentDate must be in valid format'
        });
      }
      updateData.appointmentDate = appointmentDateTime;
    }

    const appointment = await Appointment.findOneAndUpdate(
      { appointmentId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      logger.warn(`Appointment not found: ${appointmentId}`);
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: `Appointment with ID ${appointmentId} does not exist`
      });
    }

    logger.info(`Updated appointment: ${appointmentId}`);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: {
        appointment
      }
    });

  } catch (error) {
    logger.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update appointment'
    });
  }
});

/**
 * @swagger
 * /appointments/{appointmentId}:
 *   delete:
 *     summary: Cancel an appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 */
router.delete('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;

    logger.info(`Canceling appointment: ${appointmentId}`);

    const appointment = await Appointment.findOneAndUpdate(
      { appointmentId },
      { $set: { status: 'cancelled' } },
      { new: true }
    );

    if (!appointment) {
      logger.warn(`Appointment not found: ${appointmentId}`);
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: `Appointment with ID ${appointmentId} does not exist`
      });
    }

    // Release availability slot if it exists
    const DoctorAvailability = require('../models/DoctorAvailability');
    await DoctorAvailability.findOneAndUpdate(
      { appointmentId: appointmentId },
      { $set: { isBooked: false, appointmentId: null } }
    );

    logger.info(`Cancelled appointment: ${appointmentId}`);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        appointment
      }
    });

  } catch (error) {
    logger.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to cancel appointment'
    });
  }
});

module.exports = router;
