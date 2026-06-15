-- ============================================================
--   AFRI-MARKET — Script de création de base de données
--   Compatible : Sequelize (underscored: true, timestamps: true)
--   Base de données : afrimarket (correspond au .env)
-- ============================================================

CREATE DATABASE IF NOT EXISTS afrimarket
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE afrimarket;

-- ============================================================
-- TABLE 1 : utilisateurs
-- ============================================================
CREATE TABLE utilisateurs (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  nom             VARCHAR(100)  NOT NULL,
  prenom          VARCHAR(100)  NOT NULL,
  email           VARCHAR(150)  NOT NULL UNIQUE,
  mot_de_passe    VARCHAR(255)  NOT NULL,
  role            ENUM('producteur', 'acheteur', 'admin') NOT NULL,
  telephone       VARCHAR(20),
  adresse         TEXT,
  photo_url       VARCHAR(255),
  est_actif       BOOLEAN DEFAULT TRUE,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- ============================================================
-- TABLE 2 : categories
-- ============================================================
CREATE TABLE categories (
  id                   INT PRIMARY KEY AUTO_INCREMENT,
  nom                  VARCHAR(100) NOT NULL,
  slug                 VARCHAR(100) NOT NULL UNIQUE,
  icone                VARCHAR(50),
  categorie_parente_id INT DEFAULT NULL,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categorie_parente_id) REFERENCES categories(id)
) ENGINE=InnoDB;


-- ============================================================
-- TABLE 3 : produits
-- ============================================================
CREATE TABLE produits (
  id                    INT PRIMARY KEY AUTO_INCREMENT,
  producteur_id         INT NOT NULL,
  categorie_id          INT NOT NULL,
  libelle               VARCHAR(150) NOT NULL,
  description           TEXT,
  prix_unitaire         DECIMAL(10,2) NOT NULL,
  unite                 ENUM('kg','tonne','sac','caisse','botte','litre') NOT NULL,
  quantite_disponible   DECIMAL(10,2) NOT NULL,
  quantite_min_commande DECIMAL(10,2) DEFAULT 1,
  region                VARCHAR(100),
  ville                 VARCHAR(100),
  date_recolte          DATE,
  date_expiration       DATE,
  statut                ENUM('disponible','epuise','suspendu') DEFAULT 'disponible',
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (producteur_id) REFERENCES utilisateurs(id),
  FOREIGN KEY (categorie_id)  REFERENCES categories(id)
) ENGINE=InnoDB;


-- ============================================================
-- TABLE 4 : commandes
-- ============================================================
CREATE TABLE commandes (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  acheteur_id       INT NOT NULL,
  producteur_id     INT NOT NULL,
  statut            ENUM(
                      'en_attente',
                      'confirmee',
                      'en_preparation',
                      'expediee',
                      'livree',
                      'annulee',
                      'litige'
                    ) DEFAULT 'en_attente',
  montant_total     DECIMAL(12,2) NOT NULL,
  adresse_livraison TEXT,
  notes             TEXT,
  confirme_le       DATETIME,
  livre_le          DATETIME,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (acheteur_id)   REFERENCES utilisateurs(id),
  FOREIGN KEY (producteur_id) REFERENCES utilisateurs(id)
) ENGINE=InnoDB;


-- ============================================================
-- TABLE 5 : lignes_commande
-- ============================================================
CREATE TABLE lignes_commande (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  commande_id     INT NOT NULL,
  produit_id      INT NOT NULL,
  quantite        DECIMAL(10,2) NOT NULL,
  prix_unitaire   DECIMAL(10,2) NOT NULL,
  sous_total      DECIMAL(12,2) NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (commande_id) REFERENCES commandes(id),
  FOREIGN KEY (produit_id)  REFERENCES produits(id)
) ENGINE=InnoDB;


-- ============================================================
-- TABLE 6 : historique_statuts
-- ============================================================
CREATE TABLE historique_statuts (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  commande_id     INT NOT NULL,
  ancien_statut   VARCHAR(50),
  nouveau_statut  VARCHAR(50) NOT NULL,
  modifie_par     INT NOT NULL,
  note            TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (commande_id) REFERENCES commandes(id),
  FOREIGN KEY (modifie_par) REFERENCES utilisateurs(id)
) ENGINE=InnoDB;


-- ============================================================
-- TABLE 7 : evaluations
-- ============================================================
CREATE TABLE evaluations (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  commande_id     INT NOT NULL,
  evaluateur_id   INT NOT NULL,
  evalue_id       INT NOT NULL,
  note            TINYINT NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire     TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_evaluation (commande_id, evaluateur_id),
  FOREIGN KEY (commande_id)   REFERENCES commandes(id),
  FOREIGN KEY (evaluateur_id) REFERENCES utilisateurs(id),
  FOREIGN KEY (evalue_id)     REFERENCES utilisateurs(id)
) ENGINE=InnoDB;


-- ============================================================
-- DONNÉES DE TEST — Catégories
-- ============================================================
INSERT INTO categories (nom, slug, icone, categorie_parente_id) VALUES
('Légumes',    'legumes',    '🥦', NULL),
('Fruits',     'fruits',     '🍊', NULL),
('Céréales',   'cereales',   '🌾', NULL),
('Tubercules', 'tubercules', '🥔', NULL),
('Épices',     'epices',     '🌶️', NULL),
('Tomates',    'tomates',    '🍅', 1),
('Oignons',    'oignons',    '🧅', 1),
('Mangues',    'mangues',    '🥭', 2),
('Mil',        'mil',        '🌾', 3),
('Manioc',     'manioc',     '🥔', 4);


-- ============================================================
-- DONNÉES DE TEST — Utilisateurs
-- (Les mots de passe seront hashés par bcrypt dans l'API)
-- ============================================================
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, telephone, adresse) VALUES
('Système',  'Admin',    'admin@afrimarket.com',    '$2b$10$exemple_hash_admin',       'admin',      '770000000', 'Dakar, Plateau'),
('Diallo',   'Moussa',   'moussa@afrimarket.com',   '$2b$10$exemple_hash_producteur',  'producteur', '771234567', 'Thiès, Médina Fall'),
('Sow',      'Fatou',    'fatou@afrimarket.com',    '$2b$10$exemple_hash_producteur2', 'producteur', '772345678', 'Kaolack, Médina'),
('Ndiaye',   'Ibrahima', 'ibrahima@afrimarket.com', '$2b$10$exemple_hash_acheteur',    'acheteur',   '773456789', 'Dakar, Parcelles Assainies');


-- ============================================================
-- DONNÉES DE TEST — Produits
-- ============================================================
INSERT INTO produits (producteur_id, categorie_id, libelle, description, prix_unitaire, unite, quantite_disponible, quantite_min_commande, region, ville, date_recolte, date_expiration) VALUES
(2, 6,  'Tomates fraîches', 'Tomates bien mûres récoltées ce matin',  800.00, 'kg',  500, 5,  'Thiès',   'Thiès',   '2025-06-10', '2025-06-20'),
(2, 7,  'Oignons violets',  'Oignons de qualité export',             1200.00, 'kg',  300, 10, 'Thiès',   'Thiès',   '2025-06-08', '2025-07-08'),
(3, 9,  'Mil local',        'Mil traditionnel séché et propre',       450.00, 'sac', 100, 1,  'Kaolack', 'Kaolack', '2025-05-30', '2025-12-30'),
(3, 10, 'Manioc blanc',     'Manioc frais déterré aujourd\'hui',      350.00, 'kg',  200, 10, 'Kaolack', 'Kaolack', '2025-06-12', '2025-06-19');
