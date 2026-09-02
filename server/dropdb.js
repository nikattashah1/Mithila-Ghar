const mongoose = require('mongoose');

async function dropAndClean() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mithila-ghar');
    console.log('Connected. Dropping database...');
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

dropAndClean();
