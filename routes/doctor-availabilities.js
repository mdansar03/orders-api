const express = require('express');
const DoctorAvailability = require('../models/DoctorAvailability');
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
 *     DoctorAvailability:
 *       type: object
 *       properties:
 *         availabilityId:
 *           type: string
 *         doctorId:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *         isBooked:
 *           type: boolean
 *         appointmentId:
 *           type: string
 */

/**
 * @swagger
 * /doctor-availabilities:
 *   get:
 *     summary: Get all doctor availabilities
 *     tags: [Doctor Availabilities]
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: isBooked
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of availabilities
 */
router.get('/', async (req, res) => {
    try {
        const { doctorId, date, isBooked } = req.query;
        const query = {};
        if (doctorId) query.doctorId = doctorId;
        if (date) {
            const searchDate = new Date(date);
            const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
            query.date = { $gte: startOfDay, $lte: endOfDay };
        }
        if (isBooked !== undefined) query.isBooked = isBooked === 'true';

        const availabilities = await DoctorAvailability.find(query).sort({ date: 1, startTime: 1 });
        res.json({
            success: true,
            data: { availabilities, totalAvailabilities: availabilities.length }
        });
    } catch (error) {
        logger.error('Error fetching availabilities:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /doctor-availabilities/generate:
 *   post:
 *     summary: Generate availability slots from doctor schedules
 *     tags: [Doctor Availabilities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctorId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Slots generated successfully
 */
router.post('/generate', async (req, res) => {
    try {
        const { doctorId, startDate, endDate } = req.body;
        if (!doctorId || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const schedules = await DoctorSchedule.find({ doctorId, isActive: true });

        if (schedules.length === 0) {
            return res.status(404).json({ success: false, message: 'No active schedules found for this doctor' });
        }

        const generatedCount = 0;
        const current = new Date(start);
        const slots = [];

        while (current <= end) {
            const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
            const daySchedules = schedules.filter(s => s.dayOfWeek === dayName);

            for (const sch of daySchedules) {
                let currentSlotTime = sch.startTime;
                while (currentSlotTime < sch.endTime) {
                    const [hours, minutes] = currentSlotTime.split(':').map(Number);
                    const slotStart = new Date(current);
                    slotStart.setHours(hours, minutes, 0, 0);

                    const slotEnd = new Date(slotStart);
                    slotEnd.setMinutes(slotEnd.getMinutes() + sch.slotDuration);

                    const endTimeStr = `${String(slotEnd.getHours()).padStart(2, '0')}:${String(slotEnd.getMinutes()).padStart(2, '0')}`;

                    if (endTimeStr > sch.endTime) break;

                    const availabilityId = `avail-${doctorId}-${current.toISOString().split('T')[0]}-${currentSlotTime.replace(':', '')}`;

                    // Check if already exists
                    const existing = await DoctorAvailability.findOne({ availabilityId });
                    if (!existing) {
                        slots.push({
                            availabilityId,
                            doctorId,
                            date: new Date(current),
                            startTime: currentSlotTime,
                            endTime: endTimeStr,
                            isBooked: false
                        });
                    }

                    currentSlotTime = endTimeStr;
                }
            }
            current.setDate(current.getDate() + 1);
        }

        if (slots.length > 0) {
            await DoctorAvailability.insertMany(slots);
        }

        res.status(201).json({
            success: true,
            message: `Generated ${slots.length} availability slots`,
            data: { generatedSlots: slots.length }
        });
    } catch (error) {
        logger.error('Error generating availabilities:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /doctor-availabilities/{availabilityId}:
 *   put:
 *     summary: Update an availability slot
 *     tags: [Doctor Availabilities]
 *     parameters:
 *       - in: path
 *         name: availabilityId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoctorAvailability'
 *     responses:
 *       200:
 *         description: Availability updated
 */
router.put('/:availabilityId', async (req, res) => {
    try {
        const { availabilityId } = req.params;
        const updateData = req.body;
        delete updateData.availabilityId;

        const availability = await DoctorAvailability.findOneAndUpdate(
            { availabilityId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!availability) {
            return res.status(404).json({ success: false, message: 'Availability not found' });
        }
        res.json({ success: true, data: { availability } });
    } catch (error) {
        logger.error('Error updating availability:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /doctor-availabilities/{availabilityId}:
 *   delete:
 *     summary: Delete an availability slot
 *     tags: [Doctor Availabilities]
 *     parameters:
 *       - in: path
 *         name: availabilityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Availability deleted
 */
router.delete('/:availabilityId', async (req, res) => {
    try {
        const { availabilityId } = req.params;
        const result = await DoctorAvailability.findOneAndDelete({ availabilityId });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Availability not found' });
        }
        res.json({ success: true, message: 'Availability deleted successfully' });
    } catch (error) {
        logger.error('Error deleting availability:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
