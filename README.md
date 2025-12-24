# Isha Treat - Wholesale Grocery Platform

A secure, production-ready API for **Isha Treat**, an online wholesale grocery business. Built with Express.js, TypeScript, and Prisma ORM.

## Table of Contents

- [Features](#features)
- [What Customers Can Do](#what-customers-can-do)
- [Security Measures](#security-measures)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Mobile App Integration](#mobile-app-integration)
- [Payment Integration](#payment-integration)
- [Configuration](#configuration)

---

## Features

### Business Features
- **Product Catalog** - Categories and products with wholesale pricing
- **Shopping Cart** - Add, update, remove items with stock validation
- **Order Management** - Place orders, track delivery status
- **Order Tracking** - Real-time order status updates
- **Multiple Addresses** - Customers can save delivery addresses
- **Payment Integration** - Ready for Paystack/Flutterwave

### Technical Features
- **TypeScript** - Full type safety
- **Express.js** - Fast, scalable API
- **Prisma ORM** - Type-safe database (SQL injection protected)
- **JWT Authentication** - Secure token-based auth
- **Zod Validation** - Runtime input validation
- **Rate Limiting** - Protection against abuse

---

## What Customers Can Do

When Isha Treat customers login to the mobile app, they can:

| Feature | Description |
|---------|-------------|
| **Browse Products** | View categories and grocery items |
| **Search Products** | Find items by name or SKU |
| **Add to Cart** | Add wholesale quantities to shopping cart |
| **Manage Cart** | Update quantities, remove items |
| **Save Addresses** | Store multiple delivery addresses |
| **Place Orders** | Checkout with preferred payment method |
| **Track Orders** | See real-time order status and location |
| **Order History** | View past orders and reorder |
| **Make Payments** | Pay via card, bank transfer, or cash on delivery |

### Order Status Flow
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
                                                              ↓
                                                          CANCELLED
```

---

## Security Measures

### SQL Injection Prevention
- All queries through Prisma ORM (auto-parameterized)
- No raw SQL queries

### Authentication Security
| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcrypt (12 salt rounds) |
| JWT Tokens | 15 min access + 7 day refresh |
| Token Rotation | Single-use refresh tokens |
| Account Lockout | 5 failed attempts = 30 min lock |

### Input Validation (XSS Prevention)
- Zod schemas for all inputs
- String sanitization
- Maximum length enforcement

### HTTP Security (Helmet)
- Content-Security-Policy
- X-Frame-Options (clickjacking)
- HSTS (force HTTPS)
- XSS filter enabled

### Rate Limiting
- General API: 100 req/15 min
- Auth endpoints: 5 req/15 min

---

## Quick Start

### Prerequisites
- Node.js 18+
- SQLite (development) or PostgreSQL (production)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Generate Prisma client & run migrations
npm run prisma:generate
npm run prisma:migrate

# 4. Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `JWT_SECRET` | Secret for JWT (min 32 chars) | Yes |
| `PORT` | Server port (default: 3000) | No |
| `PAYSTACK_SECRET_KEY` | Paystack API key | For payments |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | For payments |

---

## Project Structure

```
Apinlero-MVP/
├── prisma/
│   └── schema.prisma          # Database schema (Users, Products, Orders, etc.)
├── src/
│   ├── config/                # Environment configuration
│   ├── lib/                   # Prisma client
│   ├── middleware/
│   │   ├── auth.ts            # JWT authentication
│   │   ├── security.ts        # Helmet, CORS, rate limiting
│   │   └── validate.ts        # Zod validation
│   ├── routes/
│   │   ├── auth.routes.ts     # Login, register, password
│   │   ├── product.routes.ts  # Products & categories
│   │   ├── cart.routes.ts     # Shopping cart
│   │   ├── order.routes.ts    # Orders & tracking
│   │   ├── address.routes.ts  # Delivery addresses
│   │   └── payment.routes.ts  # Payment processing
│   ├── services/
│   │   ├── auth.service.ts    # Authentication logic
│   │   ├── product.service.ts # Product operations
│   │   ├── cart.service.ts    # Cart operations
│   │   ├── order.service.ts   # Order operations
│   │   └── payment.service.ts # Payment processing
│   └── server.ts              # App entry point
└── README.md
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new customer | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/refresh` | Refresh token | No |
| POST | `/api/auth/logout` | Logout | Yes |
| GET | `/api/auth/me` | Get profile | Yes |

### Products & Categories
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products/categories` | List all categories | No |
| GET | `/api/products/categories/:id` | Category with products | No |
| GET | `/api/products` | List products (paginated) | No |
| GET | `/api/products/featured` | Featured products | No |
| GET | `/api/products/search?q=` | Search products | No |
| GET | `/api/products/:id` | Product details | No |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |

### Shopping Cart
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cart` | Get cart | Yes |
| POST | `/api/cart/items` | Add to cart | Yes |
| PUT | `/api/cart/items/:productId` | Update quantity | Yes |
| DELETE | `/api/cart/items/:productId` | Remove item | Yes |
| DELETE | `/api/cart` | Clear cart | Yes |
| GET | `/api/cart/validate` | Validate before checkout | Yes |

### Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders` | Place order | Yes |
| GET | `/api/orders` | Order history | Yes |
| GET | `/api/orders/stats` | Order statistics | Yes |
| GET | `/api/orders/:id` | Order details | Yes |
| GET | `/api/orders/:id/tracking` | Tracking history | Yes |
| POST | `/api/orders/:id/cancel` | Cancel order | Yes |
| PATCH | `/api/orders/:id/status` | Update status | Admin |

### Addresses
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/addresses` | List addresses | Yes |
| POST | `/api/addresses` | Add address | Yes |
| PUT | `/api/addresses/:id` | Update address | Yes |
| DELETE | `/api/addresses/:id` | Delete address | Yes |
| PATCH | `/api/addresses/:id/default` | Set as default | Yes |

### Payments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payments/initialize` | Start payment | Yes |
| GET | `/api/payments/verify/:ref` | Verify payment | Yes |
| GET | `/api/payments/order/:orderId` | Payment status | Yes |
| POST | `/api/payments/webhook` | Provider webhook | No |

---

## Mobile App Integration

### Example: Customer Login Flow

```javascript
// 1. Login
const response = await fetch('https://api.ishatreat.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'customer@example.com',
    password: 'SecurePass123!'
  })
});

const { data } = await response.json();
// Store tokens securely
const { accessToken, refreshToken } = data.tokens;
```

### Example: Browse Products

```javascript
// Get categories
const categories = await fetch('https://api.ishatreat.com/api/products/categories');

// Get products with pagination
const products = await fetch('https://api.ishatreat.com/api/products?page=1&limit=20&categoryId=xxx');

// Search products
const results = await fetch('https://api.ishatreat.com/api/products/search?q=rice');
```

### Example: Add to Cart & Checkout

```javascript
// Add to cart
await fetch('https://api.ishatreat.com/api/cart/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    productId: 'product_id_here',
    quantity: 10  // Wholesale quantity
  })
});

// Place order
const order = await fetch('https://api.ishatreat.com/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    addressId: 'address_id_here',
    paymentMethod: 'CARD', // or BANK_TRANSFER, CASH_ON_DELIVERY
    deliveryNotes: 'Call before delivery'
  })
});
```

### Example: Track Order

```javascript
// Get order tracking
const tracking = await fetch(`https://api.ishatreat.com/api/orders/${orderId}/tracking`, {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// Response shows status history:
// [
//   { status: 'OUT_FOR_DELIVERY', description: 'Driver en route', location: 'Lagos' },
//   { status: 'SHIPPED', description: 'Order dispatched', location: 'Warehouse' },
//   { status: 'PROCESSING', description: 'Preparing order' },
//   { status: 'CONFIRMED', description: 'Order confirmed' },
//   { status: 'PENDING', description: 'Order placed' }
// ]
```

---

## Payment Integration

The API is ready for **Paystack** or **Flutterwave** integration.

### Setup Paystack

1. Sign up at [paystack.com](https://paystack.com)
2. Get your API keys from the dashboard
3. Add to `.env`:
   ```
   PAYSTACK_SECRET_KEY=sk_live_xxxxx
   PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
   ```
4. Configure webhook URL in Paystack dashboard:
   ```
   https://api.ishatreat.com/api/payments/webhook
   ```

### Payment Methods Supported

| Method | Description |
|--------|-------------|
| `CARD` | Debit/Credit card |
| `BANK_TRANSFER` | Direct bank transfer |
| `USSD` | USSD payment |
| `CASH_ON_DELIVERY` | Pay when delivered |

### Delivery Fee Structure

| Order Value | Delivery Fee |
|-------------|--------------|
| ≥ ₦100,000 | FREE |
| Lagos | ₦2,000 |
| Ogun | ₦3,000 |
| Oyo | ₦3,500 |
| Other states | ₦5,000 |

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | Customer accounts |
| `categories` | Product categories (Rice, Beans, Oil, etc.) |
| `products` | Grocery items with wholesale pricing |
| `addresses` | Customer delivery addresses |
| `carts` | Shopping carts |
| `cart_items` | Items in cart |
| `orders` | Customer orders |
| `order_items` | Products in order |
| `order_tracking` | Order status history |
| `payments` | Payment records |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Build for production |
| `npm start` | Production server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run migrations |
| `npm run prisma:studio` | Database GUI |

---

## License

ISC

---

## Support

**Isha Treat** - Your trusted wholesale grocery partner.
