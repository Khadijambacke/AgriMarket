const sequelize = require('../config/database');
const User = require('./User');
const Categorie = require('./Categorie');
const Produit = require('./Produit');
const Commande = require('./Commande');
const LigneCommande = require('./LigneCommande');
const HistoriqueStatut = require('./HistoriqueStatut');
const Evaluation = require('./Evaluation');

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

// Commande <-> LigneCommande
Commande.hasMany(LigneCommande, { foreignKey: 'commande_id', as: 'lignes' });
LigneCommande.belongsTo(Commande, { foreignKey: 'commande_id', as: 'commande' });

// Produit <-> LigneCommande
Produit.hasMany(LigneCommande, { foreignKey: 'produit_id', as: 'lignes_commande' });
LigneCommande.belongsTo(Produit, { foreignKey: 'produit_id', as: 'produit' });

// Commande <-> HistoriqueStatut
Commande.hasMany(HistoriqueStatut, { foreignKey: 'commande_id', as: 'historiques' });
HistoriqueStatut.belongsTo(Commande, { foreignKey: 'commande_id', as: 'commande' });

// User <-> HistoriqueStatut
User.hasMany(HistoriqueStatut, { foreignKey: 'modifie_par', as: 'statuts_modifies' });
HistoriqueStatut.belongsTo(User, { foreignKey: 'modifie_par', as: 'modificateur' });

// Commande <-> Evaluation
Commande.hasMany(Evaluation, { foreignKey: 'commande_id', as: 'evaluations' });
Evaluation.belongsTo(Commande, { foreignKey: 'commande_id', as: 'commande' });

// User <-> Evaluation
User.hasMany(Evaluation, { foreignKey: 'evaluateur_id', as: 'evaluations_donnees' });
Evaluation.belongsTo(User, { foreignKey: 'evaluateur_id', as: 'evaluateur' });

User.hasMany(Evaluation, { foreignKey: 'evalue_id', as: 'evaluations_recues' });
Evaluation.belongsTo(User, { foreignKey: 'evalue_id', as: 'evalue' });

module.exports = { sequelize, User, Categorie, Produit, Commande, LigneCommande, HistoriqueStatut, Evaluation };