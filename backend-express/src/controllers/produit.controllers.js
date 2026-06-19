const { Produit, Categorie, User } = require('../models');
const { validationResult } = require('express-validator');

const index = async (req, res) => {
  try {
    const produits = await Produit.findAll({
      where: { statut: 'disponible' },
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
      //trier par date d'ajout
      order: [['created_at', 'DESC']],
    });
    return res.status(200).json({
      message: 'Liste des produits',
      data: produits
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
      ville
    } = req.body;
    ///req.body:indice duu carton
    ///mon body devrait recevoir ca l'equivalent de valedated de laravel

    // Le producteur est l'utilisateur connecté
    const producteur_id = req.user.id;

    const produit = await Produit.create({
      producteur_id,
      categorie_id,
      libelle,
      description,
      prix_unitaire,
      unite,
      quantite_disponible,
      //||1 valeur par defaut du  quantite
      quantite_min_commande: quantite_min_commande || 1,
      region,
      ville,
      statut: 'disponible'
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
      statut: statut || produit.statut
    });

    return res.status(200).json({ message: 'Produit mis à jour avec succès.', data: produit });
  } catch (error) {
    console.error('Erreur produit.update:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const destroy = async (req, res) => {
  try {
    // Méthode du prof : Recherche et vérification de sécurité en une seule ligne
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
