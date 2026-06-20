const { Commande, LigneCommande, Produit, User, HistoriqueStatut, sequelize } = require('../models');
const { validationResult } = require('express-validator');

const store = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Erreur de validation des données.',
      errors: errors.mapped(),
    });
  }

  const { producteur_id, adresse_livraison, notes, lignes } = req.body;
  const acheteur_id = req.user.id;


  const t = await sequelize.transaction();

  try {
    // Vérifier que le producteur existe et a bien le rôle producteur
    const seller = await User.findByPk(producteur_id);
    if (!seller || seller.role !== 'producteur') {
      await t.rollback();
      return res.status(404).json({ message: 'Producteur introuvable.' });
    }

    let montant_total = 0;
    const lignesToCreate = [];
    const produitsToUpdate = [];

    // Parcourir chaque produit commandé
    for (const ligne of lignes) {
      const { produit_id, quantite } = ligne;

      
      const produit = await Produit.findByPk(produit_id, { transaction: t });
      if (!produit) {
        await t.rollback();
        return res.status(404).json({ message: `Le produit avec  est introuvable.` });
      }

     
      if (produit.producteur_id !== parseInt(producteur_id)) {
        await t.rollback();
        return res.status(400).json({
          message: `Le produit "${produit.libelle}" n'appartient pas au producteur spécifié.`,
        });
      }

      // Vérifier si le produit est disponible
      if (produit.statut !== 'disponible') {
        await t.rollback();
        return res.status(400).json({
          message: `Le produit "${produit.libelle}" n'est plus disponible à la vente.`,
        });
      }

      // Vérifier la quantité minimale de commande
      if (quantite < produit.quantite_min_commande) {
        await t.rollback();
        return res.status(400).json({
          message: `La quantité pour le produit "${produit.libelle}" (${quantite} ${produit.unite}) est inférieure au minimum requis (${produit.quantite_min_commande} ${produit.unite}).`,
        });
      }

      // Vérifier la quantité disponible (stock)
      if (parseFloat(produit.quantite_disponible) < parseFloat(quantite)) {
        await t.rollback();
        return res.status(400).json({
          message: `Stock insuffisant pour le produit "${produit.libelle}". Quantité disponible : ${produit.quantite_disponible} ${produit.unite}.`,
        });
      }

      const prix_unitaire = parseFloat(produit.prix_unitaire);
      const sous_total = parseFloat(quantite) * prix_unitaire;
      montant_total += sous_total;

      // Préparer la ligne de commande
      lignesToCreate.push({
        produit_id,
        quantite,
        prix_unitaire,
        sous_total,
      });

      // Préparer la mise à jour du produit (stock et statut éventuel)
      const nouvelle_quantite = parseFloat(produit.quantite_disponible) - parseFloat(quantite);
      produitsToUpdate.push({
        produit,
        nouvelle_quantite,
        statut: nouvelle_quantite === 0 ? 'epuise' : produit.statut,
      });
    }

    // 1. Créer la commande principale
    const commande = await Commande.create({
      acheteur_id,
      producteur_id,
      statut: 'en_attente',
      montant_total,
      adresse_livraison,
      notes,
    }, { transaction: t });

    // 2. Associer et créer les lignes de commande
    const lignesFinales = lignesToCreate.map(l => ({
      ...l,
      commande_id: commande.id,
    }));
    //la transaction pour pouvoir faire des rollback
    await LigneCommande.bulkCreate(lignesFinales, { transaction: t });

    // 3. Mettre à jour les stocks des produits
    for (const item of produitsToUpdate) {
      await item.produit.update({
        quantite_disponible: item.nouvelle_quantite,
        statut: item.statut,
      }, { transaction: t });
    }

    // 4. Enregistrer l'historique initial du statut
    await HistoriqueStatut.create({
      commande_id: commande.id,
      ancien_statut: null,
      nouveau_statut: 'en_attente',
      modifie_par: acheteur_id,
      note: notes || 'Commande créée par l’acheteur.',
    }, { transaction: t });

    // Valider la transaction
    await t.commit();

    // Recharger la commande avec ses lignes pour le retour
    const commandeComplete = await Commande.findByPk(commande.id, {
      include: [
        {
          model: LigneCommande,
          as: 'lignes',
          include: [{ model: Produit, as: 'produit', attributes: ['id', 'libelle', 'unite'] }],
        },
        {
          model: User,
          as: 'producteur_vendeur',
          attributes: ['id', 'nom', 'prenom', 'telephone'],
        }
      ],
    });

    return res.status(201).json({
      message: 'Commande passée avec succès.',
      data: commandeComplete,
    });
  } catch (error) {
    await t.rollback();
    console.error('Erreur commande.store:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la création de la commande.' });
  }
};

