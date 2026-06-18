const express = require('express');
const router = express.Router();
const { index, show, store } = require('../controllers/produit.controllers');
const authenticate = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/', index);
router.get('/:id', show);

// Seul un producteur (ou admin) peut ajouter un produit
router.post('/', authenticate, role('producteur'), store);

module.exports = router;
