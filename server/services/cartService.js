const { getDb } = require('../config/db');

async function mergeGuestCart(userId, sessionId) {
  const db = await getDb();
  
  // Find guest cart items
  const guestItems = await db.all('SELECT * FROM cart_items WHERE user_id = ?', [sessionId]);
  if (!guestItems.length) return;

  for (const item of guestItems) {
    // Check if user already has this product in cart
    const existing = await db.get('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, item.product_id]);
    
    if (existing) {
      await db.run('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [item.quantity, existing.id]);
    } else {
      await db.run('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [userId, item.product_id, item.quantity]);
    }
  }

  // Delete guest cart
  await db.run('DELETE FROM cart_items WHERE user_id = ?', [sessionId]);
}

module.exports = { mergeGuestCart };