// 2. Lister les commandes (Acheteur, Producteur, Admin)
const index = async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;
    let filter = {};

    // Filtrer les commandes selon le rôle de l'utilisateur connecté
    if (userRole === 'acheteur') {
      filter = { acheteur_id: userId };
    } else if (userRole === 'producteur') {
      filter = { producteur_id: userId };
    } // Si admin, pas de filtre (voit toutes les commandes)

    const commandes = await Commande.findAll({
      where: filter,
      include: [
        {
          model: User,
          as: 'acheteur',
          attributes: ['id', 'nom', 'prenom', 'telephone', 'adresse'],
        },
        {
          model: User,
          as: 'producteur_vendeur',
          attributes: ['id', 'nom', 'prenom', 'telephone', 'adresse'],
        },
        {
          model: LigneCommande,
          as: 'lignes',
          include: [{ model: Produit, as: 'produit', attributes: ['id', 'libelle', 'unite'] }],
        }
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      message: 'Liste des commandes récupérée.',
      data: commandes,
    });
  } catch (error) {
    console.error('Erreur commande.index:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// 3. Obtenir les détails d'une commande
const show = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role: userRole } = req.user;

    const commande = await Commande.findByPk(id, {
      include: [
        {
          model: User,
          as: 'acheteur',
          attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'adresse'],
        },
        {
          model: User,
          as: 'producteur_vendeur',
          attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'adresse'],
        },
        {
          model: LigneCommande,
          as: 'lignes',
          include: [{ model: Produit, as: 'produit' }],
        },
        {
          model: HistoriqueStatut,
          as: 'historiques',
          include: [{ model: User, as: 'modificateur', attributes: ['id', 'nom', 'prenom', 'role'] }],
        }
      ],
    });

    if (!commande) {
      return res.status(404).json({ message: 'Commande introuvable.' });
    }

    // Vérifier l'autorisation : l'utilisateur doit être l'acheteur, le vendeur ou l'admin
    if (userRole !== 'admin' && commande.acheteur_id !== userId && commande.producteur_id !== userId) {
      return res.status(403).json({ message: 'Accès refusé pour cette commande.' });
    }

    return res.status(200).json({
      message: 'Détails de la commande.',
      data: commande,
    });
  } catch (error) {
    console.error('Erreur commande.show:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// 4. Modifier le statut d'une commande (Producteur / Acheteur / Admin)
const updateStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Données invalides.',
      errors: errors.mapped(),
    });
  }

  const { id } = req.params;
  const { statut, note } = req.body;
  const { id: userId, role: userRole } = req.user;

  const t = await sequelize.transaction();

  try {
    const commande = await Commande.findByPk(id, {
      include: [{ model: LigneCommande, as: 'lignes' }],
      transaction: t,
    });

    if (!commande) {
      await t.rollback();
      return res.status(404).json({ message: 'Commande introuvable.' });
    }

    const ancienStatut = commande.statut;

    // Si le statut est identique, pas de modification nécessaire
    if (ancienStatut === statut) {
      await t.rollback();
      return res.status(400).json({ message: `La commande a déjà le statut "${statut}".` });
    }

    // Règles d'autorisation :
    // - Un Acheteur ne peut QUE annuler sa propre commande et UNIQUEMENT si elle est 'en_attente'
    if (userRole === 'acheteur') {
      if (commande.acheteur_id !== userId) {
        await t.rollback();
        return res.status(403).json({ message: 'Vous n’êtes pas autorisé à modifier cette commande.' });
      }
      if (statut !== 'annulee') {
        await t.rollback();
        return res.status(400).json({ message: 'Un acheteur ne peut qu’annuler une commande.' });
      }
      if (ancienStatut !== 'en_attente') {
        await t.rollback();
        return res.status(400).json({
          message: 'Impossible d’annuler une commande déjà confirmée ou en cours de préparation.',
        });
      }
    }

    // - Un Producteur ne peut modifier que ses propres commandes reçues
    if (userRole === 'producteur') {
      if (commande.producteur_id !== userId) {
        await t.rollback();
        return res.status(403).json({ message: 'Vous n’êtes pas autorisé à modifier cette commande.' });
      }
    }

    // Règles d'état logique : impossible de modifier une commande déjà livrée ou annulée
    if (ancienStatut === 'annulee' || ancienStatut === 'livree') {
      await t.rollback();
      return res.status(400).json({
        message: `Impossible de modifier le statut d'une commande déjà ${ancienStatut}.`,
      });
    }

    const updates = { statut };

    // Mettre à jour les dates selon le statut
    if (statut === 'confirmee') {
      updates.confirme_le = new Date();
    } else if (statut === 'livree') {
      updates.livre_le = new Date();
    }

    // Si la commande est annulée, RESTAURER les stocks de produits !
    if (statut === 'annulee') {
      for (const ligne of commande.lignes) {
        const produit = await Produit.findByPk(ligne.produit_id, { transaction: t });
        if (produit) {
          const nouveauStock = parseFloat(produit.quantite_disponible) + parseFloat(ligne.quantite);
          await produit.update({
            quantite_disponible: nouveauStock,
            // S'il était épuisé, on le repasse en disponible
            statut: produit.statut === 'epuise' ? 'disponible' : produit.statut,
          }, { transaction: t });
        }
      }
    }

    // Mettre à jour la commande
    await commande.update(updates, { transaction: t });

    // Enregistrer l'historique du statut
    await HistoriqueStatut.create({
      commande_id: commande.id,
      ancien_statut: ancienStatut,
      nouveau_statut: statut,
      modifie_par: userId,
      note: note || `Changement de statut par l'utilisateur (${userRole}).`,
    }, { transaction: t });

    await t.commit();

    return res.status(200).json({
      message: 'Statut de la commande mis à jour avec succès.',
      data: {
        id: commande.id,
        ancien_statut: ancienStatut,
        nouveau_statut: statut,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error('Erreur commande.updateStatus:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du statut.' });
  }
};

module.exports = { store, index, show, updateStatus };
