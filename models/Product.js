const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    categoryId: {
        type: String,
        required: true,
        index: true
    },
    categoryName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    inStock: {
        type: Boolean,
        default: true
    },
    stockQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    imageUrl: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'products'
});

// Indexes for better query performance
productSchema.index({ categoryId: 1, inStock: 1 });
productSchema.index({ productName: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
