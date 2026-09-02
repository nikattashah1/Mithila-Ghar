const crypto = require('crypto');
const env = require('../config/env');
const { nprToStripeAmount } = require('../utils/pricing');

function getStripe() {
  if (!env.stripeSecretKey) return null;
  const Stripe = require('stripe');
  return new Stripe(env.stripeSecretKey);
}

function createEsewaSignature(fields) {
  const message = `total_amount=${fields.total_amount},transaction_uuid=${fields.transaction_uuid},product_code=${fields.product_code}`;
  return crypto.createHmac('sha256', env.esewaSecretKey).update(message).digest('base64');
}

function esewaForm(order, transactionUuid) {
  const total = order.total.toFixed(2);
  const fields = {
    amount: order.subtotal.toFixed(2),
    tax_amount: '0',
    total_amount: total,
    transaction_uuid: transactionUuid,
    product_code: env.esewaMerchantCode,
    product_service_charge: '0',
    product_delivery_charge: order.shippingFee.toFixed(2),
    success_url: `${env.serverUrl}/api/payments/esewa/success`,
    failure_url: `${env.serverUrl}/api/payments/esewa/failure`,
    signed_field_names: 'total_amount,transaction_uuid,product_code'
  };
  fields.signature = createEsewaSignature(fields);
  return {
    paymentUrl: env.esewaPaymentUrl,
    fields
  };
}

function decodeEsewaPayload(data) {
  const json = Buffer.from(String(data), 'base64').toString('utf8');
  return JSON.parse(json);
}

async function verifyEsewaStatus(transactionUuid, totalAmount) {
  const url = new URL(env.esewaStatusUrl);
  url.searchParams.set('product_code', env.esewaMerchantCode);
  url.searchParams.set('total_amount', totalAmount);
  url.searchParams.set('transaction_uuid', transactionUuid);
  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error('eSewa status verification failed.');
  }
  return response.json();
}

function luhnOk(num) {
  const digits = String(num).replace(/\D/g, '');
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return digits.length >= 13 && digits.length <= 19 && sum % 10 === 0;
}

function processDemoCard({ number, cvc }) {
  const digits = String(number || '').replace(/\s/g, '');
  const cv = String(cvc || '');
  if (!/^\d{3,4}$/.test(cv)) {
    return { ok: false, code: 'invalid', message: 'Invalid CVC (test mode).' };
  }
  if (digits === '4000000000000002') {
    return { ok: false, code: 'declined', message: 'Card declined (test card).', last4: '0002' };
  }
  if (digits === '4242424242424242' || (luhnOk(digits) && digits.startsWith('4'))) {
    return { ok: true, last4: digits.slice(-4), brand: 'visa' };
  }
  return { ok: false, code: 'invalid', message: 'Invalid test card number.', last4: digits.slice(-4) };
}

module.exports = {
  getStripe,
  nprToStripeAmount,
  esewaForm,
  decodeEsewaPayload,
  verifyEsewaStatus,
  getStripe: getStripe,
  nprToStripeAmount: nprToStripeAmount,
  esewaForm: esewaForm,
  decodeEsewaPayload: decodeEsewaPayload,
  verifyEsewaStatus: verifyEsewaStatus,
  processDemoCard,
  luhnOk
};
