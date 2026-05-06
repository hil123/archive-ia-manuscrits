# Archive-IA Manuscrits — Cahier des charges (V1)

## Contexte
Archive-IA Manuscrits est une application web visant à aider un utilisateur à **importer des pages manuscrites (image/PDF)**, à **visualiser une page** dans un éditeur, et à **corriger une transcription IA simulée ligne par ligne** afin d’exporter un texte final.

## Périmètre V1 (MVP)
### Objectifs fonctionnels
L’utilisateur doit pouvoir :
1. **Voir un dashboard** listant ses projets de manuscrits.
2. **Créer un projet** (titre, description optionnelle).
3. **Uploader** une image (JPG/PNG) ou un PDF (une ou plusieurs pages).
4. **Afficher une page manuscrite** dans un éditeur (viewer + zone de travail).
5. **Voir une transcription IA simulée** (mock) **ligne par ligne**.
6. **Corriger chaque ligne** (édition inline).
7. **Sauvegarder les corrections** (local/mocks; persistance simple).
8. **Exporter le texte** final du projet en **TXT**.

### Hors périmètre V1
- Authentification/gestion des rôles.
- Collaboration temps réel.
- IA réelle (OCR/LLM), alignement avancé, détection de lignes.
- Stockage objet cloud et base de données distante (Supabase/PostgreSQL) — prévu plus tard.
- Recherche plein texte, tags, métadonnées riches, versioning avancé.

## Parcours utilisateur (V1)
1. Landing (optionnel) → **Dashboard**
2. Dashboard → **Créer un projet**
3. Projet → **Uploader** un fichier
4. Projet → Liste des pages → **Ouvrir une page**
5. Page/éditeur → Visualisation + **transcription mock** → corrections → **sauvegarde**
6. Projet → **Exporter TXT**

## Exigences UI/UX
- Interface claire, moderne, responsive.
- Éditeur : viewer page (zoom/fit) + panneau transcription.
- Transcription : liste de lignes avec état (non modifiée/modifiée), navigation clavier possible.
- Actions explicites : “Sauvegarder”, “Exporter TXT”.
- États : chargement, erreur d’upload, aucun fichier, aucune page.

## Données (V1)
### Entités (modèle logique)
- **Project**
  - id, title, description?, createdAt, updatedAt
- **Document**
  - id, projectId, filename, type(image|pdf), createdAt
- **Page**
  - id, documentId, pageIndex, imageUrl/localRef
- **TranscriptionLine**
  - id, pageId, order, aiText (mock), correctedText, status

### Persistance V1
- Stockage local (ex. `localStorage` / IndexedDB) ou fichiers mock côté backend.
- Backend expose une API stable “comme si” la DB existait.

## Contraintes techniques (stack)
- Frontend : **React + Vite + TypeScript + Tailwind CSS**
- Backend : **Python FastAPI**
- DB : **Supabase/PostgreSQL plus tard** (pas en V1)
- IA : **mock** (service simulé, déterministe)

## API attendue (contractuelle, V1)
Sans figer les routes, l’API doit couvrir :
- Projets : création, liste, détail
- Upload : dépôt fichier, création document/pages
- Pages : récupérer image/preview, récupérer transcription (mock), sauvegarder corrections
- Export : générer un TXT (par projet et/ou par document)

## Qualité & sécurité (V1)
- Validation des fichiers uploadés (taille, type MIME, extension).
- Limites raisonnables (taille max, nombre de pages).
- Pas de secrets en clair dans le repo.

## Critères d’acceptation (V1)
- Un utilisateur peut créer un projet, uploader un PDF, ouvrir une page, corriger 10 lignes, sauvegarder, recharger la page et retrouver les corrections, puis exporter un fichier TXT cohérent.

