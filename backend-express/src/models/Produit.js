const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Produit = sequelize.define('Produit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  producteur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  categorie_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  libelle: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  unite: {
    type: DataTypes.ENUM('kg', 'tonne', 'sac', 'caisse', 'botte', 'litre'),
    allowNull: false,
  },
  quantite_disponible: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  quantite_min_commande: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1,
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ville: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  date_recolte: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  date_expiration: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  statut: {
    type: DataTypes.ENUM('disponible', 'epuise', 'suspendu'),
    defaultValue: 'disponible',
  }
}, {
  tableName: 'produits',
  timestamps: true,
  underscored: true,
});

module.exports = Produit;
