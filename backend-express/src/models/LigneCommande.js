const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LigneCommande = sequelize.define('LigneCommande', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  commande_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  produit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantite: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  sous_total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  }
}, {
  tableName: 'lignes_commande',
  timestamps: true,
  underscored: true,
});

module.exports = LigneCommande;
