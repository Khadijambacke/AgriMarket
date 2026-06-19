const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evaluation = sequelize.define('Evaluation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  commande_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  evaluateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  evalue_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  note: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    }
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'evaluations',
  timestamps: true,
  underscored: true,
});

module.exports = Evaluation;
