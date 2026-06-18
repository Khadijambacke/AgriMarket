const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./src/models');
const authRoutes = require('./src/routes/auth.routes');
const produitRoutes = require('./src/routes/produit.routes');
const categorieRoutes = require('./src/routes/categorie.routes');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
}));
app.use(express.json());

// Documentation Swagger (Optionnel)
try {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./src/config/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'AgriMarket API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  }));
} catch (error) {
  console.log('Swagger documentation not loaded. Ignored.');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/categories', categorieRoutes);

// Synchronisation base de données et lancement du serveur
const PORT = process.env.PORT || 3000;

sequelize.authenticate()
  .then(() => {
    console.log('Connexion à la base de données réussie.');
    // On peut utiliser .sync({ alter: true }) pour synchroniser les modèles si besoin
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Impossible de se connecter à la base de données:', err);
  });