# Cart API Documentation

A clean and professional shopping cart API without authentication requirements.

## Base URL
```
http://localhost:3008/api/cart
```

---

## Endpoints

### 1. Add Item to Cart
Add a product to the user's cart. If the product already exists, the quantity will be incremented.

**Endpoint:** `POST /api/cart`

**Request Body:**
```json
{
  "userId": "user-123",
  "productId": "prod-001",
  "productName": "Wireless Headphones",
  "price": 79.99,
  "quantity": 2,
  "image": "https://example.com/headphones.jpg",
  "categoryId": "cat-electronics"
}
```

**Required Fields:**
- `userId` (string): User identifier
- `productId` (string): Product identifier
- `productName` (string): Product name
- `price` (number): Product price (must be positive)
- `quantity` (integer): Quantity to add (must be positive integer)

**Optional Fields:**
- `image` (string): Product image URL
- `categoryId` (string): Category identifier

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Product added to cart successfully",
  "data": {
    "cartItem": {
      "productId": "prod-001",
      "productName": "Wireless Headphones",
      "price": 79.99,
      "quantity": 2,
      "image": "https://example.com/headphones.jpg",
      "categoryId": "cat-electronics",
      "addedAt": "2024-01-15T14:30:00.000Z",
      "updatedAt": "2024-01-15T14:30:00.000Z"
    },
    "totalItems": 1,
    "totalQuantity": 2
  }
}
```

**Success Response (200 OK - if product exists and quantity updated):**
```json
{
  "success": true,
  "message": "Product quantity updated in cart",
  "data": {
    "cartItem": {
      "productId": "prod-001",
      "productName": "Wireless Headphones",
      "price": 79.99,
      "quantity": 4,
      "image": "https://example.com/headphones.jpg",
      "categoryId": "cat-electronics",
      "addedAt": "2024-01-15T14:30:00.000Z",
      "updatedAt": "2024-01-15T14:35:00.000Z"
    },
    "totalItems": 1,
    "totalQuantity": 4
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Missing required fields",
  "message": "userId, productId, productName, price, and quantity are required",
  "requiredFields": ["userId", "productId", "productName", "price", "quantity"]
}
```

---

### 2. Get Cart Items
Retrieve all items in a user's cart with summary totals.

**Endpoint:** `GET /api/cart/:userId`

**URL Parameters:**
- `userId` (string): User identifier

**Example Request:**
```
GET http://localhost:3008/api/cart/user-123
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "items": [
      {
        "productId": "prod-001",
        "productName": "Wireless Headphones",
        "price": 79.99,
        "quantity": 2,
        "image": "https://example.com/headphones.jpg",
        "categoryId": "cat-electronics",
        "addedAt": "2024-01-15T14:30:00.000Z",
        "updatedAt": "2024-01-15T14:30:00.000Z"
      },
      {
        "productId": "prod-002",
        "productName": "USB-C Cable",
        "price": 12.99,
        "quantity": 3,
        "image": "https://example.com/cable.jpg",
        "categoryId": "cat-accessories",
        "addedAt": "2024-01-15T14:32:00.000Z",
        "updatedAt": "2024-01-15T14:32:00.000Z"
      }
    ],
    "summary": {
      "totalItems": 2,
      "totalQuantity": 5,
      "totalPrice": 198.95
    }
  }
}
```

**Empty Cart Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "items": [],
    "summary": {
      "totalItems": 0,
      "totalQuantity": 0,
      "totalPrice": 0
    }
  }
}
```

---

### 3. Update Item Quantity
Update the quantity of a specific product in the cart.

**Endpoint:** `PUT /api/cart/:userId/:productId`

**URL Parameters:**
- `userId` (string): User identifier
- `productId` (string): Product identifier

**Request Body:**
```json
{
  "quantity": 5
}
```

**Required Fields:**
- `quantity` (integer): New quantity (must be positive integer)

**Example Request:**
```
PUT http://localhost:3008/api/cart/user-123/prod-001
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Cart updated successfully",
  "data": {
    "updatedItem": {
      "productId": "prod-001",
      "productName": "Wireless Headphones",
      "price": 79.99,
      "quantity": 5,
      "image": "https://example.com/headphones.jpg",
      "categoryId": "cat-electronics",
      "addedAt": "2024-01-15T14:30:00.000Z",
      "updatedAt": "2024-01-15T15:00:00.000Z"
    },
    "summary": {
      "totalItems": 2,
      "totalQuantity": 8,
      "totalPrice": 438.92
    }
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Product not found",
  "message": "Product prod-001 not found in cart"
}
```

---

### 4. Remove Item from Cart
Remove a specific product from the user's cart.

**Endpoint:** `DELETE /api/cart/:userId/:productId`

**URL Parameters:**
- `userId` (string): User identifier
- `productId` (string): Product identifier

