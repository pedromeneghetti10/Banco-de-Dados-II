/*onst redis = require('redis');

const client = redis.createClient();

client.connect()
  .then(() => console.log('Connected to Redis'))
  .catch(err => console.error('Redis error:', err));

module.exports = client; */

const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: 6379,
  legacyMode: false
});

client.on('error', (err) => console.error('Redis client error:', err));
client.on('connect', () => console.log('Connected to Redis'));

// Conectar assincronamente (sem bloquear o módulo)
client.connect().catch((err) => {
  console.error('Redis connection error:', err.message);
  // não relança — deixa o cliente tentar reconectar
});

module.exports = client;
