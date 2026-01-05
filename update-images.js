const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Product = require('./models/Product');
const { connectDB } = require('./config/database');

/**
 * Generate a real working image URL from Unsplash Source
 * @param {string} categoryName - Category name to generate relevant image
 * @param {number} width - Image width (default: 800)
 * @param {number} height - Image height (default: 600)
 * @returns {string} Image URL
 */
const generateImageUrl = (categoryName = 'product', width = 800, height = 600) => {
  // Map categories to relevant Unsplash search terms
  const categoryMap = {
    'electronics': 'electronics',
    'clothing': 'fashion',
    'food': 'food',
    'books': 'books',
    'furniture': 'furniture',
    'sports': 'sports',
    'toys': 'toys',
    'beauty': 'cosmetics',
    'health': 'health',
    'automotive': 'car',
    'home & garden': 'home',
    'garden': 'garden',
    'default': 'product'
  };

  const normalizedCategory = categoryName.toLowerCase().trim();
  const searchTerm = categoryMap[normalizedCategory] || 
                     categoryMap[Object.keys(categoryMap).find(key => normalizedCategory.includes(key))] || 
                     categoryMap['default'];
  
  // Use Unsplash Source API for real working images
  // Format: https://source.unsplash.com/{width}x{height}/?{search_term}
  return `https://source.unsplash.com/${width}x${height}/?${searchTerm}`;
};

const updateProductImages = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log('📦 Fetching all active products...');
    const products = await Product.find({ isActive: true });

    if (products.length === 0) {
      console.log('ℹ️  No products found to update');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`📸 Found ${products.length} products. Updating images...\n`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const product of products) {
      try {
        const newImageUrl = generateImageUrl(product.categoryName);
        
        await Product.updateOne(
          { productId: product.productId },
          { $set: { imageUrl: newImageUrl } }
        );

        updatedCount++;
        console.log(`✅ Updated: ${product.productName} (${product.categoryName})`);
        console.log(`   Image: ${newImageUrl}`);
      } catch (error) {
        failedCount++;
        console.error(`❌ Failed to update ${product.productName}:`, error.message);
      }
    }

    console.log(`\n✨ Update completed!`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   📊 Total: ${products.length}`);

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error updating product images:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the update
updateProductImages();

