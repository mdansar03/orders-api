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

// In-memory storage for booked appointments (simulating database)
// This will be populated from appointments that are scheduled
let bookedAppointmentsStorage = [
  {
    appointmentId: 'apt-000001',
    userId: 'user-123',
    doctorId: 'doc-001',
    doctorName: 'Dr. John Smith',
    doctorSpecialization: 'Cardiology',
    hospitalId: 'hosp-001',
    hospitalName: 'City General Hospital',
    appointmentDate: '2024-02-15',
    appointmentTime: '10:00',
    appointmentDateTime: '2024-02-15T10:00:00Z',
    reason: 'Heart checkup',
    patientName: 'John Doe',
    patientPhone: '+1-555-0123',
    patientEmail: 'john.doe@example.com',
    status: 'scheduled',
    consultationFee: 200,
    paymentStatus: 'paid',
    notes: 'Regular follow-up appointment',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z'
  },
  {
    appointmentId: 'apt-000002',
    userId: 'user-456',
    doctorId: 'doc-003',
    doctorName: 'Dr. Michael Chen',
    doctorSpecialization: 'Oncology',
    hospitalId: 'hosp-002',
    hospitalName: 'Metropolitan Medical Center',
    appointmentDate: '2024-02-18',
    appointmentTime: '14:00',
    appointmentDateTime: '2024-02-18T14:00:00Z',
    reason: 'Cancer screening',
    patientName: 'Jane Smith',
    patientPhone: '+1-555-0456',
    patientEmail: 'jane.smith@example.com',
    status: 'scheduled',
    consultationFee: 300,
    paymentStatus: 'pending',
    notes: 'Initial consultation',
    createdAt: '2024-01-22T14:30:00Z',
    updatedAt: '2024-01-22T14:30:00Z'
  },
  {
    appointmentId: 'apt-000003',
    userId: 'user-789',
    doctorId: 'doc-004',
    doctorName: 'Dr. Emily Williams',
    doctorSpecialization: 'Pediatrics',
    hospitalId: 'hosp-003',
    hospitalName: 'Community Health Hospital',
    appointmentDate: '2024-02-20',
    appointmentTime: '09:00',
    appointmentDateTime: '2024-02-20T09:00:00Z',
    reason: 'Child vaccination',
    patientName: 'Mike Johnson',
    patientPhone: '+1-555-0789',
    patientEmail: 'mike.johnson@example.com',
    status: 'scheduled',
    consultationFee: 150,
    paymentStatus: 'paid',
    notes: 'Routine vaccination for 2-year-old',
    createdAt: '2024-01-25T09:15:00Z',
    updatedAt: '2024-01-25T09:15:00Z'
  },
  {
    appointmentId: 'apt-000004',
    userId: 'user-123',
    doctorId: 'doc-002',
    doctorName: 'Dr. Sarah Johnson',
    doctorSpecialization: 'Neurology',
    hospitalId: 'hosp-001',
    hospitalName: 'City General Hospital',
    appointmentDate: '2024-02-12',
    appointmentTime: '11:00',
    appointmentDateTime: '2024-02-12T11:00:00Z',
    reason: 'Headache consultation',
    patientName: 'John Doe',
    patientPhone: '+1-555-0123',
    patientEmail: 'john.doe@example.com',
    status: 'completed',
    consultationFee: 250,
    paymentStatus: 'paid',
    notes: 'Follow-up after treatment',
    createdAt: '2024-01-18T11:00:00Z',
    updatedAt: '2024-02-12T11:30:00Z'
  },
  {
    appointmentId: 'apt-000005',
    userId: 'user-999',
    doctorId: 'doc-005',
    doctorName: 'Dr. David Brown',
    doctorSpecialization: 'Orthopedics',
    hospitalId: 'hosp-002',
    hospitalName: 'Metropolitan Medical Center',
    appointmentDate: '2024-02-25',
    appointmentTime: '15:00',
    appointmentDateTime: '2024-02-25T15:00:00Z',
    reason: 'Knee pain',
    patientName: 'Robert Wilson',
    patientPhone: '+1-555-0999',
    patientEmail: 'robert.wilson@example.com',
    status: 'scheduled',
    consultationFee: 275,
    paymentStatus: 'pending',
    notes: 'Sports injury follow-up',
    createdAt: '2024-01-28T15:00:00Z',
    updatedAt: '2024-01-28T15:00:00Z'
  }
];

/**
 * Get all booked appointments
 * GET /api/booked-appointments
 */
