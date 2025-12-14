require('dotenv').config();
const seedPg = require('./seed_postgres');
const seedMongo = require('./seed_mongo');
const seedNeo4j = require('./seed_neo4j');
const integration = require('../services/integrationService');

async function run() {
  try {
    console.log('Seeding Postgres...');
    await seedPg();
    console.log('Seeding MongoDB...');
    await seedMongo();
    console.log('Seeding Neo4j...');
    await seedNeo4j();

    // Call integration sync directly (no need to start the HTTP server)
    console.log('Running integration sync...');
    const fakeReq = {};
    const fakeRes = {
      json: (data) => { console.log('syncAll result:', data); return Promise.resolve(data); },
      status: function (code) { this._status = code; return this; },
    };

    await integration.syncAll(fakeReq, fakeRes);
    console.log('Seeding and sync completed');
    process.exit(0);
  } catch (err) {
    console.error('Seed runner error:', err.message || err);
    process.exit(1);
  }
}

run();
