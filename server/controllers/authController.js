const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const env = require('../config/env');
const { getDb } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { mergeGuestCart } = require('../services/cartService');
const { ensureWallet } = require('../services/walletService');
const { getOrCreateSessionId } = require('../utils/session');

function signToken(userId) {
  return jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const confirmPassword = req.body.confirmPassword || req.body.confirmPassword;
  
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All registration fields are required.' });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Password confirmation does not match.' });
  }

  const db = await getDb();
  
  const existing = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (existing) {
    return res.status(400).json({ message: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await db.run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name.trim(), email.toLowerCase(), passwordHash, 'customer']
  );
  
  const userId = result.lastID;
  const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);

  await ensureWallet(userId);
  const sessionId = getOrCreateSessionId(req, res);
  await mergeGuestCart(userId, sessionId);

  const token = signToken(userId);
  res.status(201).json({ token, user: { _id: user.id, id: user.id, name: user.name, email: user.email, role: user.role } });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const db = await getDb();
  const user = await db.get('SELECT * FROM users WHERE email = ?', [String(email).toLowerCase()]);

  if (!user) {
    return res.status(401).json({ message: 'Account not found.' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ message: 'Incorrect password.' });
  }

  await ensureWallet(user.id);
  const sessionId = getOrCreateSessionId(req, res);
  await mergeGuestCart(user.id, sessionId);

  const token = signToken(user.id);
  res.json({ token, user: { _id: user.id, id: user.id, name: user.name, email: user.email, role: user.role } });
});

const me = asyncHandler(async (req, res) => {
  const db = await getDb();
  const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
  res.json({ user: { _id: user.id, ...user } });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const db = await getDb();
  if (name) {
    await db.run('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
  }
  const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
  res.json({ user: { _id: user.id, ...user } });
});

module.exports = { register, login, me, updateMe };
