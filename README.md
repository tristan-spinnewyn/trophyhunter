# 🏆 TrophyHunter - Chasseur de Platine Multi-Plateforme (Mobile & Web)

Application mobile PWA conçue pour les chasseurs de succès et de platine sur **Steam, Xbox Live, Epic Games Store et GOG Galaxy**, avec guides et checklists en **français**, **sans mot de passe requis**.

---

## 📱 Comment l'ouvrir sur ton smartphone

1. Assure-toi que ton téléphone est connecté au **même réseau Wi-Fi** que ton PC.
2. Ouvre le navigateur de ton téléphone (Safari sur iPhone, Chrome sur Android) et va sur :
   ```text
   http://192.168.1.17:3000
   ```
3. **Installe l'application sur ton écran d'accueil** :
   * **Sur iPhone (Safari)** : Appuie sur le bouton **Partager** (rectangle avec flèche vers le haut) puis sur **« Sur l'écran d'accueil »**.
   * **Sur Android (Chrome)** : Appuie sur les **3 petits points** en haut à droite puis sur **« Installer l'application »** ou **« Ajouter à l'écran d'accueil »**.

L'application s'ouvrira en plein écran comme une vraie application native !

---

## 🚀 Commandes utiles (avec pnpm)

Pour lancer l'application en mode développement ou production :

```bash
# Lancer le serveur de développement
pnpm dev

# Compiler pour la production
pnpm build

# Démarrer en production (optimisé et ultra rapide)
pnpm start
```

---

## ✨ Fonctionnalités incluses

* **👤 Système de Compte & Synchronisation Steam (0 Clé API)** :
  * Renseigne ton **SteamID64**, ton pseudo personnalisé ou l'URL de ton profil public.
  * Récupération automatique de ton **Avatar, Niveau Steam, Statut en ligne** et de tes **statistiques officielles** (Jeux possédés, Succès totaux, Jeux terminés à 100%, Badges, DLC, Vitrine des succès les plus rares).
  * **Import automatique de tes jeux possédés** et **cochage automatique des succès débloqués** sur toute ta bibliothèque en 1 clic !
* **🎮 Comptes Multi-Plateformes & Espaces Dédiés (Steam, Xbox, Epic Games, GOG Galaxy)** :
  * Lie tes comptes **Xbox Live**, **Epic Games Store** et **GOG Galaxy** via les APIs officielles sans saisir tes mots de passe.
  * Suis ton **Gamerscore Xbox (G)**, tes **Platines et succès XP Epic Games**, tes jeux **100% GOG**, et filtre précisément les jeux Epic avec succès vs sans succès.
* **📚 Bibliothèque « Mes Jeux Possédés »** :
  * Onglets dédiés par plateforme (*Steam, Xbox, Epic Games, GOG*) et filtres par statut (*Tous, 100% Platinés 🏆, En cours, À commencer*).
  * Ajoute n'importe quel jeu en 1 clic ou via l'outil d'**import massif Steam**.
* **🔍 Recherche instantanée & Succès 100% en français** :
  * Noms officiels, descriptions, rareté et icônes extraits directement.
* **⚠️ Détection des succès manquables & gestion des secrets** :
  * Repère automatiquement les trophées à ne pas rater pendant ton run et masque les spoilers par défaut.
* **🏆 Guides intégrés en 1 clic** :
  * Lien direct vers le guide **PSTHC** du jeu (la référence FR), **YouTube FR** et **Steam Guides**.
* **🎉 Célébration 100%, Notes & Sauvegarde JSON** :
  * Pluie de confettis au Platine, notes personnelles par succès et sauvegarde/restauration locale (`localStorage` + export JSON).

---

## 🛡️ Qualité de Code, CI & Protection de Branche

* **Protection de la branche `main`** : Aucun push direct autorisé. Tout changement passe obligatoirement par une Pull Request.
* **Intégration Continue (CI)** : Obligation d'avoir le check `ci` vert (`lint`, `tsc`, `test:coverage`, `test:diff-coverage`, `build`) avant tout merge.
* **Couverture de code >= 80%** : Vitest et le script de diff coverage vérifient qu'au moins 80% des lignes/instructions/fonctions sont couvertes par les tests unitaires.
* **Dependabot & Auto-Merge** : Surveillance automatique quotidienne des dépendances (npm/pnpm, GitHub Actions, Docker) avec approbation et merge automatique dès que la CI est verte.

