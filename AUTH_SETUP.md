# Authentication Setup Guide

## JWT Authentication Configuration

This API now uses JWT (JSON Web Tokens) for authentication. All API endpoints except authentication routes require a valid JWT token.

## Environment Variables Required

Create a `.env` file in the project root with the following variables:

```bash
# Server Configuration
PORT=3008
NODE_ENV=development

# JWT Authentication Configuration
# IMPORTANT: Generate a strong, random secret for production use
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Optional: Logging Configuration
LOG_LEVEL=info
```

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Create your `.env` file with the JWT_SECRET (see above)

3. Start the server:
```bash
npm start
# or for development
npm run dev
```

## Authentication Flow

### 1. Get Test User Credentials
```bash
GET /api/auth/test-users
```

Available test users:
- **testuser** / password123 (role: user)
- **admin** / admin123 (role: admin)
- **user456** / user456 (role: user)
- **user789** / user789 (role: user)

### 2. Login to Get JWT Token
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "user-123",
      "username": "testuser",
      "email": "testuser@example.com",
      "role": "user",
      "name": "Test User"
    },
    "expiresIn": "24h"
  }
}
```

### 3. Use JWT Token in API Requests
Include the JWT token in the Authorization header for all protected endpoints:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API Endpoints

### Public Endpoints (No Authentication Required)
- `GET /health` - Health check
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Token verification
- `GET /api/auth/test-users` - Get test user credentials
- `POST /api/auth/logout` - Logout (client-side cleanup)

### Protected Endpoints (JWT Token Required)
- `GET /api/orders/{userId}` - Get orders for user
- `GET /api/order-details/{orderId}` - Get order details
- `GET /api/delivery-details` - Get all deliveries
- `GET /api/delivery-details/{deliveryId}` - Get delivery details
- `GET /api/delivery-details/{deliveryId}/status` - Get delivery status

## Example Usage with curl

### 1. Login
```bash
curl -X POST http://localhost:3008/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### 2. Use Protected Endpoint
```bash
curl -X GET http://localhost:3008/api/orders/user-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Example Usage with JavaScript/Fetch

```javascript
// Login
const loginResponse = await fetch('http://localhost:3008/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'testuser',
    password: 'password123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.data.token;

// Use protected endpoint
const ordersResponse = await fetch('http://localhost:3008/api/orders/user-123', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const ordersData = await ordersResponse.json();
```

## Error Responses

### Missing Token (401)
```json
{
  "success": false,
  "error": "Access denied",
  "message": "Authentication token is required. Please provide a valid Bearer token in the Authorization header."
}
```

### Invalid Token (403)
```json
{
  "success": false,
  "error": "Authentication failed",
  "message": "Invalid token"
}
```

### Expired Token (403)
```json
{
  "success": false,
  "error": "Authentication failed",
  "message": "Token has expired"
}
```

## Production Considerations

1. **JWT Secret**: Use a strong, randomly generated secret (minimum 256 bits)
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Store tokens securely on the client side
4. **Token Expiration**: Tokens expire after 24 hours by default
5. **Rate Limiting**: Consider implementing rate limiting for auth endpoints
6. **Database**: Replace mock users with a real database
7. **Password Hashing**: Passwords are properly hashed using bcryptjs

## Security Features

- JWT tokens with expiration (24 hours)
- Password hashing with bcryptjs
- Role-based authorization middleware available
- Comprehensive error handling
- Request logging for security monitoring
