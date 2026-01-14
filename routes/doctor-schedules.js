const express = require('express');
const DoctorSchedule = require('../models/DoctorSchedule');

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
 *     DoctorSchedule:
 *       type: object
 *       properties:
 *         scheduleId:
 *           type: string
 *         doctorId:
 *           type: string
 *         dayOfWeek:
 *           type: string
 *           enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *         slotDuration:
 *           type: number
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /doctor-schedules:
 *   get:
 *     summary: Get all doctor schedules
 *     tags: [Doctor Schedules]
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of schedules
 */
router.get('/', async (req, res) => {
    try {
        const { doctorId } = req.query;
        const query = {};
        if (doctorId) query.doctorId = doctorId;

        const schedules = await DoctorSchedule.find(query).sort({ doctorId: 1, dayOfWeek: 1 });
        res.json({
            success: true,
            data: { schedules, totalSchedules: schedules.length }
        });
    } catch (error) {
        logger.error('Error fetching schedules:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /doctor-schedules/{scheduleId}:
 *   get:
 *     summary: Get schedule by ID
 *     tags: [Doctor Schedules]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schedule details
 *       404:
 *         description: Schedule not found
 */
router.get('/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const schedule = await DoctorSchedule.findOne({ scheduleId });
        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }
        res.json({ success: true, data: { schedule } });
    } catch (error) {
        logger.error('Error fetching schedule:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /doctor-schedules:
 *   post:
 *     summary: Create a new doctor schedule
 *     tags: [Doctor Schedules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoctorSchedule'
 *     responses:
 *       201:
 *         description: Schedule created successfully
 */
router.post('/', async (req, res) => {
    try {
        const { doctorId, dayOfWeek, startTime, endTime, slotDuration } = req.body;
        if (!doctorId || !dayOfWeek || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const count = await DoctorSchedule.countDocuments();
        const scheduleId = `sch-${String(count + 1).padStart(3, '0')}`;

        const newSchedule = new DoctorSchedule({
            scheduleId, doctorId, dayOfWeek, startTime, endTime, slotDuration
        });

        await newSchedule.save();
        res.status(201).json({ success: true, data: { schedule: newSchedule } });
    } catch (error) {
        logger.error('Error creating schedule:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /doctor-schedules/{scheduleId}:
 *   put:
 *     summary: Update a doctor schedule
 *     tags: [Doctor Schedules]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoctorSchedule'
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 */
router.put('/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const updateData = req.body;
        delete updateData.scheduleId;

        const schedule = await DoctorSchedule.findOneAndUpdate(
            { scheduleId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }
        res.json({ success: true, data: { schedule } });
    } catch (error) {
        logger.error('Error updating schedule:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /doctor-schedules/{scheduleId}:
 *   delete:
 *     summary: Delete a doctor schedule
 *     tags: [Doctor Schedules]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 */
router.delete('/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const result = await DoctorSchedule.findOneAndDelete({ scheduleId });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }
        res.json({ success: true, message: 'Schedule deleted successfully' });
    } catch (error) {
        logger.error('Error deleting schedule:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
