const pg = require('../database/postgres'); // Pool
const mongoose = require('../database/mongo'); // mongoose instance
const neo4jDriver = require('../database/neo4j'); // driver
const redisClient = require('../database/redis'); // redis client

// Helper: fetch relational data from Postgres
async function fetchPostgres() {
  const client = await pg.connect();
  try {
    // Ajuste os nomes de tabelas/colunas conforme seu schema real
    const clientsRes = await client.query('SELECT id, cpf, nome, endereco, cidade, uf, email FROM clientes');
    const purchasesRes = await client.query('SELECT id, id_produto, data, id_cliente FROM compras');
    const productsRes = await client.query('SELECT id, produto, valor, quantidade, tipo FROM produtos');
    return {
      clients: clientsRes.rows || [],
      purchases: purchasesRes.rows || [],
      products: productsRes.rows || []
    };
  } catch (err) {
    console.error('fetchPostgres error:', err.message);
    return { clients: [], purchases: [], products: [] };
  } finally {
    client.release();
  }
}

// Helper: fetch documents from MongoDB
async function fetchMongo() {
  try {
    // usaremos a coleção "profiles" (ajuste se necessário)
    const coll = mongoose.connection.collection('profiles');
    const docs = await coll.find({}).toArray();
    // cada doc pode ter { cpf, interests: [...] }
    return docs;
  } catch (err) {
    console.error('fetchMongo error:', err.message);
    return [];
  }
}

/*// Helper: fetch friendships from Neo4j
async function fetchNeo4j() {
  const session = neo4jDriver.session();
  try {
    // retornamos mapa de cpf -> [friendsCpf,...] com nome opcional
    const res = await session.run(
      `MATCH (c:Client)-[:FRIENDS]->(f:Client)
       RETURN c.cpf AS cpf, collect({cpf: f.cpf, name: f.name}) AS friends`
    );
    const map = {};
    res.records.forEach(r => {
      const cpf = r.get('cpf');
      const friends = r.get('friends');
      map[cpf] = friends;
    });
    return map;
  } catch (err) {
    console.error('fetchNeo4j error:', err.message);
    return {};
  } finally {
    await session.close();
  }
}*/
// Helper: fetch friendships from Neo4j
async function fetchNeo4j() {
  // Se Neo4j está desabilitado, retorna map vazio
  if (!neo4jDriver) {
    return {};
  }
  
  const session = neo4jDriver.session();
  try {
    // retornamos mapa de cpf -> [friendsCpf,...] com nome opcional
    const res = await session.run(
      `MATCH (c:Client)-[:FRIENDS]->(f:Client)
       RETURN c.cpf AS cpf, collect({cpf: f.cpf, name: f.name}) AS friends`
    );
    const map = {};
    res.records.forEach(r => {
      const cpf = r.get('cpf');
      const friends = r.get('friends');
      map[cpf] = friends;
    });
    return map;
  } catch (err) {
    console.error('fetchNeo4j error:', err.message);
    return {};
  } finally {
    await session.close();
  }
}

// Build consolidated clients map and recommendations
function consolidateData(pgData, mongoDocs, neo4jMap) {
  const byCpf = {};

  // products map by id
  const productsById = {};
  pgData.products.forEach(p => {
    productsById[p.id] = p;
  });

  // add clients from Postgres
  pgData.clients.forEach(c => {
    byCpf[c.cpf] = {
      id: c.id,
      cpf: c.cpf,
      nome: c.nome,
      endereco: c.endereco,
      cidade: c.cidade,
      uf: c.uf,
      email: c.email,
      interests: [],
      friends: [],
      purchases: [],
      recommendations: []
    };
  });

  // attach purchases
  pgData.purchases.forEach(p => {
    // find client's cpf via id_cliente from clients list
    const clientRow = pgData.clients.find(c => c.id === p.id_cliente);
    if (!clientRow) return;
    const cpf = clientRow.cpf;
    const prod = productsById[p.id_produto] || null;
    const purchase = {
      id: p.id,
      produto_id: p.id_produto,
      produto: prod ? prod.produto : null,
      valor: prod ? prod.valor : null,
      data: p.data
    };
    if (!byCpf[cpf]) {
      byCpf[cpf] = { cpf, purchases: [], friends: [], interests: [], recommendations: [] };
    }
    byCpf[cpf].purchases.push(purchase);
  });

  // attach mongo interests
  mongoDocs.forEach(d => {
    if (!d.cpf) return;
    if (!byCpf[d.cpf]) {
      byCpf[d.cpf] = { cpf: d.cpf, purchases: [], friends: [], interests: [], recommendations: [] };
    }
    byCpf[d.cpf].interests = d.interests || [];
  });

  // attach neo4j friends
  Object.entries(neo4jMap).forEach(([cpf, friends]) => {
    if (!byCpf[cpf]) {
      byCpf[cpf] = { cpf, purchases: [], friends: [], interests: [], recommendations: [] };
    }
    byCpf[cpf].friends = friends || [];
  });

  // Build simple recommendations:
  // Recommend products friends bought that client didn't buy yet
  Object.values(byCpf).forEach(client => {
    const boughtIds = new Set((client.purchases || []).map(p => p.produto_id).filter(Boolean));
    const recsMap = new Map();
    (client.friends || []).forEach(f => {
      const friend = byCpf[f.cpf];
      if (!friend || !friend.purchases) return;
      friend.purchases.forEach(p => {
        if (!boughtIds.has(p.produto_id) && p.produto_id) {
          // increment score
          const key = p.produto_id;
          const entry = recsMap.get(key) || { produto_id: p.produto_id, produto: p.produto, score: 0 };
          entry.score += 1;
          recsMap.set(key, entry);
        }
      });
    });
    // sort recs by score desc
    const recs = Array.from(recsMap.values()).sort((a,b)=>b.score-a.score).slice(0,10);
    client.recommendations = recs;
  });

  return byCpf;
}

