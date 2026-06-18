const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Commande = sequelize.define('Commande', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  acheteur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  producteur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee', 'litige'),
    defaultValue: 'en_attente',
  },
  montant_total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  adresse_livraison: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  confirme_le: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  livre_le: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'commandes',
  timestamps: true,
  underscored: true,
});

module.exports = Commande;
