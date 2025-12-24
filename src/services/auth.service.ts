import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { Role } from '@prisma/client';
import type { RegisterInput, LoginInput } from '../middleware/validate';

// Constants for security
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: Role;
  };
  tokens: TokenPair;
}

/**
 * Authentication Service
 *
 * Security features:
 * - Password hashing with bcrypt (configurable salt rounds)
 * - Account lockout after failed attempts
 * - Secure token generation
 * - Audit logging
 */
export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterInput, ipAddress?: string): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AuthError('User with this email already exists', 'USER_EXISTS');
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(
      data.password,
      config.security.bcryptSaltRounds
    );

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokenPair(user.id, user.email, user.role, ipAddress);

    // Log the registration
    await this.logAudit(user.id, 'REGISTER', 'user', user.id, true, ipAddress);

    return { user, tokens };
  }

  /**
   * Login user with email and password
   */
  async login(
    data: LoginInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Use same error message to prevent email enumeration
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );
      throw new AuthError(
        `Account is locked. Try again in ${remainingMinutes} minutes`,
        'ACCOUNT_LOCKED'
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AuthError('Account has been deactivated', 'ACCOUNT_INACTIVE');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValidPassword) {
      // Increment failed login attempts
      await this.handleFailedLogin(user.id, ipAddress);
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Reset failed login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      user.role,
      ipAddress,
      userAgent
    );

    // Log successful login
    await this.logAudit(user.id, 'LOGIN', 'user', user.id, true, ipAddress, userAgent);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenPair> {
    // Find the refresh token
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AuthError('Invalid refresh token', 'INVALID_TOKEN');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new AuthError('Refresh token has expired', 'TOKEN_EXPIRED');
    }

    // Check if token has been revoked
    if (storedToken.revokedAt) {
      throw new AuthError('Refresh token has been revoked', 'TOKEN_REVOKED');
    }

    // Check if user is still active
    if (!storedToken.user.isActive) {
      throw new AuthError('Account has been deactivated', 'ACCOUNT_INACTIVE');
    }

    // Revoke the old refresh token (token rotation for security)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new token pair
    const tokens = await this.generateTokenPair(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
      ipAddress,
      userAgent
    );

    return tokens;
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string, userId: string, ipAddress?: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        userId,
      },
      data: { revokedAt: new Date() },
    });

    await this.logAudit(userId, 'LOGOUT', 'user', userId, true, ipAddress);
  }

  /**
   * Logout from all devices - revoke all refresh tokens
   */
  async logoutAll(userId: string, ipAddress?: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    await this.logAudit(userId, 'LOGOUT_ALL', 'user', userId, true, ipAddress);
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AuthError('User not found', 'USER_NOT_FOUND');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AuthError('Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(
      newPassword,
      config.security.bcryptSaltRounds
    );

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all refresh tokens (force re-login on all devices)
    await this.logoutAll(userId, ipAddress);

    await this.logAudit(userId, 'PASSWORD_CHANGE', 'user', userId, true, ipAddress);
  }

  // ============================================
  // Private helper methods
  // ============================================

  private async generateTokenPair(
    userId: string,
    email: string,
    role: Role,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenPair> {
    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      { userId, email, role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Generate refresh token (long-lived, stored in DB)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return { accessToken, refreshToken };
  }

  private async handleFailedLogin(userId: string, ipAddress?: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    const attempts = (user?.failedLoginAttempts ?? 0) + 1;
    const updateData: {
      failedLoginAttempts: number;
      lockedUntil?: Date;
    } = { failedLoginAttempts: attempts };

    // Lock account if too many failed attempts
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + LOCK_DURATION_MINUTES);
      updateData.lockedUntil = lockUntil;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Log failed attempt
    await this.logAudit(userId, 'LOGIN_FAILED', 'user', userId, false, ipAddress);
  }

  private async logAudit(
    userId: string,
    action: string,
    resource?: string,
    resourceId?: string,
    success: boolean = true,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId,
          success,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      console.error('Failed to create audit log:', error);
    }
  }
}

/**
 * Custom authentication error class
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Export singleton instance
export const authService = new AuthService();
