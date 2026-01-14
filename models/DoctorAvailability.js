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
const mongoose = require('mongoose');

const doctorAvailabilitySchema = new mongoose.Schema({
    availabilityId: {
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
    date: {
        type: Date,
        required: true,
        index: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    isBooked: {
        type: Boolean,
        default: false
    },
    appointmentId: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: 'doctor_availabilities'
});

doctorAvailabilitySchema.index({ doctorId: 1, date: 1, isBooked: 1 });

module.exports = mongoose.model('DoctorAvailability', doctorAvailabilitySchema);
