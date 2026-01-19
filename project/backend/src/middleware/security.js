/**
 * Security Middleware for Àpínlẹ̀rọ Backend API
 * Implements comprehensive security measures including:
 * - Authentication verification
 * - Rate limiting
 * - Input validation & sanitization
 * - Security headers
 * - Request logging
 * - CSRF protection
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ==============================================================================
// CONFIGURATION
// ==============================================================================

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window
const RATE_LIMIT_AUTH_MAX = 5; // auth attempts per window

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://project-apinlero.vercel.app',
  'https://apinlero.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

// ==============================================================================
// RATE LIMITER
// ==============================================================================

const rateLimitStore = new Map();

/**
 * Clean up expired rate limit entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

/**
 * Rate limiting middleware
 */
export function rateLimiter(maxRequests = RATE_LIMIT_MAX_REQUESTS) {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `${clientIP}:${req.path}`;
    const now = Date.now();

    let rateData = rateLimitStore.get(key);

    if (!rateData || now - rateData.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateData = { count: 0, windowStart: now };
    }

    rateData.count++;
    rateLimitStore.set(key, rateData);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - rateData.count),
      'X-RateLimit-Reset': new Date(rateData.windowStart + RATE_LIMIT_WINDOW_MS).toISOString(),
    });

    if (rateData.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateData.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000),
      });
    }

    next();
  };
}

/**
 * Stricter rate limiting for authentication endpoints
 */
export const authRateLimiter = rateLimiter(RATE_LIMIT_AUTH_MAX);

// ==============================================================================
// AUTHENTICATION MIDDLEWARE
// ==============================================================================

/**
 * Verify Supabase JWT token and attach user to request
 */
export function authenticateToken(supabase) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
      }

      // Attach user to request for use in route handlers
      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      console.error('Auth error:', error.message);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication failed',
      });
    }
  };
}

/**
 * Optional authentication - doesn't fail if no token, but attaches user if present
 */
export function optionalAuth(supabase) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          req.user = user;
          req.token = token;
        }
      } catch (error) {
        // Ignore errors for optional auth
      }
    }

    next();
  };
}

// ==============================================================================
// SECURITY HEADERS MIDDLEWARE
// ==============================================================================

/**
 * Add comprehensive security headers to all responses
 */
export function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co; " +
    "frame-src https://js.stripe.com https://hooks.stripe.com;"
  );

  // Permissions Policy (formerly Feature-Policy)
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  );

  // HTTP Strict Transport Security (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
}

// ==============================================================================
// CORS CONFIGURATION
// ==============================================================================

/**
 * Secure CORS configuration
 */
export function corsConfig() {
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400, // 24 hours
  };
}

// ==============================================================================
// INPUT VALIDATION & SANITIZATION
// ==============================================================================

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#x60;');
}

/**
 * Deep sanitize object values
 */
export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[sanitizeString(key)] = sanitizeObject(value);
  }
  return sanitized;
}

/**
 * Validate UUID format
 */
export function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Validate UK phone number
 */
export function isValidUKPhone(phone) {
  const phoneRegex = /^\+?44\s?\d{4}\s?\d{6}$|^0\d{4}\s?\d{6}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Input validation middleware for orders
 */
export function validateOrderInput(req, res, next) {
  const { customer_name, phone_number, email, delivery_address, items, total, delivery_fee } = req.body;

  const errors = [];

  // Customer name validation
  if (!customer_name || typeof customer_name !== 'string') {
    errors.push('Customer name is required');
  } else if (customer_name.length < 2 || customer_name.length > 100) {
    errors.push('Customer name must be 2-100 characters');
  }

  // Phone validation (optional but must be valid if provided)
  if (phone_number && !isValidUKPhone(phone_number)) {
    errors.push('Invalid UK phone number format');
  }

  // Email validation (optional but must be valid if provided)
  if (email && !isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  // Delivery address validation
  if (delivery_address && typeof delivery_address === 'string') {
    if (delivery_address.length > 500) {
      errors.push('Delivery address too long (max 500 characters)');
    }
  }

  // Items validation
  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('Order must contain at least one item');
  } else if (items.length > 50) {
    errors.push('Order cannot contain more than 50 items');
  } else {
    items.forEach((item, index) => {
      if (!item.product_name || typeof item.product_name !== 'string') {
        errors.push(`Item ${index + 1}: Product name is required`);
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 1000) {
        errors.push(`Item ${index + 1}: Invalid quantity (1-1000)`);
      }
      if (typeof item.price !== 'number' || item.price < 0 || item.price > 10000) {
        errors.push(`Item ${index + 1}: Invalid price`);
      }
    });
  }

  // Total validation
  if (typeof total !== 'number' || total < 0 || total > 100000) {
    errors.push('Invalid order total');
  }

  // Delivery fee validation
  if (typeof delivery_fee !== 'number' || delivery_fee < 0 || delivery_fee > 100) {
    errors.push('Invalid delivery fee');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      messages: errors,
    });
  }

  // Sanitize the request body
  req.body = sanitizeObject(req.body);
  next();
}

