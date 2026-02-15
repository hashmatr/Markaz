const express = require('express');
const { sendGenericEmail } = require('../utils/sendEmail');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

/**
 * POST /api/contact - Handle contact form submissions
 */
router.post(
  '/contact',
  asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required',
      });
    }

    // Send notification email to admin
    const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; }
          .info-box { background: white; padding: 16px; border-radius: 8px; margin: 12px 0; border-left: 4px solid #000; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;font-size:24px;">New Contact Message</h1>
            <p style="margin:8px 0 0;opacity:0.8;">Markaz Ecommerce</p>
          </div>
          <div class="content">
            <div class="info-box">
              <strong>From:</strong> ${name}<br/>
              <strong>Email:</strong> ${email}<br/>
              <strong>Subject:</strong> ${subject || 'General Inquiry'}
            </div>
            <div class="info-box">
              <strong>Message:</strong><br/>
              ${message.replace(/\n/g, '<br/>')}
            </div>
            <p style="color:#999;font-size:12px;margin-top:20px;">Received on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendGenericEmail(
      process.env.EMAIL_USER,
      `[Markaz Contact] ${subject || 'New Message'} from ${name}`,
      adminHtml
    );

    // Auto-reply to sender
    const replyHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;font-size:24px;">Thank You!</h1>
            <p style="margin:8px 0 0;opacity:0.8;">Markaz Ecommerce</p>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for reaching out to us! We've received your message and our team will get back to you within 24-48 hours.</p>
            <p>Here's what you sent us:</p>
            <div style="background:white;padding:16px;border-radius:8px;border-left:4px solid #000;margin:12px 0;">
              <strong>Subject:</strong> ${subject || 'General Inquiry'}<br/>
              <strong>Message:</strong> ${message.replace(/\n/g, '<br/>')}
            </div>
            <p>Need immediate assistance? You can reach us directly:</p>
            <ul>
              <li>Email: hashraxa266@gmail.com</li>
              <li>WhatsApp: +92 311 5732241</li>
            </ul>
            <p>Best regards,<br/><strong>Markaz Ecommerce Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendGenericEmail(email, 'We received your message - Markaz Ecommerce', replyHtml);

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you soon.',
    });
  })
);

/**
 * POST /api/newsletter/subscribe - Newsletter subscription
 */
router.post(
  '/newsletter/subscribe',
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Send welcome email to subscriber
    const welcomeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #000 0%, #1a1a2e 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; }
          .highlight { background: white; padding: 20px; border-radius: 12px; margin: 16px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;font-size:28px;font-weight:800;">MARKAZ</h1>
            <p style="margin:12px 0 0;opacity:0.8;font-size:16px;">Welcome to our Newsletter!</p>
          </div>
          <div class="content">
            <p>Hey there!</p>
            <p>Thank you for subscribing to the Markaz newsletter. You're now part of our exclusive community!</p>
            <div class="highlight">
              <h3 style="margin:0 0 8px;">Here's what you'll get:</h3>
              <p style="margin:0;color:#666;">Exclusive discounts & early access<br/>New arrivals & trending products<br/>Special offers & seasonal deals<br/>Style tips & fashion inspiration</p>
            </div>
            <p>Stay tuned for amazing offers!</p>
            <p>Best regards,<br/><strong>Markaz Ecommerce Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendGenericEmail(email, 'Welcome to Markaz Newsletter!', welcomeHtml);

    // Notify admin about new subscriber
    await sendGenericEmail(
      process.env.EMAIL_USER,
      '[Markaz] New Newsletter Subscriber',
      `<p>New newsletter subscriber: <strong>${email}</strong></p><p>Subscribed on: ${new Date().toLocaleString()}</p>`
    );

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
    });
  })
);

module.exports = router;
