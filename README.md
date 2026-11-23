# SCHOOLPAY — Plateforme SaaS de Gestion Scolaire, des Écolages et des Finances

> **Marché de lancement :** Togo (Lomé, Kara, etc.) & Zone UEMOA / Afrique francophone  
> **Devise :** Franc CFA (XOF) • **Fuseau horaire :** Africa/Lomé (GMT+0)  
> **Intégrations :** WhatsApp Click-to-Chat & Cloud API, Mobile Money (TMoney Togocom, Flooz Moov Africa), Reçus PDF officiels, Exports Excel (.xlsx).

---

## 1. Présentation Générale

**SCHOOLPAY** est une application SaaS B2B / B2C complète destinée aux établissements scolaires privés (maternelles, primaires, collèges, lycées). 

Elle digitalise et fiabilise l'intégralité du cycle financier des écoles :
1. **Facturation scolaire & Échéanciers :** Découpage en tranches configurables (ex: 30% - 40% - 30%).
2. **Guichet de Caisse Rapide :** Prise en charge des versements partiels et complets en Espèces, TMoney, Flooz, Virement bancaire ou Chèque.
3. **Reçus Officiels Infalsifiables :** Numérotation séquentielle unique, filigrane « PAYÉ », code QR d'authenticité et format standard imprimable A5.
4. **Relances WhatsApp en 1 Clic :** Bouton vert WhatsApp devant chaque élève, normalisation du numéro (+228...), et 5 modèles de messages préremplis personnalisables.
5. **Isolation Multi-Tenant Étanche :** Cloisonnement total des données par `tenant_id` vérifié côté serveur. Deux écoles ne peuvent jamais voir ou modifier leurs données respectives.
6. **5 Espaces & Rôles Dédiés :** Super-Administrateur SaaS, Administrateur d'Établissement, Directeur, Comptable / Caisse et Espace Parent.

---

## 2. Comptes de Démonstration (5 Rôles + Isolation)

| Rôle | Email | Mot de passe | Périmètre & Accès |
| :--- | :--- | :--- | :--- |
| **1. Super-Administrateur** | `superadmin@schoolpay.tg` | `SuperAdmin2025!` | Console SaaS globale, MRR, gestion des écoles, activation/suspension, formules d'abonnements, tickets support. |
| **2. Admin Établissement** | `admin@larenaissance.tg` | `AdminRenaissance2025!` | Gestion de l'école (Renaissance), classes, frais, personnel, inscriptions élèves, exports Excel. |
| **3. Directeur** | `directeur@larenaissance.tg` | `Directeur2025!` | Supervision exécutive, taux de recouvrement, effectifs, graphiques comparatifs Recharts, dettes. |
| **4. Comptable / Caisse** | `comptable@larenaissance.tg` | `Comptable2025!` | Guichet rapide d'encaissement, génération de reçus PDF, suivi des impayés, bouton vert WhatsApp. |
| **5. Parent d'Élève** | `parent.mensah@gmail.com` | `Parent2025!` | Consultation stricte de ses propres enfants (Elom & Emmanuelle), échéancier, reçus téléchargeables. |
| **Test d'Isolation (École B)** | `admin@saintjoseph.tg` | `AdminSaintJoseph2025!` | Administrateur Collège & Lycée Saint-Joseph (ne voit aucune donnée de Renaissance). |

---

## 3. Architecture Technique

- **Frontend :** Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Backend :** Next.js API Routes sécurisées, architecture modulaire REST.
- **Sécurité & Sessions :** Tokens JWT signés HMAC-SHA256 (`jose`), cookies HTTP-Only `SameSite=Lax`, hachage `bcryptjs`, RBAC strict côté serveur.
- **Base de Données & Multi-Tenancy :** Schéma Prisma 27 entités (`prisma/schema.prisma`), moteur transactionnel avec calcul strict côté serveur et support natif PostgreSQL / SQLite.
- **Documents & Exports :** Reçus A5 haute fidélité avec mise en page print CSS et exportateurs Excel XLSX natifs (`xlsx`).

---

## 4. Installation & Démarrage Rapide

### Prérequis
- Node.js 18.17+ ou 20+
- npm ou pnpm ou yarn

### Instructions

```bash
# 1. Cloner ou ouvrir le répertoire du projet
cd schoolpay

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env

# 4. Initialiser la base de données Prisma (Optionnel si SQLite dev)
npx prisma db push

# 5. Lancer le serveur de développement
npm run dev
```

L'application est disponible immédiatement sur : **`http://localhost:3000`**

---

## 5. Validation de la Suite des 10 Tests Obligatoires

Accédez directement à la page **`/tests`** (`http://localhost:3000/tests`) ou cliquez sur le bouton vert **« Suite de Tests (10/10) »** sur la page d'accueil pour exécuter et vérifier les 10 scénarios :

1. **TEST 1 — Isolation Multi-Tenant :** Vérifie que les données de l'École Renaissance et de l'École Saint-Joseph sont 100% cloisonnées.
2. **TEST 2 — Permissions Serveur :** Bloque l'accès des parents aux URL administratives et restreint leur champ de vision à leurs enfants rattachés.
3. **TEST 3 — Paiement Partiel :** Enregistre 30 000 + 40 000 + 30 000 FCFA sur une facture de 100 000 FCFA et valide le solde à 0 FCFA.
4. **TEST 4 — Dette & Impayé :** Constate automatiquement 65 000 FCFA de dette restante sur une facture de 125 000 FCFA après 60 000 FCFA d'acompte.
5. **TEST 5 — Unicité des Reçus :** Valide la numérotation séquentielle `REC-2024-REN-XXXX` sans doublon possible.
6. **TEST 6 — Passerelle WhatsApp :** Vérifie la normalisation du numéro togolais `+228XXXXXXXX` et la génération du lien Click-to-Chat `https://wa.me/...`.
7. **TEST 7 — Abonnements SaaS :** Vérifie l'activation de la Formule Professionnelle (35 000 FCFA/mois).
8. **TEST 8 — Suspension Sécurisée :** Suspend un établissement et vérifie que l'accès financier est bloqué sans suppression de données.
9. **TEST 9 — Concordance Comptable :** Compare les totaux des tableaux de bord avec la somme exacte des transactions en base.
10. **TEST 10 — Responsive Mobile :** Validation multi-écrans pour smartphones Android et iPhone.

---

## 6. Structure des Dossiers

```
schoolpay/
├── prisma/
│   └── schema.prisma          # Schéma de base 27 entités (Multi-tenant)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page publique & sélecteur de rôles
│   │   ├── login/page.tsx     # Connexion sécurisée avec pré-remplissage démo
│   │   ├── superadmin/        # Espace Super-Admin (MRR, Écoles, Abonnements, Support)
│   │   ├── admin/             # Espace Admin Établissement (Élèves, Frais, Staff)
│   │   ├── director/          # Espace Directeur (Supervision, Recouvrement, Recharts)
│   │   ├── accounting/        # Espace Comptable (Guichet Caisse, WhatsApp, Dettes)
│   │   ├── parent/            # Espace Parent (Mes Enfants, Échéanciers, Reçus)
│   │   ├── receipt/[id]/      # Reçu officiel imprimable A5 avec QR Code
│   │   ├── tests/page.tsx     # Interface d'exécution des 10 tests obligatoires
│   │   └── api/               # API Routes REST sécurisées
│   ├── components/            # Navbar, Sidebar, WhatsAppModal, PaymentModal, StatsCard
│   └── lib/                   # Base de données, Auth JWT, Formatters XOF, WhatsApp
└── README.md
```
