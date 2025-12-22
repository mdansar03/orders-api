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

// In-memory storage for doctors (simulating database)
let doctorsStorage = [
  {
    doctorId: 'doc-001',
    firstName: 'John',
    lastName: 'Smith',
    fullName: 'Dr. John Smith',
    specialization: 'Cardiology',
    hospitalId: 'hosp-001',
    hospitalName: 'City General Hospital',
    email: 'john.smith@citygeneral.com',
    phone: '+1-555-1001',
    experience: 15,
    qualifications: ['MD', 'FACC', 'Cardiology Board Certified'],
    consultationFee: 200,
    rating: 4.8,
    totalReviews: 125,
    availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    isAvailable: true,
    bio: 'Experienced cardiologist with 15 years of practice in treating heart conditions.',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    doctorId: 'doc-002',
    firstName: 'Sarah',
    lastName: 'Johnson',
    fullName: 'Dr. Sarah Johnson',
    specialization: 'Neurology',
    hospitalId: 'hosp-001',
    hospitalName: 'City General Hospital',
    email: 'sarah.johnson@citygeneral.com',
    phone: '+1-555-1002',
    experience: 12,
    qualifications: ['MD', 'FACP', 'Neurology Board Certified'],
    consultationFee: 250,
    rating: 4.9,
    totalReviews: 98,
    availableSlots: ['08:00', '09:00', '10:00', '13:00', '14:00', '15:00'],
    isAvailable: true,
    bio: 'Specialized in neurological disorders and brain health.',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  },
  {
    doctorId: 'doc-003',
    firstName: 'Michael',
    lastName: 'Chen',
    fullName: 'Dr. Michael Chen',
    specialization: 'Oncology',
    hospitalId: 'hosp-002',
    hospitalName: 'Metropolitan Medical Center',
    email: 'michael.chen@metromedical.com',
    phone: '+1-555-2001',
    experience: 20,
    qualifications: ['MD', 'PhD', 'Oncology Board Certified'],
    consultationFee: 300,
    rating: 4.7,
    totalReviews: 156,
    availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    isAvailable: true,
    bio: 'Leading oncologist with expertise in cancer treatment and research.',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  },
  {
    doctorId: 'doc-004',
    firstName: 'Emily',
    lastName: 'Williams',
    fullName: 'Dr. Emily Williams',
    specialization: 'Pediatrics',
    hospitalId: 'hosp-003',
    hospitalName: 'Community Health Hospital',
    email: 'emily.williams@communityhealth.com',
    phone: '+1-555-3001',
    experience: 10,
    qualifications: ['MD', 'Pediatrics Board Certified'],
    consultationFee: 150,
    rating: 4.6,
    totalReviews: 203,
    availableSlots: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
    isAvailable: true,
    bio: 'Dedicated pediatrician with a passion for children\'s health and wellness.',
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z'
  },
  {
    doctorId: 'doc-005',
    firstName: 'David',
    lastName: 'Brown',
    fullName: 'Dr. David Brown',
    specialization: 'Orthopedics',
    hospitalId: 'hosp-002',
    hospitalName: 'Metropolitan Medical Center',
    email: 'david.brown@metromedical.com',
    phone: '+1-555-2002',
    experience: 18,
    qualifications: ['MD', 'Orthopedic Surgery Board Certified'],
    consultationFee: 275,
    rating: 4.8,
    totalReviews: 142,
    availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    isAvailable: true,
    bio: 'Expert in orthopedic surgery and sports medicine.',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z'
  },
  {
    doctorId: 'doc-006',
    firstName: 'Lisa',
    lastName: 'Anderson',
    fullName: 'Dr. Lisa Anderson',
    specialization: 'Emergency Medicine',
    hospitalId: 'hosp-004',
    hospitalName: 'Regional Trauma Center',
    email: 'lisa.anderson@regionaltrauma.com',
    phone: '+1-555-4001',
    experience: 14,
    qualifications: ['MD', 'Emergency Medicine Board Certified'],
    consultationFee: 180,
    rating: 4.5,
    totalReviews: 87,
    availableSlots: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00'],
    isAvailable: true,
    bio: 'Specialized in emergency and trauma care.',
    createdAt: '2024-01-06T00:00:00Z',
    updatedAt: '2024-01-06T00:00:00Z'
  },
  {
    doctorId: 'doc-007',
    firstName: 'Robert',
    lastName: 'Taylor',
    fullName: 'Dr. Robert Taylor',
    specialization: 'Cardiology',
    hospitalId: 'hosp-005',
    hospitalName: 'University Medical Center',
    email: 'robert.taylor@universitymed.com',
    phone: '+1-555-5001',
    experience: 22,
    qualifications: ['MD', 'PhD', 'FACC', 'Cardiology Board Certified'],
    consultationFee: 350,
    rating: 4.9,
    totalReviews: 189,
    availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    isAvailable: true,
    bio: 'Renowned cardiologist and researcher in cardiac health.',
    createdAt: '2024-01-07T00:00:00Z',
    updatedAt: '2024-01-07T00:00:00Z'
  },
  {
    doctorId: 'doc-008',
    firstName: 'Jennifer',
    lastName: 'Martinez',
    fullName: 'Dr. Jennifer Martinez',
    specialization: 'Obstetrics',
    hospitalId: 'hosp-003',
    hospitalName: 'Community Health Hospital',
    email: 'jennifer.martinez@communityhealth.com',
    phone: '+1-555-3002',
    experience: 11,
    qualifications: ['MD', 'Obstetrics & Gynecology Board Certified'],
    consultationFee: 200,
    rating: 4.7,
    totalReviews: 167,
    availableSlots: ['08:00', '09:00', '10:00', '13:00', '14:00', '15:00', '16:00'],
    isAvailable: true,
    bio: 'Caring obstetrician specializing in women\'s health and pregnancy care.',
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z'
  }
];

