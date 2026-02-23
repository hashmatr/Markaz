const nodemailer = require('nodemailer');

/**
 * Email transporter configuration
 * Supports Gmail, Mailtrap, and custom SMTP services
 */
const getEmailTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';

  if (emailService === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Use App Password for Gmail
      }
    });
  } else if (emailService === 'mailtrap') {
    return nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD
      }
    });
  } else {
    // Custom SMTP
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
};

/**
 * Send OTP email to user
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code to send
 * @param {string} type - OTP type (registration, password_reset, etc.)
 * @returns {Promise<object>} - Email sending result
 */
const sendOTPEmail = async (email, otp, type = 'registration') => {
  try {
    const transporter = getEmailTransporter();

    const templates = {
      registration: {
        subject: 'Email Verification - Your OTP Code',
        html: getRegistrationEmailTemplate(otp, email)
      },
      password_reset: {
        subject: 'Password Reset - Your OTP Code',
        html: getPasswordResetEmailTemplate(otp, email)
      },
      seller_verification: {
        subject: 'Seller Verification - Your OTP Code',
        html: getSellerVerificationEmailTemplate(otp, email)
      },
      login_2fa: {
        subject: 'Login Verification - Your OTP Code',
        html: getLoginOTPEmailTemplate(otp, email)
      }
    };

    const template = templates[type] || templates.registration;

    const mailOptions = {
      from: `"Markaz Ecommerce" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error(`Error sending OTP email to ${email}:`, error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

/**
 * Email template for registration OTP
 */
const getRegistrationEmailTemplate = (otp, email) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp-box { background: white; border: 2px solid #667eea; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea; }
            .expiry { color: #666; font-size: 14px; margin-top: 10px; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #ddd; margin-top: 20px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Markaz Ecommerce</h1>
                <p>Email Verification</p>
            </div>
            <div class="content">
                <p>Hi,</p>
                <p>Thank you for registering with Markaz Ecommerce. To complete your registration and verify your email address, please use the following One Time Password (OTP):</p>
                
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                    <div class="expiry">This OTP will expire in 10 minutes</div>
                </div>
                
                <div class="warning">
                    <strong>Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP via email, phone, or chat.
                </div>
                
                <p>If you didn't register on Markaz Ecommerce, please ignore this email.</p>
                <p>Best regards,<br><strong>Markaz Ecommerce Team</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 Markaz Ecommerce. All rights reserved.</p>
               <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Email template for password reset OTP
 */
const getPasswordResetEmailTemplate = (otp, email) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp-box { background: white; border: 2px solid #f5576c; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #f5576c; }
            .expiry { color: #666; font-size: 14px; margin-top: 10px; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #ddd; margin-top: 20px; }
            .warning { background: #f8d7da; border-left: 4px solid #f5576c; padding: 10px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
                <p>Markaz Ecommerce</p>
            </div>
            <div class="content">
                <p>Hi,</p>
                <p>We received a request to reset your password. Use the OTP below to proceed with resetting your password:</p>
                
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                    <div class="expiry">This OTP will expire in 10 minutes</div>
                </div>
                
                <div class="warning">
                    <strong>Security Alert:</strong> If you didn't request a password reset, please secure your account immediately.
                </div>
                
                <p>Do not share this OTP with anyone. Our support team will never ask for your OTP.</p>
                <p>Best regards,<br><strong>Markaz Ecommerce Security Team</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 Markaz Ecommerce. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Email template for seller verification OTP
 */
const getSellerVerificationEmailTemplate = (otp, email) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp-box { background: white; border: 2px solid #4facfe; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4facfe; }
            .expiry { color: #666; font-size: 14px; margin-top: 10px; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #ddd; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Seller Account Verification</h1>
                <p>Markaz Ecommerce Merchant Portal</p>
            </div>
            <div class="content">
                <p>Congratulations! Your seller account has been approved.</p>
                <p>To complete your seller verification and activate your store, please use the following OTP:</p>
                
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                    <div class="expiry">This OTP will expire in 10 minutes</div>
                </div>
                
                <p>Once verified, you'll be able to:</p>
                <ul>
                    <li>Add and manage products</li>
                    <li>Receive and process orders</li>
                    <li>View analytics and sales reports</li>
                    <li>Manage payouts</li>
                </ul>
                
                <p>Best regards,<br><strong>Markaz Ecommerce Seller Support</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 Markaz Ecommerce. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Email template for 2FA login OTP
 */
const getLoginOTPEmailTemplate = (otp, email) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp-box { background: white; border: 2px solid #667eea; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea; }
            .expiry { color: #666; font-size: 14px; margin-top: 10px; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #ddd; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Your Login Code</h1>
                <p>Two-Factor Authentication</p>
            </div>
            <div class="content">
                <p>We detected a login attempt to your Markaz Ecommerce account.</p>
                <p>Use the code below to complete your login:</p>
                
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                    <div class="expiry">This code will expire in 5 minutes</div>
                </div>
                
                <p><strong>If this wasn't you:</strong> Please secure your account immediately and change your password.</p>
                <p>Best regards,<br><strong>Markaz Ecommerce Security Team</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 Markaz Ecommerce. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Send generic email
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise<object>} - Email sending result
 */
const sendGenericEmail = async (email, subject, html) => {
  try {
    const transporter = getEmailTransporter();

    const mailOptions = {
      from: `"Markaz Ecommerce" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html
    };

    const result = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send Order Confirmation Email
 * @param {string} email - Recipient email
 * @param {object} order - Order details
 * @returns {Promise<object>} - Email sending result
 */
const sendOrderConfirmationEmail = async (email, order) => {
  try {
    const transporter = getEmailTransporter();
    const html = getOrderConfirmationTemplate(order);

    const mailOptions = {
      from: `"Markaz Ecommerce" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Confirmation - #${order._id.toString().slice(-8).toUpperCase()}`,
      html: html
    };

    const result = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error(`Error sending order confirmation email to ${email}:`, error);
    // Don't throw error to avoid breaking order flow if email fails
    return { success: false, error: error.message };
  }
};

/**
 * HTML template for order confirmation
 */
const getOrderConfirmationTemplate = (order) => {
  const orderIdShort = order._id.toString().slice(-8).toUpperCase();
  const itemsHtml = order.orderItems.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.product?.title || 'Product'} 
        ${item.variantOptions ? `<br><small style="color: #666;">${Object.entries(item.variantOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}</small>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.discountedPrice || item.price) * item.quantity}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { border: 1px solid #eee; border-top: none; padding: 30px; border-radius: 0 0 5px 5px; }
            .order-info { background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; margin-top: 20px; }
            .btn { display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 9999px; font-weight: bold; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin:0; letter-spacing: 2px;">MARKAZ</h1>
                <p style="margin:5px 0 0 0; opacity: 0.8;">Order Confirmation</p>
            </div>
            <div class="content">
                <h2>Thank you for your order!</h2>
                <p>Hi,</p>
                <p>We've received your order and are getting it ready. You'll receive another email once your items have shipped.</p>
                
                <div class="order-info">
                    <p style="margin:5px 0;"><strong>Order ID:</strong> #${orderIdShort}</p>
                    <p style="margin:5px 0;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p style="margin:5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod === 'online' ? 'Credit/Debit Card' : 'Cash on Delivery'}</p>
                </div>

                <h3>Order Summary</h3>
                <table class="table">
                    <thead>
                        <tr style="background: #f9f9f9;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Item</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #eee;">Qty</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eee;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal</td>
                            <td style="padding: 10px; text-align: right;">$${order.totalPrice}</td>
                        </tr>
                        ${order.discount > 0 ? `
                        <tr>
                            <td colspan="2" style="padding: 10px; text-align: right; color: #ff3333;">Discount</td>
                            <td style="padding: 10px; text-align: right; color: #ff3333;">-$${order.discount}</td>
                        </tr>
                        ` : ''}
                        ${order.firstOrderDiscount > 0 ? `
                        <tr>
                            <td colspan="2" style="padding: 10px; text-align: right; color: #01ab31;">1st Order Bonus</td>
                            <td style="padding: 10px; text-align: right; color: #01ab31;">-$${order.firstOrderDiscount}</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px;">Total</td>
                            <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px;">$${order.totalDiscountedPrice}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="text-align: center;">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders/${order._id}" class="btn">View Order Detail</a>
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2026 Markaz Ecommerce. All rights reserved.</p>
                <p>If you have any questions, reply to this email or contact support.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Send Payment Success Email
 * @param {string} email - Recipient email
 * @param {object} order - Order details
 * @returns {Promise<object>} - Email sending result
 */
const sendPaymentSuccessEmail = async (email, order) => {
  try {
    const transporter = getEmailTransporter();
    const orderIdShort = order._id.toString().slice(-8).toUpperCase();

    const mailOptions = {
      from: `"Markaz Ecommerce" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Payment Successful - Order #${orderIdShort}`,
      html: getPaymentSuccessTemplate(order)
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error(`Error sending payment success email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * HTML template for payment success
 */
const getPaymentSuccessTemplate = (order) => {
  const orderIdShort = order._id.toString().slice(-8).toUpperCase();
  return `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { border: 1px solid #eee; border-top: none; padding: 30px; border-radius: 0 0 5px 5px; }
              .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Payment Received!</h1>
              </div>
              <div class="content">
                  <h2>Payment for Order #${orderIdShort} was successful</h2>
                  <p>Hi,</p>
                  <p>This is to confirm that we have successfully received your payment for order <strong>#${orderIdShort}</strong>. Your order is now being processed and will be shipped soon.</p>
                  <p><strong>Total Amount Paid:</strong> $${order.totalDiscountedPrice}</p>
                  <p><strong>Payment Status:</strong> Paid</p>
                  
                  <p>You can track the progress of your order by clicking the button below:</p>
                  <div style="text-align: center; margin-top: 30px;">
                      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders/${order._id}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 9999px; font-weight: bold;">Track Order</a>
                  </div>
              </div>
              <div class="footer">
                  <p>&copy; 2026 Markaz Ecommerce. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
};

module.exports = {
  sendOTPEmail,
  sendGenericEmail,
  sendOrderConfirmationEmail,
  sendPaymentSuccessEmail,
  getEmailTransporter
};

