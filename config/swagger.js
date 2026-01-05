const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Orders & Medical API Service',
            version: '1.0.0',
            description: `
                A comprehensive REST API service with full CRUD operations for:
                
                **User Management** - Complete user CRUD operations
                **Product Management** - Products with categories, real images from Unsplash
                **Category Management** - Product categories CRUD
                **Order Management** - Order processing and management
                **Cart Management** - Shopping cart operations
                **Hospital Management** - Hospital CRUD operations
                **Doctor Management** - Doctor profiles and management
                **Appointment Management** - Medical appointment booking and management
                
                All endpoints support full Create, Read, Update, Delete operations.
            `,
            contact: {
                name: 'API Support',
                email: 'support@example.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3008/api',
                description: 'Local Development Server',
            },
            {
                url: 'https://test-api-management.netlify.app/api',
                description: 'Production Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [], // No global security (as auth is currently commented out)
    },
    // Path to the API docs
    apis: ['./routes/*.js', './models/*.js'], // Files containing annotations
};

const specs = swaggerJsdoc(options);

module.exports = specs;
