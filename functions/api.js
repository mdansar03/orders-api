const serverless = require('serverless-http');
const app = require('../server');
const { connectDB } = require('../config/database');

// Create the serverless handler
const handler = serverless(app);

// Wrap the handler to ensure DB connection
module.exports.handler = async (event, context) => {
    // Make sure to add this context property for some express features
    context.callbackWaitsForEmptyEventLoop = false;

    // Connect to database
    await connectDB();

    // Return the handler response
    return handler(event, context);
};
