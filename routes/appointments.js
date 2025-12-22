const express = require('express');
// const { authenticateToken } = require('../middleware/auth'); // COMMENTED OUT - No auth required

const router = express.Router();

// Simple logger for standalone service
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  debug: (message) => console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`)
};

// In-memory storage for appointments (simulating database)
let appointmentsStorage = [];
let appointmentCounter = 1;

/**
 * Get all appointments
 * GET /api/appointments
 */
router.get('/', async (req, res) => {
  try {
    const { userId, doctorId, hospitalId, status, date } = req.query;
    
    logger.info('Fetching appointments');
    
    let filteredAppointments = [...appointmentsStorage];
    
    // Filter by userId if provided
    if (userId) {
      filteredAppointments = filteredAppointments.filter(apt => apt.userId === userId);
    }
    
    // Filter by doctorId if provided
    if (doctorId) {
      filteredAppointments = filteredAppointments.filter(apt => apt.doctorId === doctorId);
    }
    
    // Filter by hospitalId if provided
    if (hospitalId) {
      filteredAppointments = filteredAppointments.filter(apt => apt.hospitalId === hospitalId);
    }
    
    // Filter by status if provided
    if (status) {
      filteredAppointments = filteredAppointments.filter(apt => apt.status === status);
    }
    
    // Filter by date if provided
    if (date) {
      filteredAppointments = filteredAppointments.filter(apt => {
        const appointmentDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
        return appointmentDate === date;
      });
    }
    
    logger.info(`Found ${filteredAppointments.length} appointments`);
    
    res.json({
      success: true,
      data: {
        appointments: filteredAppointments,
        totalAppointments: filteredAppointments.length
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
 * Get appointment by ID
 * GET /api/appointments/:appointmentId
 */
router.get('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    logger.info(`Fetching appointment: ${appointmentId}`);
    
    const appointment = appointmentsStorage.find(apt => apt.appointmentId === appointmentId);
    
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
        appointment: appointment
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
 * Book a new appointment
 * POST /api/appointments
 */
router.post('/', async (req, res) => {
  try {
    const { userId, doctorId, hospitalId, appointmentDate, appointmentTime, reason, patientName, patientPhone, patientEmail } = req.body;
    
    // Validation
    if (!userId || !doctorId || !hospitalId || !appointmentDate || !appointmentTime || !patientName || !patientPhone) {
      logger.warn('Book appointment failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'userId, doctorId, hospitalId, appointmentDate, appointmentTime, patientName, and patientPhone are required'
      });
    }
    
    // Validate date format
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    if (isNaN(appointmentDateTime.getTime())) {
      logger.warn('Book appointment failed: Invalid date/time format');
      return res.status(400).json({
        success: false,
        error: 'Invalid date/time format',
        message: 'appointmentDate and appointmentTime must be in valid format'
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
    const appointmentId = `apt-${String(appointmentCounter++).padStart(6, '0')}`;
    
    const newAppointment = {
      appointmentId,
      userId,
      doctorId,
      hospitalId,
      appointmentDate,
      appointmentTime,
      appointmentDateTime: appointmentDateTime.toISOString(),
      reason: reason || 'General consultation',
      patientName,
      patientPhone,
      patientEmail: patientEmail || null,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    appointmentsStorage.push(newAppointment);
    
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
 * Update an appointment
 * PUT /api/appointments/:appointmentId
 */
router.put('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const updateData = req.body;
    
    logger.info(`Updating appointment: ${appointmentId}`);
    
    const appointmentIndex = appointmentsStorage.findIndex(apt => apt.appointmentId === appointmentId);
    
    if (appointmentIndex === -1) {
      logger.warn(`Appointment not found: ${appointmentId}`);
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: `Appointment with ID ${appointmentId} does not exist`
      });
    }
    
    // If date or time is being updated, validate and update appointmentDateTime
    if (updateData.appointmentDate || updateData.appointmentTime) {
      const appointmentDate = updateData.appointmentDate || appointmentsStorage[appointmentIndex].appointmentDate;
      const appointmentTime = updateData.appointmentTime || appointmentsStorage[appointmentIndex].appointmentTime;
      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
      
      if (isNaN(appointmentDateTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date/time format',
          message: 'appointmentDate and appointmentTime must be in valid format'
        });
      }
      
      updateData.appointmentDateTime = appointmentDateTime.toISOString();
    }
    
    // Update appointment data
    appointmentsStorage[appointmentIndex] = {
      ...appointmentsStorage[appointmentIndex],
      ...updateData,
      appointmentId, // Prevent ID change
      updatedAt: new Date().toISOString()
    };
    
    logger.info(`Updated appointment: ${appointmentId}`);
    
    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: {
        appointment: appointmentsStorage[appointmentIndex]
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
 * Cancel an appointment
 * DELETE /api/appointments/:appointmentId
 */
router.delete('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    logger.info(`Canceling appointment: ${appointmentId}`);
    
    const appointmentIndex = appointmentsStorage.findIndex(apt => apt.appointmentId === appointmentId);
    
    if (appointmentIndex === -1) {
      logger.warn(`Appointment not found: ${appointmentId}`);
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: `Appointment with ID ${appointmentId} does not exist`
      });
    }
    
    // Update status to cancelled
    appointmentsStorage[appointmentIndex].status = 'cancelled';
    appointmentsStorage[appointmentIndex].updatedAt = new Date().toISOString();
    
    logger.info(`Cancelled appointment: ${appointmentId}`);
    
    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        appointment: appointmentsStorage[appointmentIndex]
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

