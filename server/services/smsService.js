const env = require('../config/env');

function normalizePhone(phone = '') {
  return String(phone || '').replace(/[^+\d]/g, '');
}

async function sendSms({ to, message }) {
  const recipient = normalizePhone(to);
  if (!recipient) return { sent: false, reason: 'Missing recipient phone number.' };

  const mode = String(env.smsMode || 'simulated').toLowerCase();
  if (mode === 'disabled') return { sent: false, mode: 'disabled', to: recipient };

  if (mode !== 'twilio') {
    console.log(`\n[SMS SIMULATED]\nTo: ${recipient}\n${message}\n`);
    return { sent: true, mode: 'simulated', to: recipient, message };
  }

  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioFrom) {
    return { sent: false, mode: 'twilio', to: recipient, reason: 'Twilio configuration is incomplete.' };
  }

  const credentials = Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString('base64');
  const body = new URLSearchParams({
    To: recipient,
    From: env.twilioFrom,
    Body: message
  });
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.twilioAccountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    const result = await response.json();
    if (!response.ok) {
      return { sent: false, mode: 'twilio', to: recipient, reason: result.message || 'SMS provider rejected the message.' };
    }

    return { sent: true, mode: 'twilio', to: recipient, messageId: result.sid || null };
  } catch (error) {
    return { sent: false, mode: 'twilio', to: recipient, reason: error.message || 'SMS provider is unavailable.' };
  }
}

async function sendOrderPlacedSms(order = {}) {
  const orderNumber = order.order_number || order.orderNumber || order.id || 'N/A';
  return sendSms({
    to: order.shipping_phone || order.phone,
    message: `Mithila Ghar: Order ${orderNumber} placed successfully. We will update you when it is confirmed.`
  });
}

async function sendOrderConfirmedSms(order = {}) {
  const orderNumber = order.order_number || order.orderNumber || order.id || 'N/A';
  return sendSms({
    to: order.shipping_phone || order.phone,
    message: `Mithila Ghar: Order ${orderNumber} is confirmed and being prepared.`
  });
}

async function sendOrderShippedSms(order = {}) {
  const orderNumber = order.order_number || order.orderNumber || order.id || 'N/A';
  const trackingText = order.trackingUrl ? ` Track: ${order.trackingUrl}` : '';
  return sendSms({
    to: order.shipping_phone || order.phone,
    message: `Mithila Ghar: Order ${orderNumber} has shipped.${trackingText}`
  });
}

module.exports = {
  normalizePhone,
  sendSms,
  sendOrderPlacedSms,
  sendOrderConfirmedSms,
  sendOrderShippedSms
};
