const mongoose = require('mongoose');

async function withTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (isTransactionUnsupported(error)) {
      return work(null);
    }
    throw error;
  } finally {
    session.endSession();
  }
}

function isTransactionUnsupported(error) {
  const message = String(error?.message || '');
  return (
    message.includes('Transaction numbers are only allowed') ||
    message.includes('replica set') ||
    error?.code === 20
  );
}

module.exports = { withTransaction, withTransaction: withTransaction };
