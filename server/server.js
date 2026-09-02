const env = require('./config/env');
const { connectDb, getDb } = require('./config/db');
const app = require('./app');
const { seedDatabase } = require('./seed/seed');
const { initializeDatabase } = require('./seed/initDb');

connectDb()
  .then(async (db) => {
    await initializeDatabase();
    const row = await db.get('SELECT COUNT(*) as count FROM products');
    if (row && row.count === 0) {
      console.log('Empty database detected. Running seed...');
      await seedDatabase();
    }
    app.listen(env.port, () => {
      console.log(`Mithila Ghar API listening on ${env.serverUrl}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
