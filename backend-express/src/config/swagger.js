const swaggerJsdoc = require('swagger-jsdoc'); 

const options = { 
  definition: { 
    openapi: '3.0.0',
    info: { 
      title: 'AgriMarket API', 
      version: '1.0.0', 
      description: 'API REST de AgriMarket, plateforme de vente de produits agricoles — Backend Express.js', 
    }, 
    servers: [
      { url: 'http://localhost:3000', description: 'Serveur de Développement' }
    ], 
    components: { 
      securitySchemes: { 
        bearerAuth: { 
          type: 'http', 
          scheme: 'bearer', 
          bearerFormat: 'JWT', 
          description: 'Entrez votre token JWT obtenu lors de la connexion', 
        }, 
      }, 
    }, 
    tags: [ 
      { name: 'Auth', description: 'Inscription, connexion et gestion de profil' }, 
      { name: 'Produits', description: 'Gestion des produits agricoles' }, 
      { name: 'Catégories', description: 'Gestion des catégories de produits' }, 
    ], 
  }, 
  apis: ['./src/routes/*.js'],   
}; 

const swaggerSpec = swaggerJsdoc(options); 
///modele commonjs
///dire a mon application Voici l'élément de ce fichier que j'autorise les autres fichiers à utiliser.
module.exports = swaggerSpec;