// Store consolidated data into Redis
async function storeToRedis(consolidated) {
  // consolidated is map cpf -> clientObj
  // We use:
  // - set key `client:{cpf}` -> JSON string of client object
  // - set `clients:all` as a set of cpfs
  // - set `client:{cpf}:recs` as a list of JSON objects (LPUSH)
  // First clear existing `clients:all`
  try {
    // remove set (if exists)
    await redisClient.del('clients:all');
  } catch (err) {
    console.error('Redis clear error:', err.message);
  }

  const pipeline = redisClient.multi(); // use multi for batch
  for (const [cpf, client] of Object.entries(consolidated)) {
    const key = `client:${cpf}`;
    pipeline.set(key, JSON.stringify(client));
    pipeline.sAdd('clients:all', cpf);
    const recsKey = `client:${cpf}:recs`;
    pipeline.del(recsKey);
    if (client.recommendations && client.recommendations.length) {
      // push as JSON strings
      client.recommendations.forEach(r => pipeline.rPush(recsKey, JSON.stringify(r)));
    }
  }
  await pipeline.exec();
}

// Public controller functions for routes
module.exports = {
  // Sync route handler: clear cache and repopulate
  syncAll: async (req, res) => {
    try {
      const pgData = await fetchPostgres();
      const mongoDocs = await fetchMongo();
      const neo4jMap = await fetchNeo4j();
      const consolidated = consolidateData(pgData, mongoDocs, neo4jMap);
      await storeToRedis(consolidated);
      return res.json({ ok: true, clients: Object.keys(consolidated).length });
    } catch (err) {
      console.error('syncAll error:', err.message);
      return res.status(500).json({ ok: false, error: err.message });
    }
  },

  // Get all clients from Redis
  getAllClientsFromCache: async (req, res) => {
    try {
      const cpfs = await redisClient.sMembers('clients:all') || [];
      const pipeline = redisClient.multi();
      cpfs.forEach(cpf => pipeline.get(`client:${cpf}`));
      const results = await pipeline.exec();
      // results is array of arrays like [null, 'value'] depending on client driver;
      // but node-redis multi.exec returns array of replies directly when using v4
      const clients = results.map(r => {
        try { return JSON.parse(r); } catch(e) { return r; }
      });
      return res.json(clients);
    } catch (err) {
      console.error('getAllClientsFromCache error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  },

  // Get single client from Redis (by cpf)
  getClientFromCache: async (req, res) => {
    const cpf = req.params.cpf;
    try {
      const raw = await redisClient.get(`client:${cpf}`);
      if (!raw) return res.status(404).json({ error: 'client not found in cache' });
      const client = JSON.parse(raw);
      return res.json(client);
    } catch (err) {
      console.error('getClientFromCache error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  },

  // Get recommendations list from Redis for a client
  getClientRecs: async (req, res) => {
    const cpf = req.params.cpf;
    try {
      const recs = await redisClient.lRange(`client:${cpf}:recs`, 0, -1);
      const parsed = recs.map(r => {
        try { return JSON.parse(r); } catch(e) { return r; }
      });
      return res.json(parsed);
    } catch (err) {
      console.error('getClientRecs error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  },

  // Utility: clear cache (optionally call from syncAll, but exposed)
  clearCache: async (req, res) => {
    try {
      const cpfs = await redisClient.sMembers('clients:all') || [];
      const pipeline = redisClient.multi();
      pipeline.del('clients:all');
      cpfs.forEach(cpf => {
        pipeline.del(`client:${cpf}`);
        pipeline.del(`client:${cpf}:recs`);
      });
      await pipeline.exec();
      return res.json({ ok: true, cleared: cpfs.length });
    } catch (err) {
      console.error('clearCache error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }
};