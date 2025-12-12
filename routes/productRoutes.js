const express = require('express');
const router = express.Router();
const productService = require('../services/productService');

router.get('/', productService.listProducts);
router.post('/', productService.createProduct);

module.exports = router;