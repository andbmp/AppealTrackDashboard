require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    const sql = fs.readFileSync('schema.sql', 'utf8');
    await client.query(sql);
    console.log('Schema executed successfully');
  } catch (err) {
    console.error('Error executing schema:', err);
  } finally {
    await client.end();
  }
}
run();
