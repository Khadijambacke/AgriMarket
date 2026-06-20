const { Categorie } = require('../models');
const { validationResult } = require('express-validator');

// Récupérer toutes les catégories
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

// Récupérer une catégorie par son ID
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

// Ajouter une nouvelle catégorie
const store = async (req, res) => {
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Erreur de validation.',
      errors: errors.mapped()
    });
  }

  try {
    // carton req.body
    const { nom, icone, categorie_parente_id } = req.body;
    
    // Générer le slug à partir du nom
    const slug = nom.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const categorie = await Categorie.create({
      nom,
      slug,
      icone,
      categorie_parente_id
    });
    return res.status(201).json({ message: 'Catégorie créée avec succès.', data: categorie });
  } catch (error) {
    console.error('Erreur categorie.store:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
// Modifier une catégorie
const update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Erreur de validation.',
      errors: errors.mapped()
    });
  }

  try {
    const categorie = await Categorie.findByPk(req.params.id);

    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie introuvable.' });
    }

    const { nom, icone, categorie_parente_id } = req.body;

    let slug = categorie.slug;
    if (nom) {
      slug = nom.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    await categorie.update({
      nom: nom || categorie.nom,
      slug: slug,
      icone: icone !== undefined ? icone : categorie.icone,
      categorie_parente_id: categorie_parente_id !== undefined ? categorie_parente_id : categorie.categorie_parente_id
    });

    return res.status(200).json({ message: 'Catégorie mise à jour.', data: categorie });
  } catch (error) {
    console.error('Erreur categorie.update:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Supprimer une catégorie
const destroy = async (req, res) => {
  try {
    const categorie = await Categorie.findByPk(req.params.id);

    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie introuvable.' });
    }

    await categorie.destroy();

    return res.status(200).json({ message: 'Catégorie supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur categorie.destroy:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { index, show, store, update, destroy };