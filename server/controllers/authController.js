const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const env = require('../config/env');
const { getDb } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { mergeGuestCart } = require('../services/cartService');
const { ensureWallet } = require('../services/walletService');
const { getOrCreateSessionId } = require('../utils/session');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

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

const requestPasswordReset = asyncHandler(async (req, res) => {
  const db = await getDb();
  const email = String(req.body.email || '').toLowerCase().trim();
  const genericResponse = { message: 'If an account exists for that email, a reset link has been sent.' };
  if (!validator.isEmail(email)) return res.json(genericResponse);

  const user = await db.get('SELECT id, name, email FROM users WHERE email = ?', [email]);
  if (!user) return res.json(genericResponse);

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await db.run('DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at < CURRENT_TIMESTAMP', [user.id]);
  await db.run('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, datetime(\'now\', \'+30 minutes\'))', [user.id, tokenHash]);
  const resetUrl = `${env.clientUrl}/reset-password?token=${rawToken}`;
  const result = await sendPasswordResetEmail({ email: user.email, name: user.name, resetUrl });
  if (!result.sent) console.error('Password reset email failed:', result.reason);
  res.json(genericResponse);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword || newPassword.length < 8) return res.status(400).json({ message: 'A valid token and password of at least 8 characters are required.' });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const db = await getDb();
  const reset = await db.get('SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP', [tokenHash]);
  if (!reset) return res.status(400).json({ message: 'This reset link is invalid or expired.' });
  await db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [await bcrypt.hash(newPassword, 10), reset.user_id]);
  await db.run('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?', [reset.id]);
  res.json({ message: 'Password reset successfully. You can now log in.' });
});

const me = asyncHandler(async (req, res) => {
  const db = await getDb();
  const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
  res.json({ user: { _id: user.id, ...user } });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  const db = await getDb();
  if (name) {
    await db.run('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
  }
  if (newPassword) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, (await db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id])).password_hash))) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(newPassword, 10), req.user.id]);
  }
  const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
  res.json({ user: { _id: user.id, ...user } });
});

module.exports = { register, login, requestPasswordReset, resetPassword, me, updateMe };
