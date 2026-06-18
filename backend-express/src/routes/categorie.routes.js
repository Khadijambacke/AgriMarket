const express = require('express');
const router = express.Router();
const { index, show } = require('../controllers/categorie.controller');

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Récupère la liste de toutes les catégories
 *     tags: [Catégories]
 *     responses:
 *       200:
 *         description: Liste des catégories récupérée avec succès
 *       500:
 *         description: Erreur serveur
 */
router.get('/', index);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Récupère les détails d'une catégorie spécifique
 *     tags: [Catégories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la catégorie
 *     responses:
 *       200:
 *         description: Détails de la catégorie récupérés avec succès
 *       404:
 *         description: Catégorie introuvable
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', show);

module.exports = router;