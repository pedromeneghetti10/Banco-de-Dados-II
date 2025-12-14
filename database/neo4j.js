/*const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', '1234')
);

driver.getExecutableQueries
  ? console.log('Connected to Neo4j')
  : console.log('Neo4j initialized');

module.exports = driver; 

const neo4j = require('neo4j-driver');

// Use valores padrão para desenvolvimento local; remoto requer credenciais válidas
const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASS || '1234';

let driver;
try {
  driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  console.log('Neo4j driver initialized');
} catch (err) {
  console.error('Neo4j driver error:', err.message);
  // fallback: cria driver dummy que fará fallback em queries
  driver = null;
}

module.exports = driver;


TEMPORARIAMENTE DESABILITADO
const neo4j = require('neo4j-driver');

// Neo4j desabilitado por enquanto (retorna null)
// Isso permite que o app rode sem Neo4j
console.log('Neo4j disabled (using fallback)');

module.exports = null; 



ESTAVA UTILIZANDO 
require('dotenv').config();
const neo4j = require('neo4j-driver');

// Configuração para Neo4j local
const uri = process.env.NEO4J_URI; 
const user = process.env.NEO4J_USER; 
const password = process.env.NEO4J_PASS;

let driver;

try {
  driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  console.log('Neo4j driver initialized');
} catch (err) {
  console.error('Neo4j driver error:', err.message);
  driver = null;
}

module.exports = driver;

*/

require('dotenv').config();
const neo4j = require('neo4j-driver');

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASS;

let driver = null;
if (!uri || !user || !password) {
  console.warn('NEO4J_URI/NEO4J_USER/NEO4J_PASS not fully set — skipping Neo4j initialization');
} else {
  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    // Verify connectivity and log a friendly message like other DB modules
    driver.verifyConnectivity()
      .then(() => console.log('Connected to Neo4j'))
      .catch(err => console.error('Neo4j connectivity error:', err.message));
  } catch (err) {
    console.error('Neo4j driver error:', err.message);
    driver = null;
  }
}

async function testConnection() {
  if (!driver) {
    console.error('Neo4j driver not initialized');
    return;
  }
  try {
    await driver.verifyConnectivity();
    console.log('Conexão OK');
  } catch (err) {
    console.error('Erro ao conectar no Neo4j:', err.message || err);
  }
}

// Export the driver as the module default so existing code can call `.session()`
module.exports = driver;
module.exports.testConnection = testConnection;