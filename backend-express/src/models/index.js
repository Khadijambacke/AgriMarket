const sequelize = require('../config/database');
const User = require('./User');
const Categorie = require('./Categorie');
const Produit = require('./Produit');
const Commande = require('./Commande');

// Un Utilisateur (producteur) a plusieurs Produits
User.hasMany(Produit, { foreignKey: 'producteur_id', as: 'produits' });
Produit.belongsTo(User, { foreignKey: 'producteur_id', as: 'producteur' });

// Une Categorie a plusieurs Produits
Categorie.hasMany(Produit, { foreignKey: 'categorie_id', as: 'produits' });
Produit.belongsTo(Categorie, { foreignKey: 'categorie_id', as: 'categorie' });

// Les relations hiérarchiques de la Catégorie (parent-enfant)
Categorie.hasMany(Categorie, { foreignKey: 'categorie_parente_id', as: 'sous_categories' });
Categorie.belongsTo(Categorie, { foreignKey: 'categorie_parente_id', as: 'categorie_parente' });

// Les relations de la Commande
// Un Utilisateur (acheteur) a passé plusieurs Commandes
User.hasMany(Commande, { foreignKey: 'acheteur_id', as: 'commandes_passees' });
Commande.belongsTo(User, { foreignKey: 'acheteur_id', as: 'acheteur' });

// Un Utilisateur (producteur) a reçu plusieurs Commandes
User.hasMany(Commande, { foreignKey: 'producteur_id', as: 'commandes_recues' });
Commande.belongsTo(User, { foreignKey: 'producteur_id', as: 'producteur_vendeur' });

module.exports = { sequelize, User, Categorie, Produit, Commande };