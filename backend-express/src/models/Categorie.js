const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Categorie = sequelize.define('Categorie', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  icone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  categorie_parente_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true,
});

module.exports = Categorie;