/*const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'reco_db',
  password: 'dudu2005',
  port: 5432
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Postgres error:', err));

module.exports = pool;
*/
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: 'localhost',
  database: process.env.PG_DB || 'reco_db',
  password: process.env.PG_PASS || 'pedrogato1210',
  port: 5432
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Postgres error:', err.message));

module.exports = pool;