const express = require('express');
const router = express.Router();
const integration = require('../services/integrationService');

router.post('/sync', integration.syncAll); // limpa e repopula Redis
router.get('/clients', integration.getAllClientsFromCache); // lista clientes do Redis
router.get('/clients/:cpf', integration.getClientFromCache); // dados consolidados de um cliente
router.get('/clients/:cpf/recommendations', integration.getClientRecs); // recomendações
router.post('/clear-cache', integration.clearCache); // opcional: limpar cache

module.exports = router;
