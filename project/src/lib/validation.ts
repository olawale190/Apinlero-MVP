import { z } from 'zod';

// ==============================================================================
// INPUT VALIDATION SCHEMAS
// ==============================================================================
// Comprehensive validation for all user inputs to prevent security vulnerabilities

// Phone number validation (UK format)
const phoneRegex = /^\+?44\s?\d{4}\s?\d{6}$|^0\d{4}\s?\d{6}$/;

// Email validation
const emailSchema = z.string().email('Invalid email address').max(255);

// Product validation
export const productSchema = z.object({
  name: z.string()
    .min(2, 'Product name must be at least 2 characters')
    .max(100, 'Product name must be less than 100 characters')
    .trim()
    .refine(val => !val.includes('<') && !val.includes('>'), {
      message: 'Product name contains invalid characters'
    }),
  price: z.number()
    .positive('Price must be positive')
    .max(10000, 'Price cannot exceed £10,000')
    .refine(val => Number(val.toFixed(2)) === val, {
      message: 'Price can only have 2 decimal places'
    }),
  category: z.string()
    .max(50, 'Category must be less than 50 characters')
    .trim()
    .optional(),
  image_url: z.string()
    .url('Invalid image URL')
    .max(500, 'Image URL too long')
    .optional()
    .or(z.literal('')),
  stock_quantity: z.number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(10000, 'Stock quantity too high')
    .optional(),
});

// Order item validation
export const orderItemSchema = z.object({
  product_name: z.string()
    .min(2, 'Product name required')
    .max(100, 'Product name too long')
    .trim(),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be positive')
    .max(1000, 'Quantity too high'),
  price: z.number()
    .positive('Price must be positive')
    .max(10000, 'Price too high'),
});

// Order validation
export const orderSchema = z.object({
  customer_name: z.string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(100, 'Customer name must be less than 100 characters')
    .trim()
    .refine(val => !val.includes('<') && !val.includes('>'), {
      message: 'Customer name contains invalid characters'
    }),
  phone_number: z.string()
    .regex(phoneRegex, 'Invalid UK phone number format')
    .or(z.literal('')),
  delivery_address: z.string()
    .min(5, 'Delivery address must be at least 5 characters')
    .max(500, 'Delivery address too long')
    .trim()
    .refine(val => !val.includes('<') && !val.includes('>'), {
      message: 'Address contains invalid characters'
    })
    .or(z.literal('Walk-in customer')),
  channel: z.enum(['WhatsApp', 'Web', 'Phone', 'Walk-in'], {
    errorMap: () => ({ message: 'Invalid order channel' })
  }),
  items: z.array(orderItemSchema)
    .min(1, 'Order must contain at least one item')
    .max(50, 'Too many items in order'),
  delivery_fee: z.number()
    .min(0, 'Delivery fee cannot be negative')
    .max(100, 'Delivery fee too high'),
  total: z.number()
    .positive('Total must be positive')
    .max(100000, 'Order total too high'),
  status: z.enum(['Pending', 'Confirmed', 'Delivered'], {
    errorMap: () => ({ message: 'Invalid order status' })
  }).optional(),
  payment_status: z.enum(['pending', 'paid', 'refunded', 'failed'], {
    errorMap: () => ({ message: 'Invalid payment status' })
  }).optional(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'online'], {
    errorMap: () => ({ message: 'Invalid payment method' })
  }).optional(),
  notes: z.string()
    .max(1000, 'Notes too long')
    .trim()
    .refine(val => !val.includes('<script'), {
      message: 'Notes contain invalid content'
    })
    .optional(),
});

// Customer validation
export const customerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .trim()
    .refine(val => !val.includes('<') && !val.includes('>'), {
      message: 'Name contains invalid characters'
    }),
  email: emailSchema.optional().or(z.literal('')),
  phone_number: z.string()
    .regex(phoneRegex, 'Invalid UK phone number'),
  delivery_address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address too long')
    .trim()
    .optional(),
  postal_code: z.string()
    .max(10, 'Postal code too long')
    .trim()
    .optional(),
  notes: z.string()
    .max(1000, 'Notes too long')
    .optional(),
});

// Payment validation
export const paymentSchema = z.object({
  order_id: z.string().uuid('Invalid order ID'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(100000, 'Amount too high'),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'online', 'stripe']),
  transaction_reference: z.string()
    .max(100, 'Reference too long')
    .optional(),
  notes: z.string()
    .max(500, 'Notes too long')
    .optional(),
});

// ==============================================================================
// SANITIZATION FUNCTIONS
// ==============================================================================

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize phone number to UK format
 */
export function sanitizePhoneNumber(phone: string): string {
  // Remove all spaces and special characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Convert 0 prefix to +44
  if (cleaned.startsWith('0')) {
    cleaned = '+44' + cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Validate and sanitize order data before submission
 */
export function validateOrder(data: unknown) {
  try {
    const validated = orderSchema.parse(data);

    // Additional sanitization
    return {
      ...validated,
      customer_name: sanitizeString(validated.customer_name),
      phone_number: sanitizePhoneNumber(validated.phone_number),
      delivery_address: sanitizeString(validated.delivery_address),
      notes: validated.notes ? sanitizeString(validated.notes) : '',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validate and sanitize product data
 */
export function validateProduct(data: unknown) {
  try {
    const validated = productSchema.parse(data);

    return {
      ...validated,
      name: sanitizeString(validated.name),
      category: validated.category ? sanitizeString(validated.category) : '',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validate and sanitize customer data
 */
export function validateCustomer(data: unknown) {
  try {
    const validated = customerSchema.parse(data);

    return {
      ...validated,
      name: sanitizeString(validated.name),
      phone_number: sanitizePhoneNumber(validated.phone_number),
      delivery_address: validated.delivery_address ? sanitizeString(validated.delivery_address) : '',
      notes: validated.notes ? sanitizeString(validated.notes) : '',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
}

// ==============================================================================
// SECURITY UTILITIES
// ==============================================================================

/**
 * Rate limiting helper (client-side check)
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}

  check(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Filter out old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);

    if (recentAttempts.length >= this.maxAttempts) {
      return false; // Rate limit exceeded
    }

    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return true; // Allow request
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Generate secure transaction reference
 */
export function generateTransactionRef(prefix: string = 'TXN'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return '****';
  }
  const masked = '*'.repeat(data.length - visibleChars);
  return masked + data.slice(-visibleChars);
}

/**
 * Validate UK postcode format
 */
export function validatePostcode(postcode: string): boolean {
  const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
  return postcodeRegex.test(postcode.trim());
}
