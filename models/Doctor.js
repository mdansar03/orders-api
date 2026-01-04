const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    doctorId: {
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
    specialty: {
        type: String,
        required: true
    },
    hospitalId: {
        type: String,
        required: true,
        index: true
    },
    hospitalName: {
        type: String
    },
    qualification: {
        type: String
    },
    experience: {
        type: Number,
        min: 0,
        default: 0
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
    consultationFee: {
        type: Number,
        min: 0,
        default: 0
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    availableDays: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    availableTimeSlots: [{
        startTime: String,
        endTime: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'doctors'
});

// Indexes
doctorSchema.index({ name: 'text', specialty: 'text' });
doctorSchema.index({ hospitalId: 1 });
doctorSchema.index({ specialty: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
