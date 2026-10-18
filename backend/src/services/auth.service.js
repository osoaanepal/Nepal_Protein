import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';
import { otpService } from './otp.service.js';
import { emailService } from './email.service.js';

export const authService = {
  /**
   * Generate JWT Token for user
   */
  generateToken: (user) => {
    return jwt.sign(
      { id: user._id, role: user.role, emailVerified: user.emailVerified },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN }
    );
  },

  /**
   * Get secure cookie options
   */
  getCookieOptions: () => {
    const isProduction = ENV.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: ENV.COOKIE_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
    };
  },

  /**
   * Register customer - creates user in unverified state & dispatches OTP
   */
  register: async ({ name, email, phone, password }) => {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.emailVerified) {
        const err = new Error('An account with this email address already exists. Please log in.');
        err.statusCode = 400;
        throw err;
      }
      // If user exists but not verified, update details and resend OTP
      existingUser.name = name.trim();
      existingUser.phone = phone.trim();
      existingUser.password = password; // pre-save hook will hash it
      await existingUser.save();

      const { rawOtp } = await otpService.createOtp({
        email: normalizedEmail,
        purpose: 'EMAIL_VERIFICATION',
      });
      await emailService.sendVerificationOtp({ email: normalizedEmail, name: existingUser.name, otp: rawOtp });

      return {
        message: 'Verification code sent to your email address.',
        email: normalizedEmail,
        emailVerified: false,
      };
    }

    // Create new user (emailVerified: false, strictly role: customer)
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role: 'customer',
      emailVerified: false,
    });

    const { rawOtp } = await otpService.createOtp({
      email: normalizedEmail,
      purpose: 'EMAIL_VERIFICATION',
    });
    await emailService.sendVerificationOtp({ email: normalizedEmail, name: newUser.name, otp: rawOtp });

    return {
      message: 'Account created. Please enter the 6-digit verification code sent to your email.',
      email: normalizedEmail,
      emailVerified: false,
    };
  },

  /**
   * Verify email registration OTP and activate user account
   */
  verifyRegistrationOtp: async ({ email, otp }) => {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const err = new Error('No account found for this email address.');
      err.statusCode = 404;
      throw err;
    }

    if (user.emailVerified) {
      const token = authService.generateToken(user);
      return { user, token, message: 'Account is already verified.' };
    }

    // Verify OTP
    await otpService.verifyOtp({
      email: normalizedEmail,
      otp,
      purpose: 'EMAIL_VERIFICATION',
    });

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    const token = authService.generateToken(user);

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
      },
      token,
      message: 'Email successfully verified! Welcome to Nepal Protein.',
    };
  },

  /**
   * Resend verification OTP
   */
  resendOtp: async ({ email, purpose = 'EMAIL_VERIFICATION' }) => {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const err = new Error('No account found with this email address.');
      err.statusCode = 404;
      throw err;
    }

    if (purpose === 'EMAIL_VERIFICATION' && user.emailVerified) {
      const err = new Error('This account is already verified. You can log in directly.');
      err.statusCode = 400;
      throw err;
    }

    const { rawOtp, resendAvailableAt } = await otpService.createOtp({
      email: normalizedEmail,
      purpose,
    });

    if (purpose === 'EMAIL_VERIFICATION') {
      await emailService.sendVerificationOtp({ email: normalizedEmail, name: user.name, otp: rawOtp });
    } else {
      await emailService.sendPasswordResetOtp({ email: normalizedEmail, name: user.name, otp: rawOtp });
    }

    return {
      message: 'A fresh verification code has been sent to your email.',
      resendAvailableAt,
    };
  },

  /**
   * Login user with credential check and verification enforcement
   */
  login: async ({ email, password }) => {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('This account has been deactivated. Please contact customer support.');
      err.statusCode = 403;
      throw err;
    }

    // Strict email verification enforcement (admins bypass)
    if (!user.emailVerified && user.role !== 'admin') {
      try {
        const { rawOtp } = await otpService.createOtp({
          email: normalizedEmail,
          purpose: 'EMAIL_VERIFICATION',
        });
        await emailService.sendVerificationOtp({ email: normalizedEmail, name: user.name, otp: rawOtp });
      } catch (e) {
        // Cooldown might be active
      }

      const error = new Error('Please verify your email address before logging in. A verification code has been sent to your email.');
      error.statusCode = 403;
      error.code = 'EMAIL_NOT_VERIFIED';
      error.email = normalizedEmail;
      throw error;
    }

    const token = authService.generateToken(user);

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        addresses: user.addresses,
      },
      token,
    };
  },

  /**
   * Request password reset OTP
   */
  forgotPassword: async ({ email }) => {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Generic message to prevent email enumeration
      return {
        message: 'If an account exists with this email, a password reset code has been sent.',
        email: normalizedEmail,
      };
    }

    const { rawOtp } = await otpService.createOtp({
      email: normalizedEmail,
      purpose: 'PASSWORD_RESET',
    });
    await emailService.sendPasswordResetOtp({ email: normalizedEmail, name: user.name, otp: rawOtp });

    return {
      message: 'If an account exists with this email, a password reset code has been sent.',
      email: normalizedEmail,
    };
  },

  /**
   * Reset password with verified OTP
   */
  resetPassword: async ({ email, otp, newPassword }) => {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const err = new Error('Invalid password reset request.');
      err.statusCode = 400;
      throw err;
    }

    // Verify reset OTP
    await otpService.verifyOtp({
      email: normalizedEmail,
      otp,
      purpose: 'PASSWORD_RESET',
    });

    // Update password
    user.password = newPassword;
    await user.save();

    return {
      message: 'Password reset successful! You can now log in with your new password.',
    };
  }
};
