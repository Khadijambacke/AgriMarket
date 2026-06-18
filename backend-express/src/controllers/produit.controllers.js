const { Produit, Categorie, User } = require('../models');
const { validationResult } = require('express-validator');

const index = async (req, res) => {
  try {
    const produits = await Produit.findAll({
      where: { statut: 'disponible' },
      include: [
        {
          model: Categorie,
          as: 'categorie',
          attributes: ['id', 'nom', 'slug'],
        },
        {
          model: User,
          as: 'producteur',
          attributes: ['id', 'nom', 'prenom'],
        }
      ],
      order: [['created_at', 'DESC']],
    });
    return res.status(200).json({
      message: 'Liste des produits', 
      data: produits
    });
  } catch (error) {
    console.error('Erreur produit.index:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const show = async (req, res) => {
  try {
    const produit = await Produit.findByPk(req.params.id, {
      include: [
        {
          model: Categorie,
          as: 'categorie',
          attributes: ['id', 'nom', 'slug'],
        },
        {
          model: User,
          as: 'producteur',
          attributes: ['id', 'nom', 'prenom'],
        }
      ],
    });
    
    if (!produit) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }
    
    return res.status(200).json({ message: 'Détail du produit.', data: produit });
  } catch (error) {
    console.error('Erreur produit.show:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const store = async (req, res) => {
  try {
    const { 
      categorie_id, 
      libelle, 
      description, 
      prix_unitaire, 
      unite, 
      quantite_disponible, 
      quantite_min_commande, 
      region, 
      ville 
    } = req.body;
    
    // Le producteur est l'utilisateur connecté
    const producteur_id = req.user.id;
    
    const produit = await Produit.create({
      producteur_id,
      categorie_id,
      libelle,
      description,
      prix_unitaire,
      unite,
      quantite_disponible,
      quantite_min_commande: quantite_min_commande || 1,
      region,
      ville,
      statut: 'disponible'
    });
    
    return res.status(201).json({ message: 'Produit créé avec succès.', data: produit });
  } catch (error) {
    console.error('Erreur produit.store:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { index, show, store };
