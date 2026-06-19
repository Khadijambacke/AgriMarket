const express = require('express');
const router = express.Router();
const { index, show, store, update, destroy } = require('../controllers/produit.controllers');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const role = require('../middleware/role');

//Elle définit la liste des règles à vérifier.
//  Elle ne bloque rien, elle note juste les infractions dans un coin de la requête (req).
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
const validateProduit = [
  body('categorie_id').isInt().withMessage('La catégorie doit être un entier valide.'),
  body('libelle').trim().notEmpty().withMessage('Le nom du produit est requis.').isLength({ max: 150 }).withMessage('Le libellé ne doit pas dépasser 150 caractères.'),
  body('prix_unitaire').isFloat({ min: 0 }).withMessage('Le prix unitaire doit être un nombre positif.'),
  body('unite').isIn(['kg', 'tonne', 'sac', 'caisse', 'botte', 'litre']).withMessage('Unité non valide (kg, tonne, sac, caisse, botte, litre).'),
  body('quantite_disponible').isFloat({ min: 0 }).withMessage('La quantité disponible doit être un nombre positif.'),
  body('quantite_min_commande').optional().isFloat({ min: 0 }).withMessage('La quantité minimale de commande doit être un nombre positif.'),
  body('region').optional().trim().isLength({ max: 100 }).withMessage('La région ne doit pas dépasser 100 caractères.'),
  body('ville').optional().trim().isLength({ max: 100 }).withMessage('La ville ne doit pas dépasser 100 caractères.'),
  body('date_recolte').optional().isISO8601().toDate().withMessage('La date de récolte doit être une date valide (AAAA-MM-JJ).'),
  body('date_expiration').optional().isISO8601().toDate().withMessage("La date d'expiration doit être une date valide (AAAA-MM-JJ).")
];

const validateProduitUpdate = [
  body('categorie_id').optional().isInt().withMessage('La catégorie doit être un entier valide.'),
  body('libelle').optional().trim().notEmpty().withMessage('Le nom du produit ne peut pas être vide.').isLength({ max: 150 }).withMessage('Le libellé ne doit pas dépasser 150 caractères.'),
  body('prix_unitaire').optional().isFloat({ min: 0 }).withMessage('Le prix unitaire doit être un nombre positif.'),
  body('unite').optional().isIn(['kg', 'tonne', 'sac', 'caisse', 'botte', 'litre']).withMessage('Unité non valide (kg, tonne, sac, caisse, botte, litre).'),
  body('quantite_disponible').optional().isFloat({ min: 0 }).withMessage('La quantité disponible doit être un nombre positif.'),
  body('quantite_min_commande').optional().isFloat({ min: 0 }).withMessage('La quantité minimale de commande doit être un nombre positif.'),
  body('region').optional().trim().isLength({ max: 100 }).withMessage('La région ne doit pas dépasser 100 caractères.'),
  body('ville').optional().trim().isLength({ max: 100 }).withMessage('La ville ne doit pas dépasser 100 caractères.'),
  body('date_recolte').optional().isISO8601().toDate().withMessage('La date de récolte doit être une date valide (AAAA-MM-JJ).'),
  body('date_expiration').optional().isISO8601().toDate().withMessage("La date d'expiration doit être une date valide (AAAA-MM-JJ)."),
  body('statut').optional().isIn(['disponible', 'epuise', 'suspendu']).withMessage('Statut non valide.')
];

router.post('/', authenticate, role('producteur', 'admin'), validateProduit, store);

// * @swagger
//  * /api/produits/{id}:
//  *   post:
//  *     summary: Modifier un produit
//  *     tags: [Produits]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               libelle:
//  *                 type: string
//  *               prix_unitaire:
//  *                 type: number
//  *               categorie_id:
//  *                 type: integer
//  *               unite:
//  *                 type: string
//  *               quantite_disponible:
//  *                 type: number
//  *     responses:
//  *       201:
//  *         description: Produit modifie avec succès
//  *       401:
//  *         description: Non autorisé (Token manquant ou invalide)
//  *       403:
//  *         description: Accès refusé (Rôle insuffisant)
//  */
router.put('/:id', authenticate, role('producteur', 'admin'), validateProduitUpdate, update);

router.delete('/:id', authenticate, role('producteur', 'admin'), destroy);

module.exports = router;
