# SCHOOLPAY — Intégrations, Fonctionnalités Opérationnelles & Limitations

## 1. Liste des Intégrations Nécessitant des Clés API

| Service / Partenaire | Rôle & Usage | Statut Actuel | Clés & Paramètres Requis |
| :--- | :--- | :--- | :--- |
| **WhatsApp Click-to-Chat** | Envoi immédiat semi-automatisé (avec vérification humaine par le caissier) | **100% Opérationnel** | Aucune clé requise. Utilise le protocole standard `wa.me/228...` avec encodage URI conforme. |
| **WhatsApp Business Cloud API** | Envois automatisés en arrière-plan sans intervention | **Prêt pour activation** (Mode 2) | `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`. Nécessite la vérification d'entreprise Meta. |
| **TMoney Togocom (Togo)** | Encaissement Mobile Money direct | **Opérationnel au guichet** (Saisie référence & validation comptable) | Clés Marchand Togocom (`TMONEY_MERCHANT_KEY`, `TMONEY_API_SECRET`) pour déclenchement USSD automatique futur. |
| **Flooz Moov Africa (Togo)** | Encaissement Mobile Money direct | **Opérationnel au guichet** (Saisie référence & validation comptable) | Clés Partenaire Moov (`FLOOZ_PARTNER_ID`, `FLOOZ_SECURITY_KEY`) pour Push USSD futur. |
| **Passerelle SMS (Twilio / Africa's Talking)** | Envoi de SMS en cas d'absence d'internet chez le parent | **Architecture extensible prête** | `SMS_API_KEY`, `SMS_SENDER_ID` (Sender ID officiel déclaré à l'ARCEP Togo). |

---

## 2. Liste des Fonctionnalités Réellement Opérationnelles

1. **Isolation Multi-Tenant Stricte :** Déduction du `tenant_id` à partir de la session serveur, sans faire confiance au navigateur. Ségrégation complète des écoles Renaissance et Saint-Joseph.
2. **Authentification & Gestion des 5 Rôles :**
   - Redirection automatique selon le rôle (`/superadmin`, `/admin`, `/director`, `/accounting`, `/parent`).
   - Cookie HTTP-Only sécurisé et protection des routes.
3. **Gestion Scolaire Complète :**
   - Inscription des élèves avec matricule séquentiel unique normalisé.
   - Gestion des classes, niveaux (Maternelle, Primaire, Collège, Lycée) et capacités.
   - Association automatique ou création des parents/tuteurs.
4. **Moteur Financier d'Encaissement :**
   - Versements partiels et complets par tranche.
   - Déduction stricte et calcul 100% côté serveur du solde restant.
   - Protection anti double-soumission par clé d'idempotence.
   - Prise en charge des moyens : Espèces, TMoney, Flooz, Virement, Chèque.
5. **Reçus Officiels Infalsifiables (Format A5) :**
   - Génération instantanée avec numéro séquentiel unique `REC-2024-REN-XXXX`.
   - Filigrane « PAYÉ », QR code d'authenticité, cachet comptable et bouton d'impression propre.
6. **Passerelle WhatsApp Click-to-Chat :**
   - Bouton vert WhatsApp visible sur chaque ligne élève.
   - Normalisation automatique des numéros togolais au format international (+228...).
   - 5 modèles de messages dynamiques compilés avec solde en temps réel et nom de l'école.
   - Journalisation de la tentative sans prétendre à un envoi automatique non vérifié.
7. **Espace Parent Indépendant & Hermétique :**
   - Consultation des enfants rattachés uniquement.
   - Vue sur l'échéancier, les montants payés et le solde restant.
   - Téléchargement et réimpression des reçus officiels.
8. **Tableaux de Bord Graphiques & Supervision :**
   - Graphiques de recouvrement et comparatifs de classes avec Recharts.
   - Statistiques consolidées (Total facturé, Total encaissé, Taux de recouvrement, Dettes).
9. **Exports Excel (.xlsx) :**
   - Export en 1 clic de la liste des élèves, du journal des encaissements et du suivi des impayés.
10. **Console Super-Admin & Support SaaS :**
    - Gestion du parc d'écoles (activation, suspension sécurisée avec motif).
    - Suivi du MRR SaaS en FCFA.
    - Échange de messages sur les tickets d'assistance avec les directeurs.

---

## 3. Limitations Éventuelles & Perspectives d'Évolution

- **Mode Mobile Money :** Actuellement, les règlements TMoney et Flooz s'effectuent par paiement direct du parent sur le numéro marchand de l'école, suivi de l'enregistrement de la référence par le caissier. La connexion directe par Push USSD (STK Push) sera activée dès contractualisation avec Togocom et Moov Africa.
- **Stockage Fichiers (Logos/Photos) :** En environnement local/serveur unique, les fichiers sont servis statiquement. Pour un déploiement multi-serveurs à grande échelle, une intégration S3 / Cloudflare R2 est recommandée.
