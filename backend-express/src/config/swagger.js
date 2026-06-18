const swaggerJsdoc = require('swagger-jsdoc'); 
const options = { 
definition: { 
openapi: '3.0.0',
info: { 
title: 'Gestion Med API', 
version: '1.0.0', 
description: 'API REST de réservation médicale — Backend Express.js', 
    }, 
servers: [{ url: 'http://localhost:3000', description: 'Développement' }], 
components: { 
securitySchemes: { 
bearerAuth: { 
type: 'http', 
scheme: 'bearer', 
bearerFormat: 'JWT', 
description: 'Entrez votre token JWT obtenu via POST /api/v1/login', 
        }, 
      }, 
    }, 
tags: [ 
      { 
name: 'Auth',     
      { 
description: 'Inscription, connexion, déconnexion' }, 
name: 'Services', description: 'Consultation des services médicaux' }, 
      { 
      { 
      { 
name: 'Patient',  description: 'Gestion des réservations' }, 
name: 'Médecin',  description: 'Gestion des services et réservations' }, 
name: 'Admin',    
description: 'Administration complète' }, 
    ], 
  }, 
apis: ['./src/routes/*.js'],   
}; 
// fichiers contenant les @swagger 
const swaggerSpec = swaggerJsdoc(options); 
module.exports = swaggerSpec; 
