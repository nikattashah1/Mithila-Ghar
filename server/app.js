const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const walletRoutes = require('./routes/walletRoutes');
const miscRoutes = require('./routes/miscRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { sitemap, robots } = require('./controllers/miscController');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
  })
);
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'test' ? 5 : 5,
  message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' }
});

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/wallet/transfer', rateLimit({ windowMs: 15 * 60 * 1000, max: env.nodeEnv === 'test' ? 1000 : 20 }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, name: 'Mithila Ghar API', testMode: true });
});

app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api', checkoutRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api', miscRoutes);
app.use('/api/admin', adminRoutes);
app.get('/sitemap.xml', sitemap);
app.get('/robots.txt', robots);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
