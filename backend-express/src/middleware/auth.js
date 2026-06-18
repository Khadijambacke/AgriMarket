const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
    try {
        // 1. Extraire le token de l'en-tête Authorization: Bearer <token> 
        ///baerer c'est le token qui est doonne par le front quand utilisateur se connecte: "Bearer 123"
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token non fourni.' });
        }
        
        const token = authHeader.split(' ')[1];
        ///il extrait le token du champ authorization il enleve le baerer
        
        
        let decoded;
        try {

            decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expiré. Reconnectez-vous.' });
            }
            return res.status(401).json({ message: 'Token invalide.' }); 
        }

        // 3. Charger l'utilisateur depuis la base 
        const user = await User.findByPk(decoded.id);
        //decoded.id c'est l'id de l'utilisateur qui est dans le token
        
        if (!user) {
            return res.status(401).json({ message: 'Utilisateur introuvable.' });
        }
        
        // 4. Attacher l'utilisateur à la requête 
        req.user = user;
        next(); // passer au middleware/contrôleur suivant 
    } catch(error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
};

module.exports = authenticate;