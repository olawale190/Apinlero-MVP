# Apinlero MVP

A secure, production-ready API boilerplate built with Express.js, TypeScript, and Prisma ORM.

## Table of Contents

- [Features](#features)
- [Security Measures](#security-measures)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Security Documentation](#security-documentation)
- [Configuration](#configuration)
- [Development](#development)

---

## Features

- **TypeScript** - Full type safety and better developer experience
- **Express.js** - Fast, unopinionated web framework
- **Prisma ORM** - Type-safe database access (prevents SQL injection)
- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **Zod Validation** - Runtime type validation for all inputs
- **Security First** - Multiple layers of protection against common attacks

---

## Security Measures

This project implements comprehensive security measures to protect against OWASP Top 10 vulnerabilities and other common threats.

### 1. SQL Injection Prevention

| Implementation | Description |
|----------------|-------------|
| **Prisma ORM** | All database queries use Prisma's query builder, which automatically parameterizes queries |
| **No Raw SQL** | Raw SQL queries are avoided; all interactions go through Prisma |
| **Type Safety** | TypeScript ensures query parameters are correctly typed |

**Example of safe query:**
```typescript
// Prisma automatically parameterizes this - safe from SQL injection
const user = await prisma.user.findUnique({
  where: { email: userInput }
});
```

### 2. Authentication Security

| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | bcrypt with configurable salt rounds (default: 12) |
| **JWT Tokens** | Short-lived access tokens (15 min) + secure refresh tokens |
| **Token Rotation** | Refresh tokens are rotated on use (one-time use) |
| **Account Lockout** | 5 failed attempts = 30 minute lockout |
| **Session Management** | Refresh tokens stored in DB, can be revoked |

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### 3. Input Validation (XSS Prevention)

| Protection | Implementation |
|------------|----------------|
| **Zod Schemas** | All input validated against strict schemas |
| **Type Coercion** | Inputs are coerced to expected types |
| **String Sanitization** | Script tags and event handlers removed |
| **Length Limits** | Maximum lengths enforced on all string fields |

**Location:** `src/middleware/validate.ts`

### 4. HTTP Security Headers (Helmet)

| Header | Protection |
|--------|------------|
| **Content-Security-Policy** | Prevents XSS by controlling resource loading |
| **X-Frame-Options** | Prevents clickjacking attacks |
| **X-Content-Type-Options** | Prevents MIME type sniffing |
| **Strict-Transport-Security** | Forces HTTPS connections |
| **X-XSS-Protection** | Browser XSS filter enabled |
| **Referrer-Policy** | Controls referrer information |

**Location:** `src/middleware/security.ts`

### 5. Rate Limiting

| Endpoint Type | Limit |
|--------------|-------|
| **General API** | 100 requests per 15 minutes |
| **Auth Endpoints** | 5 requests per 15 minutes |

**Location:** `src/middleware/security.ts`

### 6. CORS Configuration

- Whitelist-based origin control
- Credentials support enabled
- Configurable via environment variables

### 7. Request Security

| Feature | Description |
|---------|-------------|
| **Body Size Limit** | Maximum 10KB request body |
| **JSON Only** | Only accepts application/json |
| **Trust Proxy** | Properly configured for production |

### 8. Audit Logging

All security-relevant actions are logged:
- Login attempts (success/failure)
- Password changes
- Token refresh
- Logout events

**Location:** Database table `audit_logs`

### 9. Error Handling

- Production errors don't expose stack traces
- Consistent error response format
- No sensitive data in error messages

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd Apinlero-MVP
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT (min 32 chars) | Yes |
| `JWT_EXPIRES_IN` | Access token expiry (default: 15m) | No |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (default: 7d) | No |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (default: 900000) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window (default: 100) | No |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds (default: 12) | No |

---

## Project Structure

```
Apinlero-MVP/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── config/
│   │   └── index.ts        # Configuration management
│   ├── lib/
│   │   └── prisma.ts       # Prisma client instance
│   ├── middleware/
│   │   ├── auth.ts         # Authentication middleware
│   │   ├── security.ts     # Security middleware (Helmet, CORS, Rate Limiting)
│   │   ├── validate.ts     # Input validation middleware
│   │   └── index.ts        # Middleware exports
│   ├── routes/
│   │   ├── auth.routes.ts  # Authentication routes
│   │   └── index.ts        # Route aggregation
│   ├── services/
│   │   └── auth.service.ts # Authentication business logic
│   └── server.ts           # Application entry point
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/refresh` | Refresh access token | No (refresh token) |
| POST | `/api/auth/logout` | Logout (revoke token) | Yes |
| POST | `/api/auth/logout-all` | Logout all devices | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |
| GET | `/api/auth/me` | Get current user | Yes |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health status |

### Request/Response Examples

**Register:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Response
{
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "role": "USER"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "a1b2c3..."
    }
  }
}
```

**Authenticated Request:**
```bash
GET /api/auth/me
Authorization: Bearer eyJhbG...
```

---

## Configuration

### Database Schema

The database includes these security-focused tables:

- **users** - User accounts with password hashing, lockout tracking
- **refresh_tokens** - Secure token storage with revocation support
- **api_keys** - For programmatic API access (hashed storage)
- **audit_logs** - Security event logging

### Security Configuration

All security settings can be adjusted in `src/config/index.ts` and via environment variables.

---

## Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio (DB GUI) |
| `npm run audit` | Run npm security audit |
| `npm run lint` | Run ESLint |

### Adding New Routes

1. Create route file in `src/routes/`
2. Import and use validation middleware
3. Register in `src/routes/index.ts`

### Security Best Practices for Development

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Run `npm audit` regularly** - Check for vulnerable dependencies
3. **Use TypeScript strict mode** - Catch type errors early
4. **Validate all inputs** - Create Zod schemas for new endpoints
5. **Use parameterized queries** - Never concatenate user input in SQL

---

## Security Checklist

Before deploying to production, ensure:

- [ ] `JWT_SECRET` is a strong, random 32+ character string
- [ ] `NODE_ENV` is set to `production`
- [ ] Database uses SSL connection
- [ ] HTTPS is enforced (via reverse proxy)
- [ ] `ALLOWED_ORIGINS` contains only your domains
- [ ] Rate limits are appropriate for your use case
- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] Audit logging is configured and monitored
- [ ] Database backups are configured
- [ ] Error monitoring is set up (e.g., Sentry)

---

## License

ISC

---

## Support

For security issues, please report responsibly via private channels.
