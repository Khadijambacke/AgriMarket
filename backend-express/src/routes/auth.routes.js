const express = require('express'); 
const { body } = require('express-validator'); 
const router = express.Router(); 
const { register, login, logout, me } = require('../controllers/auth.controller'); 
const authenticate = require('../middleware/auth'); 

router.post('/register', [ 
  body('nom').notEmpty().withMessage('Le nom est requis.'), 
  body('prenom').notEmpty().withMessage('Le prénom est requis.'), 
  body('email').isEmail().withMessage('Email invalide.'), 
  body('mot_de_passe').isLength({ min: 6 }).withMessage('6 caractères minimum.'), 
], register); 

// POST /api/v1/login 
router.post('/login', [ 
  body('email').isEmail(), 
  body('password').notEmpty(), 
], login); 

// Routes protégées 
router.post('/logout', authenticate, logout); 
router.get('/me',     authenticate, me); 

// Route d'administration: seul l'admin peut voir tous les utilisateurs
const role = require('../middleware/role');
const { indexUsers } = require('../controllers/auth.controller');
router.get('/users', authenticate, role('admin'), indexUsers);

module.exports = router;