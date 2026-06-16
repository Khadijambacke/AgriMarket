# AFRI-MARKET — Marketplace Agricole

## Présentation

Afri-Market est une plateforme web qui connecte directement des producteurs agricoles et des acheteurs. Les producteurs publient leurs récoltes disponibles avec le prix, la quantité et la localisation. Les acheteurs parcourent les produits et passent commande. La plateforme gère ensuite le suivi de la commande jusqu'à la livraison, puis les deux parties s'évaluent mutuellement.

## Les acteurs

Il y a trois types d'utilisateurs sur la plateforme. Le **producteur** publie ses récoltes et gère les commandes qu'il reçoit. L'**acheteur** cherche des produits et passe des commandes. L'**administrateur** gère les catégories, surveille la plateforme et peut bloquer des comptes.

## Les entités et leurs relations

**utilisateurs** — Tous les rôles sont dans une seule table. Un producteur, un acheteur et un admin ont tous un nom, prénom, email, mot de passe et adresse. Seul le champ `role` les différencie.

**categories** — Liste des familles de produits (Légumes, Fruits, Céréales...). Une catégorie peut avoir des sous-catégories grâce au champ `categorie_parente_id`. L'admin gère cette liste librement sans toucher au code.

**produits** — Les récoltes publiées par les producteurs. Chaque produit appartient à un producteur et à une catégorie. Il contient le libellé, le prix, la quantité disponible, l'unité de mesure, la région, la ville, et les dates de récolte et d'expiration.

**commandes** — Une commande lie un acheteur à un producteur. Une commande = un seul producteur. Elle passe par plusieurs statuts : en attente → confirmée → en préparation → expédiée → livrée. Elle peut aussi être annulée ou passer en litige.

**lignes_commande** — Le détail de chaque commande. Une commande peut contenir plusieurs produits. Le prix unitaire est figé au moment de la commande, même si le producteur change son prix après.

**historique_statuts** — Chaque changement de statut d'une commande est enregistré ici avec la date, qui l'a fait, et pourquoi. Indispensable en cas de litige.

**evaluations** — Après livraison, l'acheteur évalue le producteur et le producteur évalue l'acheteur. La note va de 1 à 5. On ne peut évaluer qu'une seule fois par commande et par sens.

## Stack technique

Node.js + Express pour le backend, MySQL avec phpMyAdmin en local, JWT pour l'authentification, bcrypt pour les mots de passe.
