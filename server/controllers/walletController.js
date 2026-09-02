const { getDb } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ensureWallet } = require('../services/walletService');

const getWalletData = asyncHandler(async (req) => {
  const db = await getDb();
  const wallet = await ensureWallet(req.user.id);
  const transactions = await db.all(
    `SELECT w.*, 
            u1.name as sender_name, u1.email as sender_email, 
            u2.name as receiver_name, u2.email as receiver_email 
     FROM wallet_transactions w
     LEFT JOIN users u1 ON w.sender_user_id = u1.id
     LEFT JOIN users u2 ON w.receiver_user_id = u2.id
     WHERE w.wallet_id = ?
     ORDER BY w.created_at DESC`, 
    [wallet.id]
  );

  const mappedTransactions = transactions.map(t => ({
    _id: t.id,
    id: t.id,
    type: t.type,
    amount: t.amount,
    status: t.status,
    description: t.description,
    reference: t.reference,
    referenceId: t.reference,
    note: t.description,
    createdAt: t.created_at,
    sender: t.sender_user_id ? { name: t.sender_name, email: t.sender_email } : null,
    receiver: t.receiver_user_id ? { name: t.receiver_name, email: t.receiver_email } : null
  }));

  return {
    wallet: { _id: wallet.id, id: wallet.id, balance: wallet.balance, currency: wallet.currency },
    transactions: mappedTransactions
  };
});

const getWallet = asyncHandler(async (req, res) => {
  const payload = await getWalletData(req);
  res.json(payload);
});

const getTransactions = asyncHandler(async (req, res) => {
  const payload = await getWalletData(req);
  res.json({ transactions: payload.transactions });
});

const topUp = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  const db = await getDb();
  await db.run('BEGIN TRANSACTION');
  try {
    const wallet = await db.get('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
    const newBalance = wallet.balance + Number(amount);
    await db.run('UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newBalance, wallet.id]);
    await db.run(
      'INSERT INTO wallet_transactions (wallet_id, receiver_user_id, type, amount, status, description, reference) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [wallet.id, req.user.id, 'TOP_UP', amount, 'completed', 'Added funds via simulation', `SIM-\${Date.now()}`]
    );
    await db.run('COMMIT');
    res.json({ message: 'Funds added successfully', balance: newBalance });
  } catch (err) {
    await db.run('ROLLBACK');
    throw err;
  }
});

const transfer = asyncHandler(async (req, res) => {
  const recipient = req.body.recipient || req.body.receiverEmail || req.body.to;
  const amount = Number(req.body.amount);
  const description = req.body.note || req.body.description || 'P2P Transfer';

  if (!recipient || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid transfer parameters.' });
  }

  const normalizedRecipient = String(recipient).trim().toLowerCase();
  const db = await getDb();

  const receiver = await db.get('SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(name) = ?', [
    normalizedRecipient.includes('@') ? normalizedRecipient : `${normalizedRecipient}@mithilaghar.local`,
    normalizedRecipient
  ]);

  if (!receiver) {
    return res.status(404).json({ message: 'Recipient not found.' });
  }

  if (receiver.id === req.user.id) {
    return res.status(400).json({ message: 'Cannot transfer to yourself.' });
  }

  const senderWallet = await ensureWallet(req.user.id);
  if (senderWallet.balance < amount) {
    return res.status(400).json({ message: 'Insufficient balance.' });
  }

  const receiverWallet = await ensureWallet(receiver.id);

  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('UPDATE wallets SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [amount, senderWallet.id]);
    await db.run('UPDATE wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [amount, receiverWallet.id]);

    const ref = `P2P-${Date.now()}`;
    await db.run(
      `INSERT INTO wallet_transactions (wallet_id, sender_user_id, receiver_user_id, type, amount, status, description, reference)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [senderWallet.id, req.user.id, receiver.id, 'TRANSFER', amount, 'completed', description, ref]
    );
    await db.run(
      `INSERT INTO wallet_transactions (wallet_id, sender_user_id, receiver_user_id, type, amount, status, description, reference)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [receiverWallet.id, req.user.id, receiver.id, 'TRANSFER', amount, 'completed', description, ref]
    );
    await db.run('COMMIT');

    const updated = await getWalletData(req);
    res.json({ message: 'Transfer successful', wallet: updated.wallet });
  } catch (err) {
    await db.run('ROLLBACK');
    throw err;
  }
});

module.exports = { getWallet, getTransactions, topUp, transfer };
