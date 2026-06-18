const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Erreur de validation.',
      errors: errors.mapped(),
    });
  }
  
  const { nom, prenom, email, mot_de_passe, role, telephone, adresse } = req.body;
  
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(422).json({
        message: 'Erreur de validation.',
        errors: { email: { msg: 'Cet email est déjà utilisé.' } },
      });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const user = await User.create({ 
      nom, 
      prenom, 
      email, 
      mot_de_passe: hashedPassword, 
      role: role || 'acheteur', 
      telephone, 
      adresse 
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(201).json({ message: 'Inscription réussie.', user, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const isMatch = await bcrypt.compare(password, user.mot_de_passe);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({ message: 'Connexion réussie.', user, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const logout = async (req, res) => {
  return res.status(200).json({
    message: 'Déconnexion réussie. Supprimez le token côté client.',
  });
};

const me = async (req, res) => {
  return res.status(200).json({
    message: 'Profil récupéré.',
    user: {
      id: req.user.id,
      nom: req.user.nom,
      prenom: req.user.prenom,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

const indexUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['mot_de_passe'] } // Ne jamais renvoyer les mots de passe
    });
    return res.status(200).json({
      message: 'Liste des utilisateurs récupérée avec succès.',
      data: users
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs.' });
  }
};

module.exports = { register, login, logout, me, indexUsers };