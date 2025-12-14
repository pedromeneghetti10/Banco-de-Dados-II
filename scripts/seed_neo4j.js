require('dotenv').config();
const driver = require('../database/neo4j');

async function seed() {
  if (!driver) {
    console.warn('Neo4j driver not initialized — skipping Neo4j seed');
    return;
  }
  const session = driver.session();
  try {
    // ensure unique constraint on cpf (idempotent in recent Neo4j)
    try {
      await session.run('CREATE CONSTRAINT IF NOT EXISTS FOR (c:Client) REQUIRE c.cpf IS UNIQUE');
    } catch (e) {
      // older server versions may not support this form; ignore
    }

    await session.run(`
      MERGE (a:Client {cpf: '11111111111', name: 'Alice'})
      MERGE (b:Client {cpf: '22222222222', name: 'Bob'})
      MERGE (c:Client {cpf: '33333333333', name: 'Carol'})
      MERGE (d:Client {cpf: '44444444444', name: 'Dave'})
      MERGE (e:Client {cpf: '55555555555', name: 'Eva'})
      MERGE (f:Client {cpf: '66666666666', name: 'Frank'})
      MERGE (g:Client {cpf: '77777777777', name: 'Gina'})
      MERGE (h:Client {cpf: '88888888888', name: 'Hugo'})

      // sparse friendship graph (few relations)
      MERGE (a)-[:FRIENDS]->(b)
      MERGE (b)-[:FRIENDS]->(c)
      MERGE (b)-[:FRIENDS]->(d)
      MERGE (e)-[:FRIENDS]->(f)
      MERGE (g)-[:FRIENDS]->(h)
    `);

    console.log('Neo4j seed completed');
  } catch (err) {
    console.error('Neo4j seed error:', err.message || err);
  } finally {
    await session.close();
  }
}

module.exports = seed;
