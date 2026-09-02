const { getDb } = require('../config/db');

async function ensureWallet(userId) {
  const db = await getDb();
  let wallet = await db.get('SELECT * FROM wallets WHERE user_id = ?', [userId]);

  if (!wallet) {
    await db.run('INSERT INTO wallets (user_id, balance, currency) VALUES (?, ?, ?)', [
      userId,
      0,
      'NPR'
    ]);
    wallet = await db.get('SELECT * FROM wallets WHERE user_id = ?', [userId]);
  }
  return wallet;
}

module.exports = { ensureWallet };