/**
 * Get all doctors
 * GET /api/doctors
 */
router.get('/', async (req, res) => {
  try {
    const { specialization, hospitalId, isAvailable } = req.query;
    
    logger.info('Fetching doctors');
    
    let filteredDoctors = [...doctorsStorage];
    
    // Filter by specialization if provided
    if (specialization) {
      filteredDoctors = filteredDoctors.filter(doctor =>
        doctor.specialization.toLowerCase() === specialization.toLowerCase()
      );
    }
    
    // Filter by hospital if provided
    if (hospitalId) {
      filteredDoctors = filteredDoctors.filter(doctor => doctor.hospitalId === hospitalId);
    }
    
    // Filter by availability if provided
    if (isAvailable !== undefined) {
      const availableFilter = isAvailable === 'true';
      filteredDoctors = filteredDoctors.filter(doctor => doctor.isAvailable === availableFilter);
    }
    
    logger.info(`Found ${filteredDoctors.length} doctors`);
    
    res.json({
      success: true,
      data: {
        doctors: filteredDoctors,
        totalDoctors: filteredDoctors.length
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
 * Get doctor by ID
 * GET /api/doctors/:doctorId
 */
router.get('/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    logger.info(`Fetching doctor: ${doctorId}`);
    
    const doctor = doctorsStorage.find(d => d.doctorId === doctorId);
    
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
        doctor: doctor
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
    const { firstName, lastName, specialization, hospitalId, hospitalName, email, phone, experience, qualifications, consultationFee, bio } = req.body;
    
    // Validation
    if (!firstName || !lastName || !specialization || !hospitalId || !email || !phone) {
      logger.warn('Create doctor failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'firstName, lastName, specialization, hospitalId, email, and phone are required'
      });
    }
    
    // Generate new doctor ID
    const doctorId = `doc-${String(doctorsStorage.length + 1).padStart(3, '0')}`;
    
    const newDoctor = {
      doctorId,
      firstName,
      lastName,
      fullName: `Dr. ${firstName} ${lastName}`,
      specialization,
      hospitalId,
      hospitalName: hospitalName || 'Unknown Hospital',
      email,
      phone,
      experience: experience || 0,
      qualifications: qualifications || [],
      consultationFee: consultationFee || 0,
      rating: 0,
      totalReviews: 0,
      availableSlots: [],
      isAvailable: true,
      bio: bio || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    doctorsStorage.push(newDoctor);
    
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
    
    const doctorIndex = doctorsStorage.findIndex(d => d.doctorId === doctorId);
    
    if (doctorIndex === -1) {
      logger.warn(`Doctor not found: ${doctorId}`);
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
        message: `Doctor with ID ${doctorId} does not exist`
      });
    }
    
    // Update fullName if firstName or lastName changed
    if (updateData.firstName || updateData.lastName) {
      const firstName = updateData.firstName || doctorsStorage[doctorIndex].firstName;
      const lastName = updateData.lastName || doctorsStorage[doctorIndex].lastName;
      updateData.fullName = `Dr. ${firstName} ${lastName}`;
    }
    
    // Update doctor data
    doctorsStorage[doctorIndex] = {
      ...doctorsStorage[doctorIndex],
      ...updateData,
      doctorId, // Prevent ID change
      updatedAt: new Date().toISOString()
    };
    
    logger.info(`Updated doctor: ${doctorId}`);
    
    res.json({
      success: true,
      message: 'Doctor updated successfully',
      data: {
        doctor: doctorsStorage[doctorIndex]
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
 * Delete a doctor (soft delete - set isAvailable to false)
 * DELETE /api/doctors/:doctorId
 */
router.delete('/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    logger.info(`Deleting doctor: ${doctorId}`);
    
    const doctorIndex = doctorsStorage.findIndex(d => d.doctorId === doctorId);
    
    if (doctorIndex === -1) {
      logger.warn(`Doctor not found: ${doctorId}`);
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
        message: `Doctor with ID ${doctorId} does not exist`
      });
    }
    
    // Soft delete - set isAvailable to false
    doctorsStorage[doctorIndex].isAvailable = false;
    doctorsStorage[doctorIndex].updatedAt = new Date().toISOString();
    
    logger.info(`Deleted doctor: ${doctorId}`);
    
    res.json({
      success: true,
      message: 'Doctor deleted successfully',
      data: {
        doctor: doctorsStorage[doctorIndex]
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

