const express = require('express'); 
const { body } = require('express-validator'); 
const router = express.Router(); 
const { register, login, logout, me } = require('../controllers/auth.controller'); 
const authenticate = require('../middleware/auth'); 

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               mot_de_passe:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *               telephone:
 *                 type: string
 *               adresse:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       422:
 *         description: Erreur de validation des données
 */
router.post('/register', [ 
  body('nom').notEmpty().withMessage('Le nom est requis.'), 
  body('prenom').notEmpty().withMessage('Le prénom est requis.'), 
  body('email').isEmail().withMessage('Email invalide.'), 
  body('mot_de_passe').isLength({ min: 6 }).withMessage('6 caractères minimum.'), 
], register); 

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur et génération du token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Connexion réussie et token renvoyé
 *       401:
 *         description: Identifiants invalides
 */
// POST /api/v1/login 
router.post('/login', [ 
  body('email').isEmail(), 
  body('password').notEmpty(), 
], login); 

// Routes protégées 

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Déconnexion d'un utilisateur (invalidation du token côté client)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non autorisé (Token manquant ou invalide)
 */
router.post('/logout', authenticate, logout); 

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Récupérer les informations de l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *       401:
 *         description: Non autorisé (Token manquant ou invalide)
 */
router.get('/me',     authenticate, me); 

// Route d'administration: seul l'admin peut voir tous les utilisateurs
const role = require('../middleware/role');
const { indexUsers } = require('../controllers/auth.controller');

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Récupérer la liste de tous les utilisateurs (Réservé à l'administrateur)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *       401:
 *         description: Non autorisé (Token manquant ou invalide)
 *       403:
 *         description: Accès refusé (Rôle insuffisant)
 */
router.get('/users', authenticate, role('admin'), indexUsers);

module.exports = router;