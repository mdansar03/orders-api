/**
 * @swagger
 * components:
 *   schemas:
 *     Hospital:
 *       type: object
 *       properties:
 *         hospitalId:
 *           type: string
 *         name:
 *           type: string
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *             country:
 *               type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         specialties:
 *           type: array
 *           items:
 *             type: string
 *         rating:
 *           type: number
 *         isActive:
 *           type: boolean
 */
const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    hospitalId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    specialties: [{
        type: String
    }],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    totalBeds: {
        type: Number,
        default: 0
    },
    availableBeds: {
        type: Number,
        default: 0
    },
    emergencyServices: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'hospitals'
});

// Indexes
hospitalSchema.index({ name: 'text' });
hospitalSchema.index({ 'address.city': 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);
