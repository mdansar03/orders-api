# Orders Service

A lightweight, standalone API service for order management. This service provides endpoints for retrieving orders and order details, designed to be easily deployed to any hosting platform.

## 🚀 Quick Start

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the server**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

3. **Test the service**
   ```bash
   curl http://localhost:3000/health
   ```

## 📋 API Endpoints

### Health Check
- **GET** `/health` - Service health status

### Orders API
- **GET** `/api/orders/{userId}` - Get all orders for a user
- **GET** `/api/order-details/{orderId}` - Get detailed order information

### Example Requests

```bash
# Get orders for user "user-123"
curl http://localhost:3000/api/orders/user-123

# Get details for order "4" (test case)
curl http://localhost:3000/api/order-details/4

# Get orders for user "4" (test case)
curl http://localhost:3000/api/orders/4
```

## 🌐 Deployment Options

### 1. Railway (Recommended - Free & Fast)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

1. Create account at [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub and select the repository
4. Railway will auto-detect the Node.js project
5. Your service will be live at `https://your-app-name.railway.app`

### 2. Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-orders-service

# Deploy
git add .
git commit -m "Deploy orders service"
git push heroku main
```

### 3. Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### 4. Render

1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Deploy!

### 5. DigitalOcean App Platform

1. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
   - **Port**: `3000`

### 6. AWS Lambda (using Serverless)

If you prefer serverless deployment:

```bash
npm install -g serverless
npm install serverless-http

# Create serverless.yml (see example below)
serverless deploy
```

Example `serverless.yml`:
```yaml
service: orders-service

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1

functions:
  app:
    handler: lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file or set these environment variables:

```env
# Required
PORT=3000                # Port for the service (auto-set by most platforms)
NODE_ENV=production      # Environment mode

# Optional - customize as needed
# API_KEY=your-key-here  # If you want to add API authentication
```

### Mock Data

The service includes comprehensive mock data with:

- **Users**: `user-123`, `user-456`, `user-789`, `user-999`, `4`
- **Orders**: Multiple orders per user with various statuses
- **Order Details**: Complete order information including customer, items, shipping, payment

#### Test Cases Included:
- User ID `4` has orders (fixes the original failing test case)
- Order ID `4` has complete details
- Various order statuses: shipped, delivered, processing, pending, cancelled

## 🛠️ Updating Action Groups

After deploying, update your AWS Bedrock Action Group configuration:

1. **Update Base URL**: Change from `http://localhost:3002` to your deployed URL
   ```json
   {
     "baseUrl": "https://your-deployed-service.railway.app"
   }
   ```

2. **Test endpoints**:
   - `GET /api/orders/{userId}`
   - `GET /api/order-details/{orderId}`

3. **Update Action Group**: Use your main application's action group management interface

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Use different port
   PORT=3001 npm start
   ```

2. **CORS issues**
   - Service is configured to allow all origins by default
   - For production, customize CORS in `server.js`

3. **Service health check**
   ```bash
   curl https://your-service.com/health
   ```

### Testing Deployment

```bash
# Test health
curl https://your-deployed-url.com/health

# Test orders endpoint
curl https://your-deployed-url.com/api/orders/4

# Test order details
curl https://your-deployed-url.com/api/order-details/4
```

## 📦 Dependencies

- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

Total size: ~15MB (very lightweight!)

## 🔄 Updates

To update the service:

1. Make changes to the code
2. Commit and push to your repository
3. Most platforms auto-deploy on git push
4. Test the updated endpoints

---

**Need help?** The service is designed to be simple and self-contained. Check the console logs for any deployment issues.
