const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/mithila-ghar.db');
const dataDir = path.join(__dirname, '../../data');

let dbInstance = null;

async function getDb() {
  if (dbInstance) return dbInstance;
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await dbInstance.exec('PRAGMA foreign_keys = ON;');
  
  return dbInstance;
}

async function connectDb() {
  const db = await getDb();
  console.log('SQLite database connected at', dbPath);
  return db;
}

async function disconnectDb() {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    console.log('SQLite database disconnected');
  }
}

module.exports = { connectDb, disconnectDb, getDb };
