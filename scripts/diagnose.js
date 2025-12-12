

// scripts/diagnose.js
const fs = require('fs');
const path = require('path');

console.log('\n========== DIAGNÓSTICO DO SISTEMA ==========\n');

// Verifica arquivos essenciais
const files = [
  'database/postgres.js',
  'database/mongo.js',
  'database/neo4j.js',
  'database/redis.js',
  'services/integrationService.js',
  'routes/integrationRoutes.js',
  '.env'
];

console.log('📁 Arquivos:');
files.forEach(f => {
  const exists = fs.existsSync(path.join(__dirname, '..', f));
  console.log(`  ${exists ? '✓' : '✗'} ${f}`);
});

console.log('\n🔌 Testando conexões:\n');

// Testa cada conexão individualmente
(async () => {
  // Redis
  console.log('Redis...');
  try {
    const redisClient = require('../database/redis');
    const pong = await redisClient.ping();
    console.log(`  ✓ Redis: ${pong}`);
    await redisClient.disconnect?.();
  } catch (err) {
    console.log(`  ✗ Redis: ${err.message}`);
  }

  // Postgres
  console.log('PostgreSQL...');
  try {
    const pg = require('../database/postgres');
    const res = await pg.query('SELECT NOW()');
    console.log(`  ✓ PostgreSQL: conectado`);
    pg.end?.();
  } catch (err) {
    console.log(`  ✗ PostgreSQL: ${err.message}`);
  }

  // MongoDB
  console.log('MongoDB...');
  try {
    const mongoose = require('../database/mongo');
    const state = mongoose.connection.readyState; // 0=disc, 1=conn, 2=connecting, 3=disconn
    console.log(`  ${state === 1 ? '✓' : '✗'} MongoDB: ${['disconnected', 'connected', 'connecting', 'disconnecting'][state] || 'unknown'}`);
  } catch (err) {
    console.log(`  ✗ MongoDB: ${err.message}`);
  }

  // Neo4j
  console.log('Neo4j...');
  try {
    const driver = require('../database/neo4j');
    if (!driver) {
      console.log(`  ✗ Neo4j: driver é null`);
    } else {
      // tenta uma query simples
      const session = driver.session();
      const res = await session.run('RETURN 1');
      console.log(`  ✓ Neo4j: conectado`);
      await session.close();
      await driver.close();
    }
  } catch (err) {
    console.log(`  ✗ Neo4j: ${err.message}`);
  }

  console.log('\n========== FIM DO DIAGNÓSTICO ==========\n');
  process.exit(0);
})();