router.get('/', async (req, res) => {
  try {
    const { userId, doctorId, hospitalId, status, paymentStatus, date } = req.query;
    
    logger.info('Fetching booked appointments');
    
    let filteredAppointments = [...bookedAppointmentsStorage];
    
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
    
    // Filter by paymentStatus if provided
    if (paymentStatus) {
      filteredAppointments = filteredAppointments.filter(apt => apt.paymentStatus === paymentStatus);
    }
    
    // Filter by date if provided
    if (date) {
      filteredAppointments = filteredAppointments.filter(apt => {
        const appointmentDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
        return appointmentDate === date;
      });
    }
    
    logger.info(`Found ${filteredAppointments.length} booked appointments`);
    
    res.json({
      success: true,
      data: {
        appointments: filteredAppointments,
        totalAppointments: filteredAppointments.length
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
 * Get booked appointment by ID
 * GET /api/booked-appointments/:appointmentId
 */
router.get('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    logger.info(`Fetching booked appointment: ${appointmentId}`);
    
    const appointment = bookedAppointmentsStorage.find(apt => apt.appointmentId === appointmentId);
    
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
        appointment: appointment
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
 * Get booked appointments by user ID
 * GET /api/booked-appointments/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, paymentStatus } = req.query;
    
    logger.info(`Fetching booked appointments for user: ${userId}`);
    
    let userAppointments = bookedAppointmentsStorage.filter(apt => apt.userId === userId);
    
    // Filter by status if provided
    if (status) {
      userAppointments = userAppointments.filter(apt => apt.status === status);
    }
    
    // Filter by paymentStatus if provided
    if (paymentStatus) {
      userAppointments = userAppointments.filter(apt => apt.paymentStatus === paymentStatus);
    }
    
    logger.info(`Found ${userAppointments.length} appointments for user: ${userId}`);
    
    res.json({
      success: true,
      data: {
        userId,
        appointments: userAppointments,
        totalAppointments: userAppointments.length
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
 * Update booked appointment status
 * PUT /api/booked-appointments/:appointmentId
 */
router.put('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const updateData = req.body;
    
    logger.info(`Updating booked appointment: ${appointmentId}`);
    
    const appointmentIndex = bookedAppointmentsStorage.findIndex(apt => apt.appointmentId === appointmentId);
    
    if (appointmentIndex === -1) {
      logger.warn(`Booked appointment not found: ${appointmentId}`);
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: `Booked appointment with ID ${appointmentId} does not exist`
      });
    }
    
    // Update appointment data
    bookedAppointmentsStorage[appointmentIndex] = {
      ...bookedAppointmentsStorage[appointmentIndex],
      ...updateData,
      appointmentId, // Prevent ID change
      updatedAt: new Date().toISOString()
    };
    
    logger.info(`Updated booked appointment: ${appointmentId}`);
    
    res.json({
      success: true,
      message: 'Booked appointment updated successfully',
      data: {
        appointment: bookedAppointmentsStorage[appointmentIndex]
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
 * Cancel a booked appointment
 * DELETE /api/booked-appointments/:appointmentId
 */
router.delete('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    logger.info(`Canceling booked appointment: ${appointmentId}`);
    
    const appointmentIndex = bookedAppointmentsStorage.findIndex(apt => apt.appointmentId === appointmentId);
    
    if (appointmentIndex === -1) {
      logger.warn(`Booked appointment not found: ${appointmentId}`);
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: `Booked appointment with ID ${appointmentId} does not exist`
      });
    }
    
    // Update status to cancelled
    bookedAppointmentsStorage[appointmentIndex].status = 'cancelled';
    bookedAppointmentsStorage[appointmentIndex].updatedAt = new Date().toISOString();
    
    logger.info(`Cancelled booked appointment: ${appointmentId}`);
    
    res.json({
      success: true,
      message: 'Booked appointment cancelled successfully',
      data: {
        appointment: bookedAppointmentsStorage[appointmentIndex]
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
 * Mark appointment as completed
 * POST /api/booked-appointments/:appointmentId/complete
 */
router.post('/:appointmentId/complete', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { notes } = req.body;
    
    logger.info(`Completing appointment: ${appointmentId}`);
    
    const appointmentIndex = bookedAppointmentsStorage.findIndex(apt => apt.appointmentId === appointmentId);
    
    if (appointmentIndex === -1) {
      logger.warn(`Booked appointment not found: ${appointmentId}`);
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: `Booked appointment with ID ${appointmentId} does not exist`
      });
    }
    
    // Update status to completed
    bookedAppointmentsStorage[appointmentIndex].status = 'completed';
    if (notes) {
      bookedAppointmentsStorage[appointmentIndex].notes = notes;
    }
    bookedAppointmentsStorage[appointmentIndex].updatedAt = new Date().toISOString();
    
    logger.info(`Completed appointment: ${appointmentId}`);
    
    res.json({
      success: true,
      message: 'Appointment marked as completed',
      data: {
        appointment: bookedAppointmentsStorage[appointmentIndex]
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

