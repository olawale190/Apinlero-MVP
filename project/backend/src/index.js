/**
 * Àpínlẹ̀rọ Backend API Server
 *
 * SECURITY FEATURES IMPLEMENTED:
 * - JWT authentication via Supabase
 * - Rate limiting on all endpoints
 * - Input validation and sanitization
 * - Security headers (CSP, HSTS, X-Frame-Options, etc.)
 * - Secure CORS configuration
 * - Request logging for audit trails
 * - Secure token generation for delivery links
 * - SQL injection prevention via parameterized queries
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  rateLimiter,
  authenticateToken,
  securityHeaders,
  corsConfig,
  sanitizeObject,
  isValidUUID,
  validateOrderInput,
  validatePaymentInput,
  generateSecureToken,
  verifyDeliveryToken,
  requestLogger,
  errorHandler,
} from './middleware/security.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ==============================================================================
// SERVICE INITIALIZATION
// ==============================================================================

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
  console.error('WARNING: STRIPE_SECRET_KEY not configured');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_demo', {
  apiVersion: '2023-10-16',
});

// Initialize Supabase (service role for backend operations)
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Client Supabase for auth verification
const supabaseAuth = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// ==============================================================================
// GLOBAL MIDDLEWARE
// ==============================================================================

// Security headers on all responses
app.use(securityHeaders);

// Request logging for security audit
app.use(requestLogger);

// Secure CORS configuration
app.use(cors(corsConfig()));

// Parse JSON with size limit to prevent DoS
app.use(express.json({ limit: '10kb' }));

// Global rate limiting (100 requests per minute per IP)
app.use(rateLimiter(100));

// Trust proxy for correct IP detection behind load balancers
app.set('trust proxy', 1);

// ==============================================================================
// PUBLIC ROUTES (No authentication required)
// ==============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    security: 'enabled',
  });
});

// Get all active products (public)
app.get('/api/products', rateLimiter(200), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, category, unit, image_url, stock_quantity, is_active, bulk_pricing')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID (public)
app.get('/api/products/:id', rateLimiter(200), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format to prevent SQL injection
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, category, unit, image_url, stock_quantity, is_active, bulk_pricing')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching product:', error.message);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create order (public - customers can create orders, with validation)
app.post('/api/orders', rateLimiter(20), validateOrderInput, async (req, res) => {
  try {
    const orderData = req.body;

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        customer_name: orderData.customer_name,
        phone_number: orderData.phone_number || '',
        email: orderData.email || '',
        delivery_address: orderData.delivery_address || '',
        channel: orderData.channel || 'Web',
        items: orderData.items,
        delivery_fee: orderData.delivery_fee,
        total: orderData.total,
        status: 'Pending',
        payment_status: 'pending',
        notes: orderData.notes || '',
        delivery_method: orderData.delivery_method || 'delivery',
        payment_method: orderData.payment_method || 'card',
      }])
      .select()
      .single();

    if (error) throw error;

    // Generate secure delivery token with order ID (72 hour validity)
    const secureDeliveryToken = generateSecureToken(data.id, 72);

    res.json({
      ...data,
      delivery_token: secureDeliveryToken,
    });
  } catch (error) {
    console.error('Error creating order:', error.message);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify delivery token and get order (for drivers)
app.get('/api/delivery/verify', rateLimiter(50), async (req, res) => {
  try {
    const { orderId, token } = req.query;

    if (!orderId || !token) {
      return res.status(400).json({ error: 'Missing order ID or token' });
    }

    if (!isValidUUID(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    // Verify the cryptographic token
    const verification = verifyDeliveryToken(token, orderId);

    if (!verification.valid) {
      return res.status(401).json({
        error: 'Invalid delivery link',
        reason: verification.reason,
      });
    }

    // Fetch order details (limited info for driver)
    const { data, error } = await supabase
      .from('orders')
      .select('id, customer_name, phone_number, delivery_address, items, total, status, notes')
      .eq('id', orderId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error verifying delivery:', error.message);
    res.status(500).json({ error: 'Failed to verify delivery' });
  }
});

// Confirm delivery (for drivers with valid token)
app.post('/api/delivery/confirm', rateLimiter(20), async (req, res) => {
  try {
    const { orderId, token } = req.body;

    if (!orderId || !token) {
      return res.status(400).json({ error: 'Missing order ID or token' });
    }

    if (!isValidUUID(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    // Verify the cryptographic token
    const verification = verifyDeliveryToken(token, orderId);

    if (!verification.valid) {
      return res.status(401).json({
        error: 'Invalid delivery link',
        reason: verification.reason,
      });
    }

    // Update order status to Delivered
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'Delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, order: data });
  } catch (error) {
    console.error('Error confirming delivery:', error.message);
    res.status(500).json({ error: 'Failed to confirm delivery' });
  }
});

// ==============================================================================
// PROTECTED ROUTES (Authentication required)
// ==============================================================================

// Get all orders (dashboard - requires authentication)
app.get('/api/orders', authenticateToken(supabaseAuth), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status (requires authentication)
app.patch('/api/orders/:id', authenticateToken(supabaseAuth), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate UUID to prevent injection
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    // Validate status value
    const validStatuses = ['Pending', 'Confirmed', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating order:', error.message);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Generate secure delivery link (requires authentication)
app.post('/api/orders/:id/delivery-link', authenticateToken(supabaseAuth), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    // Generate new secure cryptographic token (72 hours validity)
    const token = generateSecureToken(id, 72);

    const baseUrl = process.env.FRONTEND_URL || 'https://project-apinlero.vercel.app';
    const deliveryLink = `${baseUrl}?delivery=${id}&token=${encodeURIComponent(token)}`;

    res.json({
      link: deliveryLink,
      expiresIn: '72 hours',
    });
  } catch (error) {
    console.error('Error generating delivery link:', error.message);
    res.status(500).json({ error: 'Failed to generate delivery link' });
  }
});

// ==============================================================================
// PAYMENT ROUTES
// ==============================================================================

// Create Stripe Payment Intent (with validation)
app.post('/api/create-payment-intent', rateLimiter(30), validatePaymentInput, async (req, res) => {
  try {
    const { amount, currency = 'gbp', metadata } = req.body;

    // Sanitize metadata to prevent injection
    const sanitizedMetadata = metadata ? sanitizeObject(metadata) : {};

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to pence
      currency: currency.toLowerCase(),
      metadata: sanitizedMetadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error.message);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Stripe Webhook (uses raw body for signature verification)
app.post('/api/webhook/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // CRITICAL: Require webhook signature in production
    if (!webhookSecret && process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: Stripe webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    try {
      let event;

      if (webhookSecret) {
        // Verify webhook signature (prevents forged webhooks)
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else if (process.env.NODE_ENV !== 'production') {
        // Only allow unsigned webhooks in development
        console.warn('WARNING: Processing unsigned webhook (dev mode only)');
        event = JSON.parse(req.body);
      } else {
        return res.status(400).json({ error: 'Webhook signature required' });
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log('Payment succeeded:', paymentIntent.id);

          if (paymentIntent.metadata?.orderId) {
            await supabase
              .from('orders')
              .update({
                status: 'Confirmed',
                payment_status: 'paid',
              })
              .eq('id', paymentIntent.metadata.orderId);
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          console.log('Payment failed:', failedPayment.id);

          if (failedPayment.metadata?.orderId) {
            await supabase
              .from('orders')
              .update({ payment_status: 'failed' })
              .eq('id', failedPayment.metadata.orderId);
          }
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  }
);

// ==============================================================================
// ANALYTICS ROUTES (Protected)
// ==============================================================================

// AI Insights endpoint (requires authentication)
app.get('/api/insights', authenticateToken(supabaseAuth), async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const channelCounts = orders?.reduce((acc, order) => {
      acc[order.channel] = (acc[order.channel] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      totalOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      avgOrderValue: Number(avgOrderValue.toFixed(2)),
      channelDistribution: channelCounts,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching insights:', error.message);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// ==============================================================================
// ERROR HANDLING
// ==============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler (doesn't leak internal details)
app.use(errorHandler);

// ==============================================================================
// SERVER STARTUP
// ==============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Àpínlẹ̀rọ Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔒 Security: Rate limiting, CORS, Headers, Auth enabled`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
