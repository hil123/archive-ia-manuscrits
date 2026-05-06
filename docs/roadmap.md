# Roadmap — Archive-IA Manuscrits

## V1 — MVP (objectif)
### Lot A — Socle projet
- Monorepo : `frontend/`, `backend/`, `database/`, `docs/`
- Conventions : nommage, scripts, environnement dev

### Lot B — Frontend (écrans)
- Dashboard : liste des projets + CTA création
- Création de projet : formulaire simple
- Détail projet : documents/pages + upload
- Éditeur de page : viewer + panneau transcription

### Lot C — Backend (API mock)
- CRUD projets (mock/persistance simple)
- Upload image/PDF (validation + stockage local)
- Extraction pages (PDF → images) ou mock de pages au début
- Endpoints transcription mock (génération lignes)
- Endpoints sauvegarde corrections
- Endpoint export TXT

### Lot D — Boucle qualité
- Erreurs & états UI
- Tests minimaux (API + smoke UI)
- Packaging dev (scripts, docs de lancement)

## V1.1 — UX & robustesse
- Navigation clavier / focus dans l’éditeur
- Zoom/fit page, pagination
- Autosave avec indicateur “modifié”
- Meilleure gestion des PDF multi-pages (si mock au départ)

## V2 — Persistance réelle & stockage
- Intégration Supabase/PostgreSQL
- Stockage objets (Supabase Storage ou équivalent)
- Auth (Supabase Auth) + multi-projets

## V3 — IA réelle (OCR/LLM)
- Pipeline OCR + segmentation lignes
- Alignement texte ↔ zones (optionnel)
- Historique/versions des corrections

