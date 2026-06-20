const { Evaluation, Commande, User } = require('../models');
const { validationResult } = require('express-validator');

const store = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Erreur de validation des données.',
      errors: errors.mapped()
    });
  }

  try {
    const { commande_id, note, commentaire } = req.body;
    const evaluateur_id = req.user.id;

    const commande = await Commande.findByPk(commande_id);
    if (!commande) {
      return res.status(404).json({ message: 'Commande introuvable.' });
    }
    if (commande.acheteur_id !== evaluateur_id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à évaluer cette commande.' });
    }

    if (commande.statut !== 'livree') {
      return res.status(400).json({ message: 'Vous ne pouvez évaluer qu\'une commande livrée.' });
    }

    const evaluationExistante = await Evaluation.findOne({
      where: { commande_id }
    });
    if (evaluationExistante) {
      return res.status(400).json({ message: 'Vous avez déjà évalué cette commande.' });
    }

    const evalue_id = commande.producteur_id;
    const evaluation = await Evaluation.create({
      commande_id,
      evaluateur_id,
      evalue_id,
      note,
      commentaire
    });

    return res.status(201).json({
      message: 'Évaluation ajoutée avec succès.',
      data: evaluation
    });

  } catch (error) {
    console.error('Erreur evaluation.store:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir les évaluations d'un producteur spécifique
const getProducteurEvaluations = async (req, res) => {
  try {
    const { id } = req.params; // ID du producteur

    const evaluations = await Evaluation.findAll({
      where: { evalue_id: id },
      include: [
        {
          model: User,
          as: 'evaluateur',
          attributes: ['id', 'nom', 'prenom'] // On n'affiche que des infos basiques de l'acheteur
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      message: 'Évaluations récupérées.',
      data: evaluations
    });
  } catch (error) {
    console.error('Erreur evaluation.getProducteurEvaluations:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Supprimer une évaluation (Uniquement par l'auteur ou un admin)
const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const evaluation = await Evaluation.findByPk(id);

    if (!evaluation) {
      return res.status(404).json({ message: 'Évaluation introuvable.' });
    }

    // Règle métier stricte : Le producteur évalué NE PEUT PAS supprimer le commentaire.
    // Seul l'acheteur (l'auteur de l'évaluation) ou un administrateur peut le faire.
    if (userRole !== 'admin' && evaluation.evaluateur_id !== userId) {
      return res.status(403).json({ 
        message: 'Accès refusé. Seul l\'auteur de l\'évaluation ou un administrateur peut la supprimer.' 
      });
    }

    await evaluation.destroy();

    return res.status(200).json({ message: 'Évaluation supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur evaluation.destroy:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { store, getProducteurEvaluations, destroy };