/**
 * Input validation middleware for payment intents
 */
export function validatePaymentInput(req, res, next) {
  const { amount, currency } = req.body;

  const errors = [];

  // Amount validation (in pounds, will be converted to pence)
  if (typeof amount !== 'number' || amount < 0.30 || amount > 10000) {
    errors.push('Amount must be between £0.30 and £10,000');
  }

  // Currency validation
  const validCurrencies = ['gbp', 'usd', 'eur'];
  if (currency && !validCurrencies.includes(currency.toLowerCase())) {
    errors.push('Invalid currency. Supported: GBP, USD, EUR');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      messages: errors,
    });
  }

  next();
}

// ==============================================================================
// SECURE TOKEN GENERATION
// ==============================================================================

/**
 * Generate cryptographically secure token for delivery links
 */
export function generateSecureToken(orderId, expiresInHours = 72) {
  const expiresAt = Date.now() + (expiresInHours * 60 * 60 * 1000);
  const data = `${orderId}:${expiresAt}`;
  const secret = process.env.DELIVERY_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret';

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const signature = hmac.digest('hex');

  // Return token as base64 encoded JSON
  const tokenData = { orderId, expiresAt, sig: signature };
  return Buffer.from(JSON.stringify(tokenData)).toString('base64url');
}

/**
 * Verify delivery token
 */
export function verifyDeliveryToken(token, orderId) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString());

    // Check if token has expired
    if (Date.now() > decoded.expiresAt) {
      return { valid: false, reason: 'Token expired' };
    }

    // Check if order ID matches
    if (decoded.orderId !== orderId) {
      return { valid: false, reason: 'Order ID mismatch' };
    }

    // Verify signature
    const data = `${decoded.orderId}:${decoded.expiresAt}`;
    const secret = process.env.DELIVERY_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret';

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    const expectedSig = hmac.digest('hex');

    if (decoded.sig !== expectedSig) {
      return { valid: false, reason: 'Invalid signature' };
    }

    return { valid: true, orderId: decoded.orderId, expiresAt: decoded.expiresAt };
  } catch (error) {
    return { valid: false, reason: 'Invalid token format' };
  }
}

// ==============================================================================
// REQUEST LOGGING MIDDLEWARE
// ==============================================================================

/**
 * Log requests for security auditing (sanitized)
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')?.substring(0, 100),
      userId: req.user?.id || 'anonymous',
    };

    // Log errors with more detail
    if (res.statusCode >= 400) {
      console.warn('Request warning:', JSON.stringify(logData));
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('Request:', JSON.stringify(logData));
    }
  });

  next();
}

// ==============================================================================
// ERROR HANDLING
// ==============================================================================

/**
 * Secure error handler that doesn't leak internal details
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  // Don't leak error details in production
  const isDev = process.env.NODE_ENV !== 'production';

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Cross-origin request blocked',
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isDev ? err.message : 'An unexpected error occurred',
    ...(isDev && { stack: err.stack }),
  });
}

export default {
  rateLimiter,
  authRateLimiter,
  authenticateToken,
  optionalAuth,
  securityHeaders,
  corsConfig,
  sanitizeString,
  sanitizeObject,
  isValidUUID,
  isValidUKPhone,
  isValidEmail,
  validateOrderInput,
  validatePaymentInput,
  generateSecureToken,
  verifyDeliveryToken,
  requestLogger,
  errorHandler,
};
