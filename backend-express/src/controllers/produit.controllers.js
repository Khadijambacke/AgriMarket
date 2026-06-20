const { Produit, Categorie, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const index = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      categorie_id, 
      producteur_id,
      region, 
      min_prix, 
      max_prix 
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Construction dynamique du filtre
    let whereCondition = { statut: 'disponible' };

    if (search) {
      whereCondition.libelle = { [Op.like]: `%${search}%` };
    }
    if (categorie_id) {
      whereCondition.categorie_id = categorie_id;
    }
    if (producteur_id) {
      whereCondition.producteur_id = producteur_id;
    }
    if (region) {
      whereCondition.region = { [Op.like]: `%${region}%` };
    }
    if (min_prix || max_prix) {
      whereCondition.prix_unitaire = {};
      if (min_prix) whereCondition.prix_unitaire[Op.gte] = min_prix;
      if (max_prix) whereCondition.prix_unitaire[Op.lte] = max_prix;
    }

    const { count, rows: produits } = await Produit.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Categorie,
          as: 'categorie',
          attributes: ['id', 'nom', 'slug'],
        },
        {
          model: User,
          as: 'producteur',
          attributes: ['id', 'nom', 'prenom', 'telephone', 'adresse'],
        }
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      message: 'Liste des produits',
      data: produits,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Erreur produit.index:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const show = async (req, res) => {

  try {
    const produit = await Produit.findByPk(req.params.id, {
      include: [
        {
          model: Categorie,
          as: 'categorie',
          attributes: ['id', 'nom', 'slug'],
        },
        {
          model: User,
          as: 'producteur',
          attributes: ['id', 'nom', 'prenom', 'telephone', 'adresse', 'email'],
        }
      ],
    });

    if (!produit) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }
    return res.status(200).json({ message: 'Détail du produit.', data: produit });
  } catch (error) {
    console.error('Erreur produit.show:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const store = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Erreur de validation, verifier les achanps saisies.', errors:
        errors.mapped()
    });
    //mapped permet de transforme les erreurs en objet plus facile à lire.
  }
  ///sinon express  va ignorer les eventuel erreurs capturer  a partir du role

  try {
    //premiere const recuper ce que le clint nous donne
    const {
      categorie_id,
      libelle,
      description,
      prix_unitaire,
      unite,
      quantite_disponible,
      quantite_min_commande,
      region,
      ville,
      date_recolte,
      date_expiration
    } = req.body;
    ///req.body:indice duu carton
    ///mon body devrait recevoir ca l'equivalent de valedated de laravel

    // Le producteur est l'utilisateur connecté
    const producteur_id = req.user.id;

    // Gestion de l'image
    const image_url = req.file ? `/uploads/produits/${req.file.filename}` : null;

    const produit = await Produit.create({
      producteur_id,
      categorie_id,
      libelle,
      description,
      prix_unitaire,
      unite,
      quantite_disponible,
      quantite_min_commande: quantite_min_commande || 1,
      region,
      ville,
      date_recolte,
      date_expiration,
      statut: 'disponible',
      image_url
    });

    return res.status(201).json({ message: 'Produit créé avec succès.', data: produit });
  } catch (error) {
    console.error('Erreur produit.store:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const update = async (req, res) => {
  // 1. La douane : vérification des erreurs (identique au store)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Erreur de validation, verifier les achanps saisies.',
      errors: errors.mapped()
    });
  }

  try {
    // 2. Méthode du prof : On cherche le produit ET on vérifie que c'est le bon cuisinier en même temps
    const produit = await Produit.findOne({
      where: { id: req.params.id, producteur_id: req.user.id }
    });

    // S'il n'existe pas OU que ce n'est pas le bon cuisinier, ça renvoie null
    if (!produit) {
      return res.status(404).json({ message: 'Produit introuvable ou vous n\'en êtes pas le propriétaire.' });
    }

    // 4. L'ouverture du carton : on extrait UNIQUEMENT les choses qu'on a le droit de modifier
    const {
      categorie_id,
      libelle,
      description,
      prix_unitaire,
      unite,
      quantite_disponible,
      quantite_min_commande,
      region,
      ville,
      date_recolte,
      date_expiration,
      statut // Le producteur a peut-être le droit de le mettre en 'indisponible'
    } = req.body;

    // 5. La mise à jour du produit
    await produit.update({
      // Si on m'a envoyé un nouveau libelle, je le prends. 
      // Sinon (||), je garde l'ancien libelle qui est déjà dans la base (produit.libelle).
      categorie_id: categorie_id || produit.categorie_id,
      libelle: libelle || produit.libelle,
      description: description !== undefined ? description : produit.description,
      prix_unitaire: prix_unitaire || produit.prix_unitaire,
      unite: unite || produit.unite,
      quantite_disponible: quantite_disponible !== undefined ? quantite_disponible : produit.quantite_disponible,
      quantite_min_commande: quantite_min_commande || produit.quantite_min_commande,
      region: region || produit.region,
      ville: ville || produit.ville,
      date_recolte: date_recolte || produit.date_recolte,
      date_expiration: date_expiration !== undefined ? date_expiration : produit.date_expiration,
      statut: statut || produit.statut,
      image_url: req.file ? `/uploads/produits/${req.file.filename}` : produit.image_url
    });

    return res.status(200).json({ message: 'Produit mis à jour avec succès.', data: produit });
  } catch (error) {
    console.error('Erreur produit.update:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const destroy = async (req, res) => {
  try {
    
    const produit = await Produit.findOne({
      where: { id: req.params.id, producteur_id: req.user.id }
    });

    if (!produit) {
      return res.status(404).json({ message: 'Produit introuvable ou vous n\'en êtes pas le propriétaire.' });
    }

    // L'action radicale
    await produit.destroy();

    return res.status(200).json({ message: 'Produit supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur produit.destroy:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { index, show, store, update, destroy };
