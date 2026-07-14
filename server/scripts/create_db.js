const { Client } = require('pg');

const client = new Client({
  user: process.env.USER || 'ricardo',
  host: 'localhost',
  database: 'postgres',
  password: '', 
  port: 5432,
});

async function run() {
  try {
    await client.connect();
    await client.query('CREATE DATABASE bambu_cloud');
    console.log('Database bambu_cloud created successfully');
  } catch (err) {
    if (err.code === '42P04') {
        console.log('Database bambu_cloud already exists');
    } else {
        console.error('Error creating database:', err);
    }
  } finally {
    await client.end();
  }
}

run();
