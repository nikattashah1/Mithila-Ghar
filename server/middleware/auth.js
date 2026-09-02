const jwt = require('jsonwebtoken');
const { getDb } = require('../config/db');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.mg_token) return req.cookies.mg_token;
  return null;
}

const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const db = await getDb();
    const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ message: 'Account not found or inactive.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const db = await getDb();
    const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
    if (user) req.user = user;
  } catch {
    /* ignore invalid optional tokens */
  }
  next();
});

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { protect, optionalAuth, authorize, extractToken };
