# Liste de tâches — Application simple

Petit projet web pour gérer une liste de tâches locale. L'objectif : une application légère, lisible et facile à modifier — idéale pour apprendre ou personnaliser.

## Ce que fait l'application
- Ajouter une tâche via un modal propre (titre + description).
- Modifier une tâche directement dans la liste (édition inline avec Sauver / Annuler).
- Supprimer une tâche.
- Marquer une tâche comme faite (case à cocher).
- Sauvegarde automatique des tâches dans le stockage local du navigateur (localStorage).
- Templates HTML séparés (components/) et styles modernes responsive.
- Comportements utiles : fermeture du modal avec Échap, clic en dehors pour fermer, validation minimale du titre.

## Structure du projet
- src/index.html — page principale.
- src/css/styles.css — styles et mise en page.
- src/js/app.js — logique : ajout, édition inline, suppression, persistance.
- src/components/modal.html — template du modal d'ajout.
- src/components/task-item.html — template d'une entrée de tâche.
- package.json — scripts & dépendances

## Installation & exécution
Rien de obligatoire côté serveur : il suffit d'ouvrir la page.
1. Ouvrir `src/index.html` directement dans votre navigateur.