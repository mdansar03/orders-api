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

// In-memory storage for hospitals (simulating database)
let hospitalsStorage = [
  {
    hospitalId: 'hosp-001',
    name: 'City General Hospital',
    address: {
      street: '123 Medical Center Drive',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    phone: '+1-555-0101',
    email: 'info@citygeneral.com',
    specialties: ['Cardiology', 'Neurology', 'Emergency Medicine', 'Pediatrics'],
    facilities: ['ICU', 'Emergency Room', 'Operating Theaters', 'Laboratory', 'Radiology'],
    totalDoctors: 45,
    totalBeds: 200,
    rating: 4.5,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    hospitalId: 'hosp-002',
    name: 'Metropolitan Medical Center',
    address: {
      street: '456 Health Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    },
    phone: '+1-555-0202',
    email: 'contact@metromedical.com',
    specialties: ['Oncology', 'Cardiology', 'Orthopedics', 'Dermatology'],
    facilities: ['Cancer Center', 'Cardiac Unit', 'Orthopedic Ward', 'Dermatology Clinic'],
    totalDoctors: 78,
    totalBeds: 350,
    rating: 4.7,
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  },
  {
    hospitalId: 'hosp-003',
    name: 'Community Health Hospital',
    address: {
      street: '789 Wellness Boulevard',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA'
    },
    phone: '+1-555-0303',
    email: 'hello@communityhealth.com',
    specialties: ['Family Medicine', 'Pediatrics', 'Obstetrics', 'Gynecology'],
    facilities: ['Maternity Ward', 'Pediatric Unit', 'Family Clinic', 'Laboratory'],
    totalDoctors: 32,
    totalBeds: 150,
    rating: 4.3,
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  },
  {
    hospitalId: 'hosp-004',
    name: 'Regional Trauma Center',
    address: {
      street: '321 Emergency Lane',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      country: 'USA'
    },
    phone: '+1-555-0404',
    email: 'emergency@regionaltrauma.com',
    specialties: ['Trauma Surgery', 'Emergency Medicine', 'Critical Care', 'Orthopedics'],
    facilities: ['Trauma Unit', 'Emergency Department', 'Surgical ICU', 'Helipad'],
    totalDoctors: 56,
    totalBeds: 280,
    rating: 4.6,
    isActive: true,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z'
  },
  {
    hospitalId: 'hosp-005',
    name: 'University Medical Center',
    address: {
      street: '555 Academic Way',
      city: 'Boston',
      state: 'MA',
      zipCode: '02101',
      country: 'USA'
    },
    phone: '+1-555-0505',
    email: 'info@universitymed.com',
    specialties: ['Research Medicine', 'Cardiology', 'Neurology', 'Oncology', 'Transplant Surgery'],
    facilities: ['Research Lab', 'Transplant Unit', 'Cardiac Center', 'Neurology Ward'],
    totalDoctors: 120,
    totalBeds: 500,
    rating: 4.8,
    isActive: true,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z'
  }
];

/**
 * Get all hospitals
 * GET /api/hospitals
 */
router.get('/', async (req, res) => {
  try {
    const { specialty, city, isActive } = req.query;
    
    logger.info('Fetching hospitals');
    
    let filteredHospitals = [...hospitalsStorage];
    
    // Filter by specialty if provided
    if (specialty) {
      filteredHospitals = filteredHospitals.filter(hospital =>
        hospital.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
      );
    }
    
    // Filter by city if provided
    if (city) {
      filteredHospitals = filteredHospitals.filter(hospital =>
        hospital.address.city.toLowerCase() === city.toLowerCase()
      );
    }
    
    // Filter by active status if provided
    if (isActive !== undefined) {
      const activeFilter = isActive === 'true';
      filteredHospitals = filteredHospitals.filter(hospital => hospital.isActive === activeFilter);
    }
    
    logger.info(`Found ${filteredHospitals.length} hospitals`);
    
    res.json({
      success: true,
      data: {
        hospitals: filteredHospitals,
        totalHospitals: filteredHospitals.length
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
 * Get hospital by ID
 * GET /api/hospitals/:hospitalId
 */
router.get('/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    logger.info(`Fetching hospital: ${hospitalId}`);
    
    const hospital = hospitalsStorage.find(h => h.hospitalId === hospitalId);
    
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
        hospital: hospital
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
 * Create a new hospital
 * POST /api/hospitals
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
    const hospitalId = `hosp-${String(hospitalsStorage.length + 1).padStart(3, '0')}`;
    
    const newHospital = {
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
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    hospitalsStorage.push(newHospital);
    
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
 * Update a hospital
 * PUT /api/hospitals/:hospitalId
 */
router.put('/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const updateData = req.body;
    
    logger.info(`Updating hospital: ${hospitalId}`);
    
    const hospitalIndex = hospitalsStorage.findIndex(h => h.hospitalId === hospitalId);
    
    if (hospitalIndex === -1) {
      logger.warn(`Hospital not found: ${hospitalId}`);
      return res.status(404).json({
        success: false,
        error: 'Hospital not found',
        message: `Hospital with ID ${hospitalId} does not exist`
      });
    }
    
    // Update hospital data
    hospitalsStorage[hospitalIndex] = {
      ...hospitalsStorage[hospitalIndex],
      ...updateData,
      hospitalId, // Prevent ID change
      updatedAt: new Date().toISOString()
    };
    
    logger.info(`Updated hospital: ${hospitalId}`);
    
    res.json({
      success: true,
      message: 'Hospital updated successfully',
      data: {
        hospital: hospitalsStorage[hospitalIndex]
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
 * Delete a hospital (soft delete - set isActive to false)
 * DELETE /api/hospitals/:hospitalId
 */
router.delete('/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    logger.info(`Deleting hospital: ${hospitalId}`);
    
    const hospitalIndex = hospitalsStorage.findIndex(h => h.hospitalId === hospitalId);
    
    if (hospitalIndex === -1) {
      logger.warn(`Hospital not found: ${hospitalId}`);
      return res.status(404).json({
        success: false,
        error: 'Hospital not found',
        message: `Hospital with ID ${hospitalId} does not exist`
      });
    }
    
    // Soft delete - set isActive to false
    hospitalsStorage[hospitalIndex].isActive = false;
    hospitalsStorage[hospitalIndex].updatedAt = new Date().toISOString();
    
    logger.info(`Deleted hospital: ${hospitalId}`);
    
    res.json({
      success: true,
      message: 'Hospital deleted successfully',
      data: {
        hospital: hospitalsStorage[hospitalIndex]
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

