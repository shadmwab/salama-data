# 🌍 Salama Data

> **Plateforme humanitaire IA pour la gestion des personnes déplacées en RDC**  
> Développée par **Umande Investment Limited** · Goma, Nord-Kivu, République Démocratique du Congo

[![Deploy](https://img.shields.io/badge/Production-salama--data.onrender.com-1D9E75?style=flat-square)](https://salama-data.onrender.com)
[![API](https://img.shields.io/badge/API-salama--data--api.onrender.com-1A4B7A?style=flat-square)](https://salama-data-api.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-BA7517?style=flat-square)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11-0D2E4E?style=flat-square)](https://python.org)
[![React](https://img.shields.io/badge/React-18-1A4B7A?style=flat-square)](https://react.dev)

---

## 🎯 Problème résolu

Dans l'Est du Congo, des centaines de milliers de personnes fuient les conflits chaque semaine. Sans système d'enregistrement centralisé :

- Les déplacés **n'existent pas officiellement** → pas d'aide ciblée
- Les mêmes familles reçoivent **plusieurs aides** pendant que d'autres n'en reçoivent aucune
- Les ONG travaillent en **silos** avec des données Excel fragmentées
- Les décisions se prennent sur des **rapports vieux de 3 semaines**
- Les agents collectent sur **papier** et saisissent ensuite manuellement

**Salama Data résout ces 5 problèmes simultanément.**

---

## ✨ Fonctionnalités principales

### 📋 Collecte terrain
- Formulaire 5 sections offline-first (fonctionne sans internet)
- Photo CNI + GPS automatique
- Groupes vulnérables (femmes enceintes, enfants non accompagnés...)
- 5 besoins prioritaires : eau, alimentation, abri, santé, éducation
- Synchronisation automatique à la reconnexion
- Import CSV / XLSForm ODK compatible

### 👥 Gestion des bénéficiaires
- Détection automatique des doublons (CNI + nom + zone)
- Fiche bénéficiaire complète avec historique d'aide
- Vérification d'identité
- Suppression sécurisée avec confirmation

### 🏥 Coordination humanitaire
- Module Personnel de Santé (médecins, infirmiers, sages-femmes)
- Système d'affectation par zone
- Zones & Criticité (ratio déplacés/personnel → 🟢🟠🔴)
- Carte Leaflet interactive en temps réel
- Ressources locales (eau, nourriture, abris, écoles)

### 🤖 Intelligence Artificielle
- **Agent IA Groq LLaMA 3.3 70B** avec accès aux données réelles
- Réponses contextuelles précises : *"Combien de femmes enceintes à Masisi ?"*
- Notifications IA automatiques (7 types d'alertes)
- Graphique radar des ressources locales
- Prédictions et recommandations basées sur les données

### 📊 Dashboard & Rapports
- Statistiques temps réel par organisation
- Carte Leaflet zones colorées par criticité
- **Rapport PDF automatique type UNHCR** (en-tête + tableaux + analyse)
- Export des données

### 🔐 Sécurité & Administration
- JWT tokens + bcrypt passwords
- **3 rôles** : Admin / Manager / Agent terrain
- **Isolation stricte** par organisation (UNICEF ne voit pas les données NRC)
- Panel admin : approbation organisations, gestion utilisateurs
- Historique des opérations (audit logs)
- Reset mot de passe par email
- Suppression sécurisée avec confirmation double

### 🌐 Accessibilité
- **Multilingue** : Français / English / Kiswahili / Lingala
- **PWA** installable sur mobile
- **Mode hors ligne complet** + sync automatique
- Interface optimisée terrain (agents peu alphabétisés)
- Icônes SVG professionnelles sans emojis

---

## 🏗️ Architecture technique

```
salama-data/
├── backend/
│   ├── main.py          # FastAPI — 1900+ lignes, toutes les routes
│   ├── models.py        # SQLAlchemy — 12 tables
│   ├── auth.py          # JWT + bcrypt
│   ├── agent.py         # Groq LLaMA integration
│   ├── email_service.py # Resend emails
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx              # Routing + auth + notifications
    │   ├── LanguageContext.jsx  # Multilingue
    │   ├── translations.js      # FR/EN/SW/LN
    │   ├── offline.js           # IndexedDB offline
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── Icons.jsx        # 40+ icônes SVG
    │   │   └── Logo.jsx
    │   └── pages/
    │       ├── Dashboard.jsx
    │       ├── Collecte.jsx     # Formulaire + Import CSV
    │       ├── Beneficiaires.jsx
    │       ├── Personnel.jsx
    │       ├── Affectations.jsx
    │       ├── Zones.jsx
    │       ├── Agent.jsx        # Chat IA
    │       ├── Admin.jsx
    │       ├── Historique.jsx
    │       ├── Profil.jsx
    │       ├── Login.jsx
    │       ├── ForgotPassword.jsx
    │       ├── ResetPassword.jsx
    │       └── JoinRequest.jsx
    └── public/
        └── _redirects
```

---

## 🗄️ Base de données — 12 tables

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs, rôles, organisation |
| `organisations` | Organisations humanitaires |
| `org_requests` | Demandes d'accès en attente |
| `beneficiaires` | Personnes déplacées enregistrées |
| `personnel_sante` | Médecins et agents de santé |
| `affectations` | Déploiement personnel par zone |
| `zones` | Zones d'intervention avec GPS |
| `notifications` | Alertes IA générées |
| `ressources_locales` | Eau/nourriture/abris/écoles |
| `password_resets` | Tokens reset mot de passe |
| `audit_logs` | Historique de toutes les actions |
| `sessions_collecte` | Sessions de collecte terrain |

---

## 🚀 Installation locale

### Prérequis
- Python 3.11+
- Node.js 18+
- PostgreSQL (ou SQLite pour le dev)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
```

Crée un fichier `.env` :

```env
GROQ_API_KEY=your_groq_api_key
RESEND_API_KEY=your_resend_api_key
SUPER_ADMIN_EMAIL=your@email.com
APP_URL=http://localhost:5173
DATABASE_URL=sqlite:///./salama.db
SECRET_KEY=your_secret_key
```

Démarre le backend :

```bash
uvicorn main:app --reload
```

L'API sera disponible sur `http://localhost:8000`  
Documentation Swagger : `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
```

Crée un fichier `.env` :

```env
VITE_API_URL=http://localhost:8000
```

Démarre le frontend :

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

---

## 🌐 Déploiement production (Render.com)

### Backend (Web Service)
```
Root Directory    : backend
Build Command     : pip install -r requirements.txt
Start Command     : uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
Runtime           : python-3.11.0
```

Variables d'environnement à configurer sur Render :
```
GROQ_API_KEY
RESEND_API_KEY
SUPER_ADMIN_EMAIL
APP_URL
DATABASE_URL          # Internal PostgreSQL URL
SECRET_KEY
```

### Frontend (Static Site)
```
Root Directory    : frontend
Build Command     : npm install && npm run build
Publish Directory : dist
```

### Base de données
- PostgreSQL sur Render (plan Free)
- Migration automatique au démarrage via `init_db()`

---

## 🔑 Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | admin@salama-data.org | Salama2026! |
| Manager | jean.mutombo@salama-data.org | Manager2026! |
| Agent terrain | marie.kavira@salama-data.org | Agent2026! |

> ⚠️ Changer ces mots de passe en production

---

## 📱 Flux utilisateur

```
Organisation fait une demande
        ↓
Admin approuve → compte Manager créé
        ↓
Manager crée ses agents terrain
        ↓
Agents collectent sur le terrain (offline)
        ↓
Sync automatique → données dans le système
        ↓
Manager analyse via Dashboard + Agent IA
        ↓
Rapport PDF généré automatiquement
```

---

## 🤖 Agent IA — Exemples de questions

L'Agent IA a accès aux **données réelles** de votre organisation :

```
"Combien de bénéficiaires avons-nous enregistrés ?"
"Quelles zones sont les plus critiques ?"
"Combien de femmes enceintes ont besoin de soins ?"
"Quel médecin est disponible à Masisi ?"
"Donne-moi un résumé pour les donateurs"
"Quels sont les besoins en eau non couverts ?"
```

---

## 📊 Import CSV / XLSForm ODK

Salama Data accepte les fichiers CSV et XLSX avec détection automatique des colonnes.

**Colonnes reconnues pour les bénéficiaires :**
```
nom / name / last_name
prenom / first_name
age / âge
sexe / gender / sex
telephone / phone / tel
cni / id / numero_cni
zone / village / localite
site / camp / site_deplacement
besoin_eau / water
besoin_alimentation / food
besoin_abri / shelter
besoin_sante / health
besoin_education / education
```

**Colonnes reconnues pour le personnel de santé :**
```
nom / name
prenom / first_name
specialite / specialty
numero_ordre / license / registration
telephone / phone
email
zone / region
disponibilite / availability
```

---

## 🏆 Comparaison avec les solutions existantes

| Fonctionnalité | KoboToolbox | Excel/DHIS2 | **Salama Data** |
|---|---|---|---|
| Collecte offline | ✅ | ❌ | ✅ |
| Agent IA contextuel | ❌ | ❌ | ✅ |
| Multilingue Lingala/Swahili | ❌ | ❌ | ✅ |
| Coordination personnel santé | ❌ | ❌ | ✅ |
| Rapport PDF automatique | ❌ | ⚠️ | ✅ |
| Isolation multi-organisations | ❌ | ❌ | ✅ |
| Notifications IA automatiques | ❌ | ❌ | ✅ |
| Conçu pour contexte RDC | ❌ | ❌ | ✅ |

---

## 📈 Validation marché

Selon le rapport **"Comment les humanitaires utilisent-ils l'IA en 2025 ?"** (HLA & Data Friendly Space, août 2025, 2 539 répondants, 144 pays) :

- **93%** des humanitaires utilisent l'IA individuellement
- Seulement **8%** ont une intégration organisationnelle réelle
- **69%** utilisent des outils commerciaux génériques (ChatGPT, Copilot)
- **73%** identifient la formation IA comme priorité #1
- **75%** des répondants viennent d'Afrique subsaharienne, MENA, Asie-Pacifique

> Salama Data est exactement la **solution spécialisée** que ce rapport appelle à développer pour combler l'écart entre adoption individuelle et intégration organisationnelle.

---

## 🗺️ Roadmap

### v3.0 (actuel)
- ✅ Toutes les fonctionnalités core
- ✅ Agent IA avec données réelles
- ✅ Import CSV/XLSForm ODK
- ✅ PostgreSQL persistant
- ✅ Rapport PDF type UNHCR

### v4.0 (en développement)
- ⬜ Style Caméléon (thème par organisation)
- ⬜ Mapping intelligent CSV avec fuzzy matching
- ⬜ IA hybride (cloud + local pour données sensibles)
- ⬜ Export Excel bénéficiaires
- ⬜ Statistiques avancées et prédictions ML
- ⬜ Application mobile native (React Native)

### v5.0 (vision)
- ⬜ API publique pour intégrations tierces
- ⬜ Tableau de bord multi-organisations (super admin)
- ⬜ IA locale offline (LLM embarqué)
- ⬜ Intégration UNHCR / ProGres v4
- ⬜ Expansion Afrique centrale

---

## 💰 Modèle économique

| Plan | Prix | Inclus |
|------|------|--------|
| Gratuit | 0$ | 1 organisation, 500 bénéficiaires |
| ONG | 49$/mois | Illimité, support prioritaire |
| Enterprise | 199$/mois | Multi-org, API, formation |
| Gouvernement | Sur devis | Infrastructure dédiée |

---

## 👨‍💻 À propos

**Shadrack N'Sapu Mwabilwa**  
Co-fondateur — Umande Investment Limited  
Goma, Nord-Kivu, République Démocratique du Congo

- 📧 shadmwab@gmail.com
- 📱 +243 891 426 774
- 🌐 [salama-data.onrender.com](https://salama-data.onrender.com)
- 💼 [github.com/shadmwab](https://github.com/shadmwab)

**Partenaire pilote :** IHDC asbl — Judith Mwange

---

## 📄 Licence

MIT License — voir [LICENSE](LICENSE)

---

## 🙏 Remerciements

- [Groq](https://groq.com) — LLaMA 3.3 70B pour l'Agent IA
- [Resend](https://resend.com) — Service email
- [Render](https://render.com) — Hébergement
- [OpenStreetMap](https://openstreetmap.org) — Cartes Leaflet
- [Humanitarian Leadership Academy](https://humanitarianleadershipacademy.org) — Validation marché
- Toutes les ONG humanitaires qui travaillent chaque jour pour protéger les déplacés de l'Est du Congo

---

<div align="center">

**Salama Data** · Umande Investment Limited · Goma, RDC · 2026

*"Les données sont l'essence — sans elles, aucune organisation humanitaire ne peut avancer."*

