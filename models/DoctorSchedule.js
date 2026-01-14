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
const mongoose = require('mongoose');

const doctorScheduleSchema = new mongoose.Schema({
    scheduleId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    doctorId: {
        type: String,
        required: true,
        index: true
    },
    dayOfWeek: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
    },
    startTime: {
        type: String, // e.g., "09:00"
        required: true
    },
    endTime: {
        type: String, // e.g., "17:00"
        required: true
    },
    slotDuration: {
        type: Number, // in minutes, e.g., 15
        default: 15
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'doctor_schedules'
});

doctorScheduleSchema.index({ doctorId: 1, dayOfWeek: 1 });

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
