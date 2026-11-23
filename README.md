# ECOPAY (ECO & FRAIS) — Plateforme SaaS de Gestion Scolaire & Recouvrement

> **Marché de référence :** Togo (Lomé, Kara, etc.) & Zone UEMOA / Afrique francophone  
> **Devise :** Franc CFA (XOF) • **Fuseau horaire :** Africa/Lomé (GMT+0)  
> **Intégrations :** WhatsApp Click-to-Chat & Cloud API, Mobile Money (TMoney, Flooz), Reçus PDF officiels, Exports Excel (.xlsx).

---

## 1. Présentation Générale

**ECO & FRAIS (ECOPAY)** est une application SaaS B2B / B2C complète destinée aux établissements scolaires privés (maternelles, primaires, collèges, lycées). 

Elle digitalise et fiabilise l'intégralité du cycle financier des écoles :
1. **Facturation scolaire & Échéanciers :** Découpage en tranches configurables (ex: 30% - 40% - 30%).
2. **Guichet de Caisse Rapide :** Prise en charge des versements partiels et complets en Espèces, TMoney, Flooz, Virement bancaire ou Chèque.
3. **Reçus Officiels Infalsifiables :** Numérotation séquentielle unique, filigrane « PAYÉ », code QR d'authenticité et format standard imprimable A5.
4. **Relances WhatsApp en 1 Clic :** Bouton vert WhatsApp devant chaque élève, normalisation du numéro (+228...), et modèles de messages préremplis personnalisables.
5. **Portail Parent WhatsApp :** Accès direct pour les parents via vérification OTP WhatsApp, sans mot de passe complexe à mémoriser.
6. **Isolation Multi-Tenant Étanche :** Cloisonnement total des données par établissement (`tenant_id`) vérifié côté serveur. Deux écoles ne peuvent jamais voir ou modifier leurs données respectives.
7. **Formules d'Abonnement Simples :** Formule Mensuelle (5 000 FCFA/mois) et Annuelle (50 000 FCFA/an).

---

## 2. Architecture Technique

- **Frontend :** Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Mobile :** Application Android native compilée via Capacitor.
- **Backend :** Next.js API Routes sécurisées, architecture modulaire REST.
- **Sécurité & Sessions :** Tokens JWT signés HMAC-SHA256 (`jose`), cookies HTTP-Only `SameSite=Lax`, hachage `bcryptjs`, RBAC strict côté serveur.
- **Base de Données & Multi-Tenancy :** Schéma Prisma 27 entités (`prisma/schema.prisma`), moteur transactionnel avec calcul strict côté serveur et support natif PostgreSQL / SQLite.
- **Documents & Exports :** Reçus A5 haute fidélité avec mise en page print CSS et exportateurs Excel XLSX natifs (`xlsx`).

---

## 3. Installation & Démarrage

### Prérequis
- Node.js 18.17+ ou 20+
- npm ou pnpm ou yarn

### Lancement en Développement
```bash
# Installation des dépendances
npm install

# Démarrage du serveur local
npm run dev
```

L'application est accessible à l'adresse : `http://localhost:3000`

### Compilation de Production
```bash
npm run build
npm run start
```

---

## 4. Licence & Propriété
© 2025-2026 ECO & FRAIS (ECOPAY). Tous droits réservés.
Application professionnelle de gestion scolaire & financière.
