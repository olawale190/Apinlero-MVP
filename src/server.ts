import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { config } from './config';
import {
  securityHeaders,
  corsMiddleware,
  rateLimiter,
  securityLogger,
} from './middleware/security';
import routes from './routes';

// Initialize Express app
const app = express();

// ============================================
// Security Middleware (Order matters!)
// ============================================

// 1. Security headers (Helmet) - First line of defense
app.use(securityHeaders);

// 2. CORS - Control who can access the API
app.use(corsMiddleware);

// 3. Rate limiting - Prevent abuse
app.use(rateLimiter);

// 4. Security logging - Detect suspicious activity
app.use(securityLogger);

// 5. Body parsing with size limits
app.use(express.json({ limit: '10kb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 6. Disable x-powered-by header (redundant with Helmet, but explicit)
app.disable('x-powered-by');

// ============================================
// Trust proxy (for rate limiting behind reverse proxy)
// ============================================
if (config.isProduction) {
  app.set('trust proxy', 1);
}

// ============================================
// Static Files (Admin Panel)
// ============================================
app.use(express.static(path.join(__dirname, '../public')));

// Serve admin panel at /admin
app.get('/admin', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// ============================================
// API Routes
// ============================================
app.use('/api', routes);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  // Log error (but don't expose stack trace in production)
  console.error('Unhandled error:', {
    message: err.message,
    stack: config.isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Don't leak error details in production
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.isDevelopment
      ? err.message
      : 'An unexpected error occurred',
  });
});

// ============================================
// Server Startup
// ============================================
const startServer = async () => {
  try {
    // Start listening
    app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║               ISHA TREAT - APINLERO MVP                    ║
╠════════════════════════════════════════════════════════════╣
║  Status:      Running                                      ║
║  Port:        ${String(config.port).padEnd(44)}║
║  Environment: ${config.nodeEnv.padEnd(44)}║
║  API:         http://localhost:${config.port}/api                         ║
║  Admin Panel: http://localhost:${config.port}/admin                       ║
╠════════════════════════════════════════════════════════════╣
║  Security Features Enabled:                                ║
║  ✓ Helmet (Security Headers)                               ║
║  ✓ CORS (Origin Restriction)                               ║
║  ✓ Rate Limiting                                           ║
║  ✓ Request Size Limiting                                   ║
║  ✓ Input Validation (Zod)                                  ║
║  ✓ Password Hashing (bcrypt)                               ║
║  ✓ JWT Authentication                                      ║
║  ✓ SQL Injection Prevention (Prisma ORM)                   ║
║  ✓ Cloudinary Image Uploads                                ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
