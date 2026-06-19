const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { store, getProducteurEvaluations, destroy } = require('../controllers/evaluation.controller');
const authenticate = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Evaluations
 *   description: Gestion des notes et commentaires laissés par les acheteurs
 */

/**
 * @swagger
 * /api/evaluations:
 *   post:
 *     summary: Ajouter une évaluation pour une commande livrée
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commande_id
 *               - note
 *             properties:
 *               commande_id:
 *                 type: integer
 *                 description: ID de la commande (doit être "livree")
 *               note:
 *                 type: integer
 *                 description: Note de 1 à 5
 *               commentaire:
 *                 type: string
 *                 description: Commentaire optionnel sur le produit/vendeur
 *     responses:
 *       201:
 *         description: Évaluation ajoutée avec succès
 *       400:
 *         description: Commande non livrée ou déjà évaluée
 *       403:
 *         description: Non autorisé (l'utilisateur n'est pas l'acheteur de la commande)
 *       404:
 *         description: Commande introuvable
 *       422:
 *         description: Données invalides
 */
router.post('/', authenticate, [
  body('commande_id').isInt().withMessage('L\'ID de la commande doit être un entier valide.'),
  body('note').isInt({ min: 1, max: 5 }).withMessage('La note doit être comprise entre 1 et 5.'),
  body('commentaire').optional().trim()
], store);

/**
 * @swagger
 * /api/evaluations/producteur/{id}:
 *   get:
 *     summary: Récupérer toutes les évaluations reçues par un producteur
 *     tags: [Evaluations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du producteur
 *     responses:
 *       200:
 *         description: Liste des évaluations récupérée
 *       500:
 *         description: Erreur serveur
 */
router.get('/producteur/:id', getProducteurEvaluations);

/**
 * @swagger
 * /api/evaluations/{id}:
 *   delete:
 *     summary: Supprimer une évaluation (Auteur ou Admin uniquement)
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'évaluation
 *     responses:
 *       200:
 *         description: Évaluation supprimée avec succès
 *       403:
 *         description: Accès refusé (le vendeur ne peut pas supprimer un avis)
 *       404:
 *         description: Évaluation introuvable
 */
router.delete('/:id', authenticate, destroy);

module.exports = router;
