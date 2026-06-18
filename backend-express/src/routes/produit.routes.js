const express = require('express');
const router = express.Router();
const { index, show, store } = require('../controllers/produit.controllers');
const authenticate = require('../middleware/auth');
const role = require('../middleware/role');

/**
 * @swagger
 * /api/produits:
 *   get:
 *     summary: Récupère la liste de tous les produits
 *     tags: [Produits]
 *     responses:
 *       200:
 *         description: Liste des produits récupérée avec succès
 */
router.get('/', index);
/**
 * @swagger
 * /api/produits/{id}:
 *   get:
 *     summary: Récupère les détails d'un produit spécifique
 *     tags: [Produits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du produit
 *     responses:
 *       200:
 *         description: Détails du produit
 *       404:
 *         description: Produit introuvable
 */
router.get('/:id', show);

// Seul un producteur (ou admin) peut ajouter un produit
/**
 * @swagger
 * /api/produits:
 *   post:
 *     summary: Ajoute un nouveau produit (Nécessite le rôle producteur)
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               libelle:
 *                 type: string
 *               prix_unitaire:
 *                 type: number
 *               categorie_id:
 *                 type: integer
 *               unite:
 *                 type: string
 *               quantite_disponible:
 *                 type: number
 *     responses:
 *       201:
 *         description: Produit créé avec succès
 *       401:
 *         description: Non autorisé (Token manquant ou invalide)
 *       403:
 *         description: Accès refusé (Rôle insuffisant)
 */
router.post('/', authenticate, role('producteur'), store);

module.exports = router;
