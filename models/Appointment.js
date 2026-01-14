/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       properties:
 *         appointmentId:
 *           type: string
 *         userId:
 *           type: string
 *         userName:
 *           type: string
 *         doctorId:
 *           type: string
 *         doctorName:
 *           type: string
 *         hospitalId:
 *           type: string
 *         hospitalName:
 *           type: string
 *         appointmentDate:
 *           type: string
 *           format: date-time
 *         timeSlot:
 *           type: object
 *           properties:
 *             startTime:
 *               type: string
 *             endTime:
 *               type: string
 *         status:
 *           type: string
 *           enum: [booked, cancelled, completed, no-show]
 *         reason:
 *           type: string
 *         notes:
 *           type: string
 *         consultationFee:
 *           type: number
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, refunded]
 */
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    userName: {
        type: String,
        required: true
    },
    doctorId: {
        type: String,
        required: true,
        index: true
    },
    doctorName: {
        type: String,
        required: true
    },
    hospitalId: {
        type: String,
        required: true
    },
    hospitalName: {
        type: String
    },
    appointmentDate: {
        type: Date,
        required: true,
        index: true
    },
    timeSlot: {
        startTime: {
            type: String,
            required: true
        },
        endTime: {
            type: String,
            required: true
        }
    },
    status: {
        type: String,
        enum: ['booked', 'cancelled', 'completed', 'no-show'],
        default: 'booked'
    },
    reason: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    consultationFee: {
        type: Number,
        min: 0,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    }
}, {
    timestamps: true,
    collection: 'appointments'
});

// Indexes
appointmentSchema.index({ userId: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
