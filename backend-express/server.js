// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// const sequelize = require('./src/config/database');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // ─── Middlewares ───────────────────────────────────────────────
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ─── Route de test ────────────────────────────────────────────
// app.get('/', (req, res) => {
//   res.json({
//     message: '✅ AgriMarket API fonctionne !',
//     version: '1.0.0',
//   });
// });

// // ─── Démarrage du serveur + connexion BDD ─────────────────────
// sequelize
//   .authenticate()
//   .then(() => {
//     console.log('✅ Connexion à la base de données réussie !');
//     app.listen(PORT, () => {
//       console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error('❌ Impossible de se connecter à la base de données :', err.message);
//   });
