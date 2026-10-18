import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    if (ENV.SMTP.USER && ENV.SMTP.PASS) {
      this.transporter = nodemailer.createTransport({
        host: ENV.SMTP.HOST,
        port: ENV.SMTP.PORT,
        secure: ENV.SMTP.PORT === 465,
        auth: {
          user: ENV.SMTP.USER,
          pass: ENV.SMTP.PASS,
        },
      });
    }
  }

  /**
   * Internal sender method with dev fallback
   */
  async sendMail({ to, subject, html, text }) {
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: ENV.SMTP.FROM,
          to,
          subject,
          html,
          text,
        });
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error(`[Email Service Error] Failed to send email to ${to}:`, err.message);
        // Do not crash, allow flow to continue in dev
      }
    }

    // In development or when SMTP is not configured, log clearly to console in non-production environments
    if (ENV.NODE_ENV !== 'production') {
      console.log(`\n================== [NEPAL PROTEIN EMAIL DISPATCH] ==================`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${text || html}`);
      console.log(`====================================================================\n`);
    }
    return { success: true, isDevFallback: true };
  }

  /**
   * Send Email Verification OTP
   */
  async sendVerificationOtp({ email, name, otp }) {
    const subject = 'Verify your Nepal Protein account';
    const text = `Hello ${name},\n\nYour Nepal Protein verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.\n\nNepal Protein - Authentic Sports Nutrition & Fitness Supplements`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px; text-align: center;">
          <h1 style="color: #f97316; margin: 0; font-size: 26px; letter-spacing: 2px;">NEPAL PROTEIN</h1>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Authentic Sports Nutrition & Fitness Supplements</p>
        </div>
        <div style="padding: 32px 24px; color: #1e293b;">
          <h2 style="margin-top: 0; font-size: 20px; color: #0f172a;">Account Email Verification</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #475569;">
            Hi <strong>${name}</strong>, thank you for registering with Nepal Protein. Please use the 6-digit verification code below to activate your account:
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <div style="display: inline-block; background-color: #fff7ed; border: 2px dashed #f97316; border-radius: 8px; padding: 14px 28px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #c2410c;">
              ${otp}
            </div>
          </div>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
            ⏳ This code is valid for <strong>10 minutes</strong>. Never share your verification code with anyone.
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          © ${new Date().getFullYear()} Nepal Protein. All rights reserved. Kathmandu, Nepal.
        </div>
      </div>
    `;

    return this.sendMail({ to: email, subject, text, html });
  }

  /**
   * Send Password Reset OTP
   */
  async sendPasswordResetOtp({ email, name, otp }) {
    const subject = 'Reset your Nepal Protein account password';
    const text = `Hello ${name},\n\nYour password reset code for Nepal Protein is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request a password reset, please secure your account.\n\nNepal Protein - Authentic Sports Nutrition & Fitness Supplements`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px; text-align: center;">
          <h1 style="color: #f97316; margin: 0; font-size: 26px; letter-spacing: 2px;">NEPAL PROTEIN</h1>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Authentic Sports Nutrition & Fitness Supplements</p>
        </div>
        <div style="padding: 32px 24px; color: #1e293b;">
          <h2 style="margin-top: 0; font-size: 20px; color: #0f172a;">Password Reset Request</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #475569;">
            Hi <strong>${name}</strong>, we received a request to reset your password. Use the code below to complete the reset process:
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <div style="display: inline-block; background-color: #fef2f2; border: 2px dashed #ef4444; border-radius: 8px; padding: 14px 28px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #991b1b;">
              ${otp}
            </div>
          </div>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
            ⏳ This code is valid for <strong>10 minutes</strong>. If you did not make this request, you can safely ignore this email.
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          © ${new Date().getFullYear()} Nepal Protein. All rights reserved. Kathmandu, Nepal.
        </div>
      </div>
    `;

    return this.sendMail({ to: email, subject, text, html });
  }

  /**
   * Send Order Confirmation Email
   */
  async sendOrderConfirmation({ order, user }) {
    const subject = `Order Confirmed - #${order.orderNumber} | Nepal Protein`;
    const text = `Hello ${user.name},\n\nThank you for your order #${order.orderNumber} at Nepal Protein.\nTotal Amount: Rs. ${order.pricing.grandTotal}\nPayment Method: ${order.paymentInfo.method}\nWe are preparing your items for delivery.\n\nNepal Protein - Authentic Sports Nutrition & Fitness Supplements`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px; text-align: center;">
          <h1 style="color: #f97316; margin: 0; font-size: 26px; letter-spacing: 2px;">NEPAL PROTEIN</h1>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Order Confirmation</p>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <h2 style="margin-top: 0; color: #0f172a;">Thank you for your order!</h2>
          <p style="color: #475569;">Order Number: <strong>#${order.orderNumber}</strong></p>
          <p style="color: #475569;">Payment Method: <strong>${order.paymentInfo.method}</strong></p>
          <p style="color: #475569;">Total Amount: <strong>Rs. ${order.pricing.grandTotal.toLocaleString()}</strong></p>
          <p style="color: #475569;">Delivery Address: ${order.shippingAddress.streetAddress}, ${order.shippingAddress.municipality}, ${order.shippingAddress.district}, ${order.shippingAddress.province}</p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          © ${new Date().getFullYear()} Nepal Protein. All rights reserved. Kathmandu, Nepal.
        </div>
      </div>
    `;

    return this.sendMail({ to: user.email, subject, text, html });
  }

  /**
   * Send Contact Us Form Notification to Business Admin
   */
  async sendContactNotification({ name, email, phone, subject: msgSubject, message, toEmail }) {
    const recipient = toEmail || ENV.ADMIN.EMAIL || ENV.SMTP.USER || 'osoaanepal@gmail.com';
    const emailSubject = `[Contact Enquiry] ${msgSubject} - from ${name}`;
    const text = `New Contact Form Submission from Nepal Protein Website:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nSubject: ${msgSubject}\n\nMessage:\n${message}\n\nReceived at: ${new Date().toLocaleString()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px; text-align: center;">
          <h1 style="color: #f97316; margin: 0; font-size: 26px; letter-spacing: 2px;">NEPAL PROTEIN</h1>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Customer Contact Inquiry</p>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <h2 style="margin-top: 0; font-size: 18px; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">New Contact Message Received</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 100px; font-weight: bold;">Sender:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${email}" style="color: #f97316; text-decoration: none;">${email}</a></td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Phone:</td>
              <td style="padding: 8px 0; color: #0f172a;">${phone}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Subject:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${msgSubject}</td>
            </tr>
          </table>

          <div style="background-color: #f8fafc; border-left: 4px solid #f97316; padding: 16px; border-radius: 4px; margin-top: 10px;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Message Content:</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${message}</p>
          </div>

          <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
            Received on: ${new Date().toUTCString()}
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 14px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} Nepal Protein. Automated Notification.
        </div>
      </div>
    `;

    return this.sendMail({ to: recipient, subject: emailSubject, text, html });
  }
}

export const emailService = new EmailService();
