import { Router, Request, Response } from 'express';
import { authService, AuthError } from '../services/auth.service';
import { authenticate, authorize } from '../middleware/auth';
import { authRateLimiter } from '../middleware/security';
import {
  validate,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '../middleware/validate';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  async (req: Request, res: Response) => {
    try {
      const result = await authService.register(req.body, req.ip);

      res.status(201).json({
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        const statusCode = error.code === 'USER_EXISTS' ? 409 : 400;
        res.status(statusCode).json({
          error: error.code,
          message: error.message,
        });
        return;
      }
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'An error occurred during registration',
      });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  async (req: Request, res: Response) => {
    try {
      const result = await authService.login(
        req.body,
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        const statusCodes: Record<string, number> = {
          INVALID_CREDENTIALS: 401,
          ACCOUNT_LOCKED: 423,
          ACCOUNT_INACTIVE: 403,
        };
        const statusCode = statusCodes[error.code] ?? 400;

        res.status(statusCode).json({
          error: error.code,
          message: error.message,
        });
        return;
      }
      console.error('Login error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'An error occurred during login',
      });
    }
  }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires valid refresh token)
 */
router.post(
  '/refresh',
  validate({ body: refreshTokenSchema }),
  async (req: Request, res: Response) => {
    try {
      const tokens = await authService.refreshToken(
        req.body.refreshToken,
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        message: 'Token refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(401).json({
          error: error.code,
          message: error.message,
        });
        return;
      }
      console.error('Token refresh error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'An error occurred during token refresh',
      });
    }
  }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  validate({ body: refreshTokenSchema }),
  async (req: Request, res: Response) => {
    try {
      await authService.logout(req.body.refreshToken, req.user!.id, req.ip);

      res.json({
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'An error occurred during logout',
      });
    }
  }
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', authenticate, async (req: Request, res: Response) => {
  try {
    await authService.logoutAll(req.user!.id, req.ip);

    res.json({
      message: 'Logged out from all devices successfully',
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An error occurred during logout',
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  async (req: Request, res: Response) => {
    try {
      await authService.changePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.newPassword,
        req.ip
      );

      res.json({
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(400).json({
          error: error.code,
          message: error.message,
        });
        return;
      }
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while changing password',
      });
    }
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, (req: Request, res: Response) => {
  res.json({
    data: req.user,
  });
});

export default router;
