const { Sequelize } = require('sequelize');
require('dotenv').config();
///sequilize le ORM

// Création de la connexion à la base de données MySQL via Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,    
  process.env.DB_USER,      
  process.env.DB_PASSWORD,  
  {
    host: process.env.DB_HOST,               
    port: parseInt(process.env.DB_PORT) || 3306, 
    dialect: 'mysql',                        
    logging: false,                         
    define: {
      underscored: true,  // Les colonnes s'écrivent en snake_case:typographe avec undescoe etc...
      timestamps: true,   // Sequelize gère created_at et updated_at automatiquement
    },
  }
);

module.exports = sequelize;
