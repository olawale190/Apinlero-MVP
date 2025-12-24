import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';
import addressRoutes from './address.routes';
import paymentRoutes from './payment.routes';
import uploadRoutes from './upload.routes';
import adminRoutes from './admin.routes';

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
router.use('/upload', uploadRoutes);       // Image Uploads
router.use('/admin', adminRoutes);         // Admin Panel API

export default router;