**Example Request:**
```
DELETE http://localhost:3008/api/cart/user-123/prod-001
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Product removed from cart successfully",
  "data": {
    "removedItem": {
      "productId": "prod-001",
      "productName": "Wireless Headphones",
      "price": 79.99,
      "quantity": 2,
      "image": "https://example.com/headphones.jpg",
      "categoryId": "cat-electronics",
      "addedAt": "2024-01-15T14:30:00.000Z",
      "updatedAt": "2024-01-15T14:30:00.000Z"
    },
    "remainingItems": [
      {
        "productId": "prod-002",
        "productName": "USB-C Cable",
        "price": 12.99,
        "quantity": 3,
        "image": "https://example.com/cable.jpg",
        "categoryId": "cat-accessories",
        "addedAt": "2024-01-15T14:32:00.000Z",
        "updatedAt": "2024-01-15T14:32:00.000Z"
      }
    ],
    "summary": {
      "totalItems": 1,
      "totalQuantity": 3,
      "totalPrice": 38.97
    }
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Product not found",
  "message": "Product prod-001 not found in cart"
}
```

---

### 5. Clear Cart
Remove all items from the user's cart.

**Endpoint:** `DELETE /api/cart/:userId`

**URL Parameters:**
- `userId` (string): User identifier

**Example Request:**
```
DELETE http://localhost:3008/api/cart/user-123
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": {
    "userId": "user-123",
    "itemsCleared": 5
  }
}
```

**Empty Cart Response (200 OK):**
```json
{
  "success": true,
  "message": "Cart is already empty",
  "data": {
    "userId": "user-123",
    "itemsCleared": 0
  }
}
```

---

## Testing the API

### Using cURL

**Add to cart:**
```bash
curl -X POST http://localhost:3008/api/cart \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "productId": "prod-001",
    "productName": "Wireless Headphones",
    "price": 79.99,
    "quantity": 2,
    "image": "https://example.com/headphones.jpg"
  }'
```

**Get cart:**
```bash
curl http://localhost:3008/api/cart/user-123
```

**Update quantity:**
```bash
curl -X PUT http://localhost:3008/api/cart/user-123/prod-001 \
  -H "Content-Type: application/json" \
  -d '{"quantity": 5}'
```

**Remove item:**
```bash
curl -X DELETE http://localhost:3008/api/cart/user-123/prod-001
```

**Clear cart:**
```bash
curl -X DELETE http://localhost:3008/api/cart/user-123
```

---

## Features

✅ **No Authentication Required** - Easy to use without JWT tokens  
✅ **Automatic Quantity Update** - Adding existing products increments quantity  
✅ **Input Validation** - Comprehensive validation for all inputs  
✅ **Summary Calculations** - Automatic totals for items, quantity, and price  
✅ **Detailed Responses** - Complete information in all responses  
✅ **Error Handling** - Clear error messages for all failure cases  
✅ **Timestamps** - Track when items were added and updated  
✅ **Professional Logging** - All operations are logged with timestamps  

---

## Data Storage

The cart data is stored in-memory for this implementation. In a production environment, you would typically:
- Use a database (MongoDB, PostgreSQL, etc.)
- Implement user sessions
- Add expiration times for carts
- Persist data across server restarts

---

## Notes

1. **User Identification**: The API uses `userId` to identify carts. In a production environment, this would typically come from an authenticated session.

2. **Price Calculation**: Prices are calculated on the server side based on stored product prices to prevent client-side manipulation.

3. **Inventory Management**: This API does not check product availability. In production, you would validate against inventory before adding items.

4. **Cart Persistence**: Current implementation stores carts in memory. Data will be lost on server restart.

5. **Concurrent Updates**: For production use, implement proper locking mechanisms to handle concurrent cart updates.

---

## Error Codes

- **200 OK** - Request successful
- **201 Created** - New item added to cart
- **400 Bad Request** - Invalid input or missing required fields
- **404 Not Found** - Cart or product not found
- **500 Internal Server Error** - Server error

---

## Integration Example (JavaScript/Fetch)

```javascript
// Add to cart
async function addToCart(userId, product) {
  const response = await fetch('http://localhost:3008/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      categoryId: product.categoryId
    })
  });
  return await response.json();
}

// Get cart
async function getCart(userId) {
  const response = await fetch(`http://localhost:3008/api/cart/${userId}`);
  return await response.json();
}

// Update quantity
async function updateQuantity(userId, productId, quantity) {
  const response = await fetch(`http://localhost:3008/api/cart/${userId}/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quantity })
  });
  return await response.json();
}

// Remove from cart
async function removeFromCart(userId, productId) {
  const response = await fetch(`http://localhost:3008/api/cart/${userId}/${productId}`, {
    method: 'DELETE'
  });
  return await response.json();
}

// Clear cart
async function clearCart(userId) {
  const response = await fetch(`http://localhost:3008/api/cart/${userId}`, {
    method: 'DELETE'
  });
  return await response.json();
}
```

---

**Version:** 1.0.0  
**Last Updated:** October 2, 2025

