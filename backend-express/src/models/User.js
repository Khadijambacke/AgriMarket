const { DataTypes } = require('sequelize'); 
const sequelize = require('../config/database'); 
const User = sequelize.define('User', { 
id: { 
type: DataTypes.BIGINT.UNSIGNED, 
primaryKey: true, 
autoIncrement: true, 
  }, 
nom:     { type: DataTypes.STRING, allowNull: false }, 
prenom:    { type: DataTypes.STRING, allowNull: false, unique: true }, 
email:    { type: DataTypes.STRING, allowNull: false, unique: true }, 
mot_de_passe: { type: DataTypes.STRING, allowNull: false }, 
role: { 
type: DataTypes.ENUM('admin', 'producteur', 'acheteur'), 
defaultValue: 'acheteur',
}, 
telephone: { type: DataTypes.STRING, allowNull: false, unique: true }, 
adresse: { type: DataTypes.STRING, allowNull: false }, 
photo_url: { type: DataTypes.STRING, allowNull: true }, 
}, { 
tableName: 'utilisateurs',   
timestamps: true, 
underscored: true, 
}); 
module.exports = User; 
