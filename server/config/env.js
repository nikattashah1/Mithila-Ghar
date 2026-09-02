require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  jwtSecret: process.env.JWT_SECRET || 'local-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mithila-ghar',
  useMemoryDb: String(process.env.USE_MEMORY_DB || 'true').toLowerCase() === 'true',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeCurrency: process.env.STRIPE_CURRENCY || 'usd',
  nprPerUsd: Number(process.env.NPR_PER_USD || 133),
  esewaMerchantCode: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
  esewaSecretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
  esewaPaymentUrl: process.env.ESEWA_PAYMENT_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
  esewaStatusUrl: process.env.ESEWA_STATUS_URL || 'https://rc.esewa.com.np/api/epay/transaction/status/',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'noreply@mithilaghar.local',
  shippingFee: Number(process.env.SHIPPING_FEE || 150),
  freeShippingThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD || 2000)
};

module.exports = env;
