const express = require('express');
const Patient = require('../models/Patient');

const router = express.Router();

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
 *     Patient:
 *       type: object
 *       properties:
 *         patientId:
 *           type: string
 *         userId:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         address:
 *           type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Get all patients
 *     tags: [Patients]
 *     responses:
 *       200:
 *         description: List of patients
 */
router.get('/', async (req, res) => {
    try {
        const { isActive } = req.query;
        const query = {};
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const patients = await Patient.find(query).sort({ createdAt: -1 });
        res.json({
            success: true,
            data: { patients, totalPatients: patients.length }
        });
    } catch (error) {
        logger.error('Error fetching patients:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /patients/{patientId}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient details
 *       404:
 *         description: Patient not found
 */
router.get('/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const patient = await Patient.findOne({ patientId });
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        res.json({ success: true, data: { patient } });
    } catch (error) {
        logger.error('Error fetching patient:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Create a new patient
 *     tags: [Patients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       201:
 *         description: Patient created successfully
 */
router.post('/', async (req, res) => {
    try {
        const { userId, name, email, phone, gender, dateOfBirth, address } = req.body;
        if (!userId || !name || !email || !phone) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const count = await Patient.countDocuments();
        const patientId = `pat-${String(count + 1).padStart(3, '0')}`;

        const newPatient = new Patient({
            patientId, userId, name, email, phone, gender, dateOfBirth, address
        });

        await newPatient.save();
        res.status(201).json({ success: true, data: { patient: newPatient } });
    } catch (error) {
        logger.error('Error creating patient:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /patients/{patientId}:
 *   put:
 *     summary: Update a patient
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       200:
 *         description: Patient updated successfully
 */
router.put('/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const updateData = req.body;
        delete updateData.patientId;

        const patient = await Patient.findOneAndUpdate(
            { patientId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        res.json({ success: true, data: { patient } });
    } catch (error) {
        logger.error('Error updating patient:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /patients/{patientId}:
 *   delete:
 *     summary: Delete a patient (soft delete)
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient deleted successfully
 */
router.delete('/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const patient = await Patient.findOneAndUpdate(
            { patientId },
            { $set: { isActive: false } },
            { new: true }
        );
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        res.json({ success: true, message: 'Patient deleted successfully' });
    } catch (error) {
        logger.error('Error deleting patient:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
