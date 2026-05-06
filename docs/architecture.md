# Architecture — Archive-IA Manuscrits (V1)

## Objectif d’architecture
Permettre de livrer rapidement un MVP avec une **API stable** et des **services mockés**, tout en gardant une trajectoire simple vers une persistance Supabase/PostgreSQL et une IA réelle.

## Structure du repository (demandée)
```
archive-ia-manuscrits/
  frontend/
  backend/
  database/
  docs/
```

## Frontend (React + Vite + TS + Tailwind)
### Responsabilités
- Routing : Dashboard / Projet / Éditeur
- Gestion d’état UI : projet courant, pages, lignes de transcription
- Appels API : couche `apiClient` (fetch) + mapping DTO
- Composants : viewer de page + liste éditable de lignes

### Découpage recommandé (à créer lors de l’implémentation)
- `src/pages/*` : pages (Dashboard, Project, Editor)
- `src/components/*` : UI (PageViewer, TranscriptLine, Toolbar)
- `src/services/*` : `projectsService`, `uploadService`, `transcriptionService`
- `src/lib/*` : utils, types, validation

## Backend (FastAPI)
### Responsabilités
- API REST pour projets/documents/pages/transcriptions
- Upload & validation de fichiers
- Stockage local V1 : répertoire `backend/data/` (ou similaire)
- Génération de transcription mock (déterministe; ex: par hash du fichier/page)
- Export TXT

### Contraintes V1
- Pas de DB externe
- Storage : local uniquement
- IA : mock

## Données & persistance (V1)
### Stratégie
- **Option 1 (simple)** : JSON sur disque (projets + lignes) + fichiers uploadés dans un dossier `uploads/`
- **Option 2 (plus robuste)** : SQLite locale (sans Supabase) pour préparer la migration SQL

La V1 peut démarrer avec Option 1 puis migrer vers Option 2 si besoin.

## Contrat API (principes)
- Ressources : `projects`, `documents`, `pages`, `transcriptions`, `exports`
- DTOs versionnés implicitement par la V1 (stabilité)
- Upload via `multipart/form-data`
- Export TXT via endpoint retournant `text/plain` ou un téléchargement

## “Mock IA” (V1)
### Exigences
- Génération ligne par ligne
- Reproductible (même entrée → même sortie)
- Ne bloque pas l’UX (pagination/stream simulé possible)

### Approche
- À la demande : quand une page est ouverte, le backend renvoie une liste de `TranscriptionLine` (ex. 20–80 lignes).
- Le frontend affiche un effet “streaming” (progressif) **sans WebSocket** en V1 (simple simulation côté client).

## Migration vers Supabase/PostgreSQL (plus tard)
### Principes
- Garder les IDs stables (UUID)
- Extraire un repository layer côté backend
- Remplacer le storage local par Postgres + storage objet

