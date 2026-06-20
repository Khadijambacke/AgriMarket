const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { store, index, show, updateStatus } = require('../controllers/commande.controller');
const authenticate = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
///limite des commades par minute par personne
const commandeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limite chaque IP à 5 commandes par minute (anti-spam de commandes)
  message: { 
    message: 'Vous passez des commandes trop rapidement, veuillez patienter une minute.' 
  }
});

/**
 * @swagger
 * tags:
 *   name: Commandes
 *   description: Gestion des commandes passées entre acheteurs et producteurs
 */

/**
 * @swagger
 * /api/commandes:
 *   post:
 *     summary: Passer une nouvelle commande (Réservé aux utilisateurs connectés)
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - producteur_id
 *               - lignes
 *             properties:
 *               producteur_id:
 *                 type: integer
 *                 description: ID du producteur vendeur
 *               adresse_livraison:
 *                 type: string
 *                 description: Adresse complète de livraison
 *               notes:
 *                 type: string
 *                 description: Notes ou instructions spécifiques
 *               lignes:
 *                 type: array
 *                 description: Liste des produits commandés et leurs quantités
 *                 items:
 *                   type: object
 *                   required:
 *                     - produit_id
 *                     - quantite
 *                   properties:
 *                     produit_id:
 *                       type: integer
 *                       description: ID du produit à commander
 *                     quantite:
 *                       type: number
 *                       format: float
 *                       description: Quantité à commander (doit respecter la quantité minimale et les stocks)
 *     responses:
 *       201:
 *         description: Commande passée avec succès
 *       400:
 *         description: Données de commande invalides (stock insuffisant, mauvaise association produit/producteur, etc.)
 *       422:
 *         description: Erreur de validation des données transmises
 *       500:
 *         description: Erreur serveur
 */
// On place le "commandeLimiter" ici pour qu'il s'exécute avant de traiter la commande
router.post('/', authenticate, commandeLimiter, [
  body('producteur_id').isInt().withMessage('L’ID du producteur doit être un entier valide.'),
  body('adresse_livraison').optional().trim().notEmpty().withMessage('L’adresse de livraison ne peut pas être vide si spécifiée.'),
  body('notes').optional().trim(),
  body('lignes').isArray({ min: 1 }).withMessage('La commande doit comporter au moins une ligne de produit.'),
  body('lignes.*.produit_id').isInt().withMessage('Chaque ligne doit avoir un ID de produit valide.'),
  body('lignes.*.quantite').isFloat({ min: 0.01 }).withMessage('La quantité doit être supérieure à 0.'),
], store);

/**
 * @swagger
 * /api/commandes:
 *   get:
 *     summary: Récupérer la liste des commandes de l'utilisateur connecté (Acheteur ou Producteur ou Admin)
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des commandes récupérée avec succès
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/', authenticate, index);

/**
 * @swagger
 * /api/commandes/{id}:
 *   get:
 *     summary: Récupérer les détails d'une commande spécifique
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la commande
 *     responses:
 *       200:
 *         description: Détails de la commande récupérés avec succès
 *       403:
 *         description: Accès refusé (Vous n'êtes ni l'acheteur, ni le vendeur, ni l'admin de cette commande)
 *       404:
 *         description: Commande introuvable
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', authenticate, show);

/**
 * @swagger
 * /api/commandes/{id}/statut:
 *   put:
 *     summary: Mettre à jour le statut d'une commande
 *     description: Permet au producteur de faire évoluer le statut. Permet également à l'acheteur d'annuler sa commande si elle est encore 'en_attente'.
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la commande
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statut
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [en_attente, confirmee, en_preparation, expediee, livree, annulee, litige]
 *                 description: Nouveau statut de la commande
 *               note:
 *                 type: string
 *                 description: Note ou explication justifiant la mise à jour du statut
 *     responses:
 *       200:
 *         description: Statut de la commande mis à jour avec succès
 *       400:
 *         description: Transition de statut impossible (déjà livrée, déjà annulée, etc.) ou mauvaise permission d'acheteur
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Commande introuvable
 *       422:
 *         description: Données de statut invalides
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id/statut', authenticate, [
  body('statut').isIn(['en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee', 'litige'])
    .withMessage('Le statut spécifié est invalide.'),
  body('note').optional().trim(),
], updateStatus);

module.exports = router;
