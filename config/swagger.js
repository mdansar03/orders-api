const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Orders & Medical API Service',
            version: '1.0.0',
            description: 'A comprehensive API for managing orders, products, carts, and medical appointments/services.',
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
