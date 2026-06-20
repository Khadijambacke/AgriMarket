const express = require('express'); 
const { body } = require('express-validator'); 
const router = express.Router(); 
const { register, login, logout, me } = require('../controllers/auth.controller'); 
const authenticate = require('../middleware/auth'); 
const rateLimit = require('express-rate-limit');

// 🛡️ Création du "Vigile" pour le Login (Rate Limiting)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite chaque IP à 5 requêtes par fenêtre de 15 minutes
  message: { 
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.' 
  }
});

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
  //la verification en 2 etapes de express:sur les routes et s'il capture
  //une erreur c'est au niveu du controller qu'on le saura 
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
// On place le "loginLimiter" ici pour qu'il s'exécute avant le reste
router.post('/login', loginLimiter, [ 
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