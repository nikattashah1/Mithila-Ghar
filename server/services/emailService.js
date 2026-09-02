const env = require('../config/env');

function normalizeStatus(status = '') {
  return String(status || '').trim().toLowerCase();
}

function shouldSendShippingEmail(status = '') {
  const normalized = normalizeStatus(status);

  if (!normalized) return false;

  const shippingKeywords = [
    'shipped',
    'shipping confirmed',
    'shipping-confirmed',
    'dispatch',
    'dispatched',
    'delivery confirmed',
    'delivery-confirmed'
  ];

  return shippingKeywords.some((keyword) => normalized.includes(keyword)) || normalized.includes('ship');
}

async function sendEmail({ to, subject, text, html }) {
  if (!to) {
    return { sent: false, reason: 'Missing recipient email.' };
  }

  const host = process.env.SMTP_HOST || env.smtpHost;
  const user = process.env.SMTP_USER || env.smtpUser;
  const pass = process.env.SMTP_PASS || env.smtpPass;

  if (!host || !user || !pass) {
    const message = `\n[EMAIL SIMULATED]\nTo: ${to}\nSubject: ${subject}\n${text}\n`;
    console.log(message);

    return {
      sent: true,
      mode: 'simulated',
      to,
      subject,
      text,
      html
    };
  }

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || env.smtpPort || 587),
      secure: String(process.env.SMTP_SECURE || env.smtpSecure || 'false').toLowerCase() === 'true',
      auth: { user, pass }
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || env.smtpFrom || user,
      to,
      subject,
      text,
      html
    });

    return {
      sent: true,
      mode: 'smtp',
      to,
      subject,
      messageId: info?.messageId || null
    };
  } catch (error) {
    console.error('Shipping email send failed:', error);
    return { sent: false, reason: error.message || 'Email delivery failed.' };
  }
}

async function sendOrderPlacedEmail(order = {}) {
  const to = order.shipping_email || order.email || order.customer_email;
  const recipientName = order.shipping_name || order.name || 'Customer';
  const orderNumber = order.order_number || order.orderNumber || order.id || 'N/A';
  const total = Number(order.total ?? order.amount ?? 0);

  if (!to) {
    return { sent: false, reason: 'No shipping email found for this order.' };
  }

  const subject = `Your order ${orderNumber} has been placed successfully`;
  const text = [
    `Hello ${recipientName},`,
    '',
    `Your order ${orderNumber} has been placed successfully.`,
    'We have received your payment and your order is being prepared for dispatch.',
    `Total amount: NPR ${Number.isFinite(total) ? total.toFixed(2) : '0.00'}`,
    '',
    'We will ship it to you soon and keep you updated on the delivery status.',
    'Thank you for shopping with Mithila Ghar.'
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="color: #7c3aed;">Order Confirmation</h2>
      <p>Hello ${recipientName},</p>
      <p>Your order <strong>${orderNumber}</strong> has been placed successfully.</p>
      <p>We have received your payment and your order is being prepared for dispatch.</p>
      <p><strong>Total amount:</strong> NPR ${Number.isFinite(total) ? total.toFixed(2) : '0.00'}</p>
      <p>We will ship it to you soon and keep you updated on the delivery status.</p>
      <p>Thank you for shopping with Mithila Ghar.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}

async function sendShippingConfirmationEmail(order = {}) {
  const to = order.shipping_email || order.email || order.customer_email;
  const recipientName = order.shipping_name || order.name || 'Customer';
  const orderNumber = order.order_number || order.orderNumber || order.id || 'N/A';
  const total = Number(order.total ?? order.amount ?? 0);
  const status = order.status || 'Shipped';

  if (!to) {
    return { sent: false, reason: 'No shipping email found for this order.' };
  }

  const subject = `Your order ${orderNumber} has been ${status}`;
  const text = [
    `Hello ${recipientName},`,
    '',
    `Your order ${orderNumber} has been marked as ${status}.`,
    `Total amount: NPR ${Number.isFinite(total) ? total.toFixed(2) : '0.00'}`,
    '',
    'Thank you for shopping with Mithila Ghar.',
    'We will keep you updated on the delivery status.'
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="color: #7c3aed;">Order Update</h2>
      <p>Hello ${recipientName},</p>
      <p>Your order <strong>${orderNumber}</strong> has been marked as <strong>${status}</strong>.</p>
      <p><strong>Total amount:</strong> NPR ${Number.isFinite(total) ? total.toFixed(2) : '0.00'}</p>
      <p>Thank you for shopping with Mithila Ghar.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}

async function sendContactMessageEmail(message = {}) {
  const recipient = process.env.SMTP_FROM || env.smtpFrom || process.env.SMTP_USER || env.smtpUser;
  const subject = `New contact message: ${message.subject || 'Website enquiry'}`;
  const text = [
    `From: ${message.name || 'Visitor'} <${message.email}>`,
    `Subject: ${message.subject || 'Website enquiry'}`,
    '',
    message.message || ''
  ].join('\n');

  return sendEmail({ to: recipient, subject, text, html: `<p><strong>From:</strong> ${message.name || 'Visitor'} &lt;${message.email}&gt;</p><p><strong>Subject:</strong> ${message.subject || 'Website enquiry'}</p><p>${String(message.message || '').replace(/\n/g, '<br>')}</p>` });
}

async function sendRestockNotificationEmail(product = {}) {
  const subject = `${product.name} is back in stock`;
  const text = [
    `Hello ${product.customerName || 'Customer'},`,
    '',
    `${product.name} from your Mithila Ghar wishlist is now available again.`,
    `Price: NPR ${Number(product.price || 0).toFixed(2)}`,
    '',
    'Visit Mithila Ghar to place your order before it sells out again.',
    'Thank you for shopping with Mithila Ghar.'
  ].join('\n');

  return sendEmail({
    to: product.customerEmail,
    subject,
    text,
    html: `<p>Hello ${product.customerName || 'Customer'},</p><p><strong>${product.name}</strong> from your Mithila Ghar wishlist is now available again.</p><p><strong>Price:</strong> NPR ${Number(product.price || 0).toFixed(2)}</p><p>Visit Mithila Ghar to place your order before it sells out again.</p>`
  });
}

module.exports = {
  sendEmail,
  sendOrderPlacedEmail,
  sendShippingConfirmationEmail,
  sendContactMessageEmail,
  sendRestockNotificationEmail,
  shouldSendShippingEmail,
  normalizeStatus
};
