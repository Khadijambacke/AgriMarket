const { Categorie } = require('../models');

const index = async (req, res) => {
  try {
    const categories = await Categorie.findAll({
      include: [{
        model: Categorie,
        as: 'sous_categories',
        attributes: ['id', 'nom', 'slug']
      }],
      order: [['created_at', 'DESC']],
    });
    return res.status(200).json({
      message: 'Liste des catégories', 
      data: categories
    });
  } catch (error) {
    console.error('Erreur categorie.index:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const show = async (req, res) => {
  try {
    const categorie = await Categorie.findByPk(req.params.id, {
      include: [{
        model: Categorie,
        as: 'sous_categories'
      }]
    });
    
    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie introuvable.' });
    }
    
    return res.status(200).json({ message: 'Détail de la catégorie.', data: categorie });
  } catch (error) {
    console.error('Erreur categorie.show:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { index, show };