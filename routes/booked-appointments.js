const express = require('express');
const Appointment = require('../models/Appointment');
// const { authenticateToken } = require('../middleware/auth'); // COMMENTED OUT - No auth required

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
 * /booked-appointments:
 *   get:
 *     summary: Get all booked appointments
 *     tags: [Booked Appointments]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of booked appointments
 */
router.get('/', async (req, res) => {
  try {
    const { userId, doctorId, hospitalId, status, paymentStatus, date } = req.query;

    logger.info('Fetching booked appointments');

    // Build query - only get non-cancelled appointments by default
    const query = {}; // No default status filter anymore to allow viewing all including 'booked' status

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

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
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

    logger.info(`Found ${appointments.length} booked appointments`);

    res.json({
      success: true,
      data: {
        appointments,
        totalAppointments: appointments.length
      }
    });

  } catch (error) {
    logger.error('Error fetching booked appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve booked appointments'
    });
  }
});

/**
 * @swagger
 * /booked-appointments/{appointmentId}:
 *   get:
 *     summary: Get booked appointment by ID
 *     tags: [Booked Appointments]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booked appointment details
 */
router.get('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;

    logger.info(`Fetching booked appointment: ${appointmentId}`);

    const appointment = await Appointment.findOne({ appointmentId });

    if (!appointment) {
      logger.warn(`Booked appointment not found: ${appointmentId}`);
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: `Booked appointment with ID ${appointmentId} does not exist`
      });
    }

    res.json({
      success: true,
      data: {
        appointment
      }
    });

  } catch (error) {
    logger.error('Error fetching booked appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve booked appointment'
    });
  }
});

/**
 * @swagger
 * /booked-appointments/user/{userId}:
 *   get:
 *     summary: Get booked appointments by user ID
 *     tags: [Booked Appointments]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user appointments
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, paymentStatus } = req.query;

    logger.info(`Fetching booked appointments for user: ${userId}`);

    // Build query
    const query = { userId };

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const appointments = await Appointment.find(query).sort({ appointmentDate: -1 });

    logger.info(`Found ${appointments.length} appointments for user: ${userId}`);

    res.json({
      success: true,
      data: {
        userId,
        appointments,
        totalAppointments: appointments.length
      }
    });

  } catch (error) {
    logger.error('Error fetching user appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve user appointments'
    });
  }
});

/**
 * @swagger
 * /booked-appointments/{appointmentId}:
 *   put:
 *     summary: Update a booked appointment
 *     tags: [Booked Appointments]
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
 *         description: Updated successfully
 */
router.put('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const updateData = req.body;

    logger.info(`Updating booked appointment: ${appointmentId}`);

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
      logger.warn(`Booked appointment not found: ${appointmentId}`);
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: `Booked appointment with ID ${appointmentId} does not exist`
      });
    }

    logger.info(`Updated booked appointment: ${appointmentId}`);

    res.json({
      success: true,
      message: 'Booked appointment updated successfully',
      data: {
        appointment
      }
    });

  } catch (error) {
    logger.error('Error updating booked appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update booked appointment'
    });
  }
});

/**
 * @swagger
 * /booked-appointments/{appointmentId}:
 *   delete:
 *     summary: Cancel a booked appointment
 *     tags: [Booked Appointments]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cancelled successfully
 */
router.delete('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;

    logger.info(`Canceling booked appointment: ${appointmentId}`);

    const appointment = await Appointment.findOneAndUpdate(
      { appointmentId },
      { $set: { status: 'cancelled' } },
      { new: true }
    );

    if (!appointment) {
      logger.warn(`Booked appointment not found: ${appointmentId}`);
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: `Booked appointment with ID ${appointmentId} does not exist`
      });
    }

    // Release availability slot if it exists
    const DoctorAvailability = require('../models/DoctorAvailability');
    await DoctorAvailability.findOneAndUpdate(
      { appointmentId: appointmentId },
      { $set: { isBooked: false, appointmentId: null } }
    );

    logger.info(`Cancelled booked appointment: ${appointmentId}`);

    res.json({
      success: true,
      message: 'Booked appointment cancelled successfully',
      data: {
        appointment
      }
    });

  } catch (error) {
    logger.error('Error cancelling booked appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to cancel booked appointment'
    });
  }
});

/**
 * @swagger
 * /booked-appointments/{appointmentId}/complete:
 *   post:
 *     summary: Mark appointment as completed
 *     tags: [Booked Appointments]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Marked as completed
 */
router.post('/:appointmentId/complete', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { notes } = req.body;

    logger.info(`Completing appointment: ${appointmentId}`);

    const updateData = { status: 'completed' };
    if (notes) {
      updateData.notes = notes;
    }

    const appointment = await Appointment.findOneAndUpdate(
      { appointmentId },
      { $set: updateData },
      { new: true }
    );

    if (!appointment) {
      logger.warn(`Booked appointment not found: ${appointmentId}`);
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: `Booked appointment with ID ${appointmentId} does not exist`
      });
    }

    logger.info(`Completed appointment: ${appointmentId}`);

    res.json({
      success: true,
      message: 'Appointment marked as completed',
      data: {
        appointment
      }
    });

  } catch (error) {
    logger.error('Error completing appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to complete appointment'
    });
  }
});

module.exports = router;
