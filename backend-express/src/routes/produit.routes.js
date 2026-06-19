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
router.post('/', authenticate, role('producteur', 'admin'), store);

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
router.put('/:id', authenticate, role('producteur', 'admin'), [
    // Ici on vérifie les champs d'un Produit !
    body('libelle').optional().notEmpty().withMessage('Le nom du produit ne peut pas être vide.'),
    body('prix_unitaire').optional().isFloat({ min: 0 }).withMessage('Le prix doit être positif.'),
], update);

router.delete('/:id', authenticate, role('producteur', 'admin'), destroy);

module.exports = router;
