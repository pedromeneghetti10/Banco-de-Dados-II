/*const express = require('express');
const bodyParser = require('body-parser');

const postgres = require('./database/postgres');
const mongo = require('./database/mongo');
const neo4j = require('./database/neo4j');
const redis = require('./database/redis');

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
app.use(bodyParser.json());

app.use('/users', userRoutes);
app.use('/products', productRoutes);

module.exports = app; 

const express = require('express');
const app = express();

// Para receber JSON no body
app.use(express.json());

// Servir arquivos estáticos da pasta public (front-end simples)
app.use(express.static('public'));

// Exemplo de rota usando userService
const integrationRoutes = require('./routes/integrationRoutes');
app.use('/integration', integrationRoutes);
const userService = require('./services/userService');

app.get('/users', async (req, res) => {
  try {
    const users = await userService.getAllUsers(); // função de exemplo
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
*/

const express = require('express');
const path = require('path');
const app = express();

// Para receber JSON no body
app.use(express.json());

// Servir front-end estático (public/index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Rotas
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const integrationRoutes = require('./routes/integrationRoutes');

app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/integration', integrationRoutes);

// rota raiz simples para health check (fallback se não houver index.html)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API running' });
});

module.exports = app;