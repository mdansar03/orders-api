const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Hospital = require('./models/Hospital');
const Doctor = require('./models/Doctor');
const Order = require('./models/Order');
const Appointment = require('./models/Appointment');
const Cart = require('./models/Cart');

// Configuration
const BATCH_SIZE = 6; // Minimum items per entity

// Helper identifiers for linking
let createdUsers = [];
let createdCategories = [];
let createdProducts = [];
let createdHospitals = [];
let createdDoctors = [];

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI is not set in .env');

        // Match the server configuration
        await mongoose.connect(uri, {
            dbName: 'api_hub'
        });
        console.log('✅ Connected to MongoDB (Database: api_hub)');
    } catch (err) {
        console.error('❌ Failed to connect to MongoDB:', err.message);
        process.exit(1);
    }
};

const clearDB = async () => {
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Hospital.deleteMany({});
    await Doctor.deleteMany({});
    await Order.deleteMany({});
    await Appointment.deleteMany({});
    await Cart.deleteMany({});
    console.log('✨ Database cleared');
};

const seedUsers = async () => {
    console.log('🌱 Seeding Users...');
    const users = [
        { name: 'John Doe', username: 'johndoe', email: 'john@example.com', role: 'user' },
        { name: 'Jane Smith', username: 'janesmith', email: 'jane@example.com', role: 'admin' },
        { name: 'Alice Johnson', username: 'alicej', email: 'alice@example.com', role: 'user' },
        { name: 'Bob Wilson', username: 'bobw', email: 'bob@example.com', role: 'user' },
        { name: 'Charlie Brown', username: 'charlieb', email: 'charlie@example.com', role: 'user' },
        { name: 'Diana Prince', username: 'dianap', email: 'diana@example.com', role: 'user' }
    ];

    const userDocs = users.map((u, i) => ({
        userId: `user-${String(i + 1).padStart(3, '0')}`,
        username: u.username,
        email: u.email,
        passwordHash: '$2a$10$abcdefg...', // Mock hash
        name: u.name,
        role: u.role,
        isActive: true
    }));

    createdUsers = await User.insertMany(userDocs);
    console.log(`✅ Created ${createdUsers.length} Users`);
};

const seedCategories = async () => {
    console.log('🌱 Seeding Categories...');
    const categories = [
        { name: 'Electronics', desc: 'Gadgets and devices' },
        { name: 'Clothing', desc: 'Men and women fashion' },
        { name: 'Home & Garden', desc: 'Decor and tools' },
        { name: 'Books', desc: 'Fiction and non-fiction' },
        { name: 'Sports', desc: 'Equipment and apparel' },
        { name: 'Beauty', desc: 'Skincare and makeup' }
    ];

    const catDocs = categories.map((c, i) => ({
        categoryId: `cat-${String(i + 1).padStart(3, '0')}`,
        categoryName: c.name,
        description: c.desc,
        isActive: true
    }));

    createdCategories = await Category.insertMany(catDocs);
    console.log(`✅ Created ${createdCategories.length} Categories`);
};

/**
 * Generate a real working image URL from Unsplash Source
 */
const generateImageUrl = (categoryName = 'product', width = 800, height = 600) => {
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
    
    return `https://source.unsplash.com/${width}x${height}/?${searchTerm}`;
};

const seedProducts = async () => {
    console.log('🌱 Seeding Products...');
    const productsData = [
        { name: 'Smartphone X', price: 999, stock: 50, catInvalid: 0 },
        { name: 'Laptop Pro', price: 1499, stock: 30, catInvalid: 0 },
        { name: 'Cotton T-Shirt', price: 25, stock: 100, catInvalid: 1 },
        { name: 'Running Shoes', price: 89, stock: 45, catInvalid: 4 },
        { name: 'Gardening Set', price: 45, stock: 20, catInvalid: 2 },
        { name: 'Novel Collection', price: 35, stock: 60, catInvalid: 3 },
        { name: 'Face Serum', price: 55, stock: 80, catInvalid: 5 },
        { name: 'Wireless Earbuds', price: 129, stock: 150, catInvalid: 0 }
    ];

    const prodDocs = productsData.map((p, i) => {
        const category = createdCategories[p.catInvalid] || createdCategories[0];
        return {
            productId: `prod-${String(i + 1).padStart(3, '0')}`,
            productName: p.name,
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            description: `High quality ${p.name}`,
            price: p.price,
            inStock: p.stock > 0,
            stockQuantity: p.stock,
            imageUrl: generateImageUrl(category.categoryName),
            isActive: true
        };
    });

    createdProducts = await Product.insertMany(prodDocs);
    console.log(`✅ Created ${createdProducts.length} Products with real images`);
};

