const express = require('express');
const router = express.Router();
const { index, show, store, update, destroy } = require('../controllers/categorie.controller');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const role = require('../middleware/role');

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

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Ajoute une nouvelle catégorie (Admin uniquement)
 *     tags: [Catégories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               icone:
 *                 type: string
 *               categorie_parente_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Catégorie créée avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       422:
 *         description: Erreur de validation
 */
router.post('/', authenticate, role('admin'), [
  body('nom').notEmpty().withMessage('Le nom de la catégorie est obligatoire.')
], store);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Modifie une catégorie existante (Admin uniquement)
 *     tags: [Catégories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la catégorie à modifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               icone:
 *                 type: string
 *               categorie_parente_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Catégorie mise à jour avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Catégorie introuvable
 *       422:
 *         description: Erreur de validation
 */
router.put('/:id', authenticate, role('admin'), [
  body('nom').optional().notEmpty().withMessage('Le nom ne peut pas être vide.')
], update);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Supprime une catégorie (Admin uniquement)
 *     tags: [Catégories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la catégorie à supprimer
 *     responses:
 *       200:
 *         description: Catégorie supprimée avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Catégorie introuvable
 */
router.delete('/:id', authenticate, role('admin'), destroy);

module.exports = router;