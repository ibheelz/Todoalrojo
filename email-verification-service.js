// Backend Email Verification Service
// File: email-verification-service.js
// Deploy this to your server (Vercel, Netlify Functions, Railway, etc.)

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration - Replace with your values
const CONFIG = {
  PORT: process.env.PORT || 3001,
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail', // or 'smtp'
  EMAIL_USER: process.env.EMAIL_USER || 'your-email@gmail.com',
  EMAIL_PASS: process.env.EMAIL_PASS || 'your-app-password',
  EMAIL_FROM: process.env.EMAIL_FROM || 'Todo al Rojo <noreply@todoalrojo.com>',
  VERIFICATION_EXPIRY_MINUTES: 10,
};

// In-memory store for verification codes (use Redis/database in production)
const verificationStore = new Map();

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: CONFIG.EMAIL_SERVICE,
  auth: {
    user: CONFIG.EMAIL_USER,
    pass: CONFIG.EMAIL_PASS,
  },
});

// Generate random verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate unique verification ID
function generateVerificationId() {
  return crypto.randomBytes(16).toString('hex');
}

// Clean expired verification codes
function cleanExpiredCodes() {
  const now = Date.now();
  for (const [id, data] of verificationStore.entries()) {
    if (now > data.expiresAt) {
      verificationStore.delete(id);
    }
  }
}

// Clean expired codes every 5 minutes
setInterval(cleanExpiredCodes, 5 * 60 * 1000);

// Email templates
const EMAIL_TEMPLATES = {
  es: {
    subject: 'Código de verificación - Todo al Rojo',
    html: (code) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Todo al Rojo - Código de Verificación</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff2400, #b91c1c); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code { font-size: 32px; font-weight: bold; color: #ff2400; text-align: center; background: white; padding: 20px; border-radius: 8px; border: 2px dashed #ff2400; margin: 20px 0; }
          .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Todo al Rojo</h1>
            <p>Verificación de Email</p>
          </div>
          <div class="content">
            <h2>¡Hola!</h2>
            <p>Hemos recibido una solicitud para verificar tu dirección de email. Usa el siguiente código para completar tu registro:</p>
            <div class="code">${code}</div>
            <p><strong>Este código expira en ${CONFIG.VERIFICATION_EXPIRY_MINUTES} minutos.</strong></p>
            <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
            <p>¡Gracias por unirte a Todo al Rojo!</p>
          </div>
          <div class="footer">
            <p>© 2024 Todo al Rojo. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (code) => `
Todo al Rojo - Código de Verificación

Hola,

Tu código de verificación es: ${code}

Este código expira en ${CONFIG.VERIFICATION_EXPIRY_MINUTES} minutos.

Si no solicitaste este código, puedes ignorar este mensaje.

¡Gracias por unirte a Todo al Rojo!
    `
  }
};

// API Routes

// Send verification code
app.post('/api/email-verify/send-code', async (req, res) => {
  try {
    const { email, language = 'es', expiryMinutes = CONFIG.VERIFICATION_EXPIRY_MINUTES } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address'
      });
    }

    const verificationId = generateVerificationId();
    const code = generateVerificationCode();
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);

    // Store verification data
    verificationStore.set(verificationId, {
      email: email.toLowerCase(),
      code,
      expiresAt,
      attempts: 0,
      verified: false
    });

    // Send email
    const template = EMAIL_TEMPLATES[language] || EMAIL_TEMPLATES.es;
    const mailOptions = {
      from: CONFIG.EMAIL_FROM,
      to: email,
      subject: template.subject,
      html: template.html(code),
      text: template.text(code)
    };

    await transporter.sendMail(mailOptions);

    console.log(`Verification code sent to ${email}: ${code} (ID: ${verificationId})`);

    res.json({
      success: true,
      verificationId,
      expiresAt,
      message: 'Verification code sent successfully'
    });

  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification code'
    });
  }
});

// Verify code
app.post('/api/email-verify/verify-code', async (req, res) => {
  try {
    const { verificationId, code } = req.body;

    if (!verificationId || !code) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Missing verification ID or code'
      });
    }

    const verification = verificationStore.get(verificationId);

    if (!verification) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'Verification not found or expired'
      });
    }

    // Check if expired
    if (Date.now() > verification.expiresAt) {
      verificationStore.delete(verificationId);
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Verification code expired'
      });
    }

    // Increment attempts
    verification.attempts++;

    // Check if too many attempts
    if (verification.attempts > 3) {
      verificationStore.delete(verificationId);
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Too many attempts'
      });
    }

    // Verify code
    if (verification.code === code.toString()) {
      verification.verified = true;
      console.log(`Email verified: ${verification.email}`);
      
      // Clean up after successful verification
      setTimeout(() => {
        verificationStore.delete(verificationId);
      }, 5 * 60 * 1000); // Keep for 5 minutes after verification

      res.json({
        success: true,
        valid: true,
        email: verification.email,
        message: 'Email verified successfully'
      });
    } else {
      res.json({
        success: false,
        valid: false,
        attemptsLeft: 3 - verification.attempts,
        error: 'Invalid verification code'
      });
    }

  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Failed to verify code'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeVerifications: verificationStore.size
  });
});

// Start server
app.listen(CONFIG.PORT, () => {
  console.log(`Email verification service running on port ${CONFIG.PORT}`);
  console.log('Health check: http://localhost:' + CONFIG.PORT + '/api/health');
});

module.exports = app;