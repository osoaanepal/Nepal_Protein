import { ContactMessage } from '../models/ContactMessage.js';
import { emailService } from '../services/email.service.js';
import { BusinessSettings } from '../models/BusinessSettings.js';
import { ENV } from '../config/env.js';

export const submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Field presence validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, subject, and message).',
      });
    }

    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedSubject = String(subject).trim();
    const trimmedMessage = String(message).trim();
    const trimmedPhone = phone ? String(phone).trim() : '';

    // Name length validation
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 100 characters.',
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Subject length validation
    if (trimmedSubject.length < 2 || trimmedSubject.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Subject must be between 2 and 200 characters.',
      });
    }

    // Message length validation
    if (trimmedMessage.length < 10 || trimmedMessage.length > 3000) {
      return res.status(400).json({
        success: false,
        message: 'Message must be between 10 and 3000 characters.',
      });
    }

    // Capture client metadata
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Save message to MongoDB
    const contactRecord = await ContactMessage.create({
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      subject: trimmedSubject,
      message: trimmedMessage,
      ipAddress: String(ipAddress),
      userAgent: String(userAgent),
    });

    // Lookup business recipient email from settings or env
    let recipientEmail = ENV.ADMIN.EMAIL || ENV.SMTP.USER;
    try {
      const settings = await BusinessSettings.findOne();
      if (settings?.contact?.email) {
        recipientEmail = settings.contact.email;
      }
    } catch (settingsErr) {
      // Fallback to env recipient
    }

    // Asynchronously dispatch email notification (non-blocking for fast response)
    emailService.sendContactNotification({
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      subject: trimmedSubject,
      message: trimmedMessage,
      toEmail: recipientEmail,
    }).catch((emailErr) => {
      console.error('[Contact Email Notification Error]:', emailErr.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Your message has been received. Our team will get back to you shortly.',
      data: {
        id: contactRecord._id,
        createdAt: contactRecord.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
