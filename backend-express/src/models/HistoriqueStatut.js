const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistoriqueStatut = sequelize.define('HistoriqueStatut', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  commande_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ancien_statut: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  nouveau_statut: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  modifie_par: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'historique_statuts',
  timestamps: true,
  underscored: true,
});

module.exports = HistoriqueStatut;