const seedHospitals = async () => {
    console.log('🌱 Seeding Hospitals...');
    const hospitals = [
        { name: 'City General Hospital', city: 'New York', state: 'NY' },
        { name: 'Westfield Medical Center', city: 'Los Angeles', state: 'CA' },
        { name: 'Memorial Sloan', city: 'Chicago', state: 'IL' },
        { name: 'Sunshine Pediatrics', city: 'Miami', state: 'FL' },
        { name: 'North Heart Institute', city: 'Boston', state: 'MA' },
        { name: 'Central Trauma Center', city: 'Dallas', state: 'TX' }
    ];

    const hospDocs = hospitals.map((h, i) => ({
        hospitalId: `hosp-${String(i + 1).padStart(3, '0')}`,
        name: h.name,
        address: {
            street: `${Math.floor(Math.random() * 1000)} Main St`,
            city: h.city,
            state: h.state,
            zipCode: '10001',
            country: 'USA'
        },
        phone: `555-010${i}`,
        email: `contact@${h.name.toLowerCase().replace(/\s/g, '')}.com`,
        specialties: ['Cardiology', 'Emergency', 'Pediatrics'],
        rating: 4 + (Math.random()),
        totalBeds: 100 + Math.floor(Math.random() * 400),
        isActive: true
    }));

    createdHospitals = await Hospital.insertMany(hospDocs);
    console.log(`✅ Created ${createdHospitals.length} Hospitals`);
};

const seedDoctors = async () => {
    console.log('🌱 Seeding Doctors...');
    const doctorNames = ['Dr. Smith', 'Dr. Jones', 'Dr. Williams', 'Dr. Brown', 'Dr. Davis', 'Dr. Miller', 'Dr. Wilson', 'Dr. Moore'];
    const specialties = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Surgery'];

    const docDocs = doctorNames.map((name, i) => {
        const hospital = createdHospitals[i % createdHospitals.length];
        const specialty = specialties[i % specialties.length];
        return {
            doctorId: `doc-${String(i + 1).padStart(3, '0')}`,
            name: name,
            specialty: specialty,
            hospitalId: hospital.hospitalId,
            hospitalName: hospital.name,
            qualification: 'MD',
            experience: 5 + Math.floor(Math.random() * 20),
            phone: `555-020${i}`,
            email: `${name.toLowerCase().replace(/[\s.]/g, '')}@example.com`,
            consultationFee: 100 + Math.floor(Math.random() * 200),
            rating: 3.5 + (Math.random() * 1.5),
            availableDays: ['Monday', 'Wednesday', 'Friday'],
            availableTimeSlots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '14:00', endTime: '17:00' }],
            isActive: true
        };
    });

    createdDoctors = await Doctor.insertMany(docDocs);
    console.log(`✅ Created ${createdDoctors.length} Doctors`);
};

const seedOrders = async () => {
    console.log('🌱 Seeding Orders...');

    // Create random orders
    const orders = [];
    for (let i = 0; i < 8; i++) {
        const user = createdUsers[i % createdUsers.length];
        const numItems = 1 + Math.floor(Math.random() * 3);
        const orderItems = [];
        let totalAmount = 0;

        for (let j = 0; j < numItems; j++) {
            const product = createdProducts[(i + j) % createdProducts.length];
            const qty = 1 + Math.floor(Math.random() * 2);
            const subtotal = product.price * qty;
            totalAmount += subtotal;
            orderItems.push({
                productId: product.productId,
                productName: product.productName,
                quantity: qty,
                price: product.price,
                subtotal: subtotal
            });
        }

        orders.push({
            orderId: `ord-${String(i + 1).padStart(5, '0')}`,
            userId: user.userId,
            status: ['pending', 'processing', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
            totalAmount: totalAmount,
            items: orderItems,
            shippingAddress: {
                street: '123 Test Ave',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'USA'
            },
            paymentMethod: 'credit_card',
            paymentStatus: 'paid'
        });
    }

    await Order.insertMany(orders);
    console.log(`✅ Created ${orders.length} Orders`);
};

const seedAppointments = async () => {
    console.log('🌱 Seeding Appointments...');
    const appointments = [];
    const statuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];

    for (let i = 0; i < 8; i++) {
        const user = createdUsers[i % createdUsers.length];
        const doctor = createdDoctors[i % createdDoctors.length];
        const date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * 14)); // Next 2 weeks

        appointments.push({
            appointmentId: `apt-${String(i + 1).padStart(6, '0')}`,
            userId: user.userId,
            userName: user.name,
            doctorId: doctor.doctorId,
            doctorName: doctor.name,
            hospitalId: doctor.hospitalId,
            hospitalName: doctor.hospitalName,
            appointmentDate: date,
            timeSlot: { startTime: '10:00', endTime: '10:30' },
            status: statuses[Math.floor(Math.random() * statuses.length)],
            reason: 'Regular Checkup',
            notes: 'Patient requesting annual review',
            consultationFee: doctor.consultationFee,
            paymentStatus: Math.random() > 0.5 ? 'paid' : 'pending'
        });
    }

    await Appointment.insertMany(appointments);
    console.log(`✅ Created ${appointments.length} Appointments`);
};

const seed = async () => {
    try {
        await connectDB();
        await clearDB();

        await seedUsers();
        await seedCategories();
        await seedProducts();
        await seedHospitals();
        await seedDoctors();
        await seedOrders();
        await seedAppointments();

        console.log('🎉 Database seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seed();
