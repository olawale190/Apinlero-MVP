import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';
import addressRoutes from './address.routes';
import paymentRoutes from './payment.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Isha Treat API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount route modules
router.use('/auth', authRoutes);          // Authentication
router.use('/products', productRoutes);    // Products & Categories
router.use('/cart', cartRoutes);           // Shopping Cart
router.use('/orders', orderRoutes);        // Orders & Tracking
router.use('/addresses', addressRoutes);   // Delivery Addresses
router.use('/payments', paymentRoutes);    // Payment Processing

export default router;
