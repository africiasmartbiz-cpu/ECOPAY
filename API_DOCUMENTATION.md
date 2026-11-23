# SCHOOLPAY — Documentation des API REST

Toutes les requêtes vers l'API sont sécurisées côté serveur. Le `tenantId` est déduit **exclusivement** du token de session JWT validé, empêchant toute usurpation d'établissement par un client web ou un script externe.

---

## 1. Authentification & Sessions

### `POST /api/auth/login`
Authentifie un utilisateur et initialise le cookie de session sécurisé `schoolpay_token`.
- **Corps de la requête :**
  ```json
  {
    "email": "comptable@larenaissance.tg",
    "password": "Comptable2025!"
  }
  ```
- **Réponse succès (200) :**
  ```json
  {
    "success": true,
    "user": {
      "id": "user-comptable-ren",
      "email": "comptable@larenaissance.tg",
      "fullName": "Afiwa DOVI",
      "role": "ACCOUNTANT",
      "tenantId": "tenant-ren",
      "establishmentName": "Complexe Scolaire La Renaissance"
    },
    "redirectUrl": "/accounting"
  }
  ```

### `POST /api/auth/logout`
Détruit le cookie de session.

### `GET /api/auth/me`
Retourne le profil de l'utilisateur connecté et son établissement associé.

---

## 2. Élèves & Inscriptions

### `GET /api/students`
- **Autorisation :** `SUPER_ADMIN`, `ESTABLISHMENT_ADMIN`, `DIRECTOR`, `ACCOUNTANT`.
- **Query Params :**
  - `search` : Filtre par nom, prénom, matricule ou parent.
  - `classId` : Filtre par classe.
- **Réponse :** Liste des élèves de l'établissement avec leur situation financière (Total dû, Total versé, Solde restant, Statut).

### `POST /api/students`
- **Autorisation :** `ESTABLISHMENT_ADMIN`, `SUPER_ADMIN`.
- **Corps :**
  ```json
  {
    "firstName": "Kodjo",
    "lastName": "TCHALLA",
    "gender": "M",
    "birthDate": "2014-06-12",
    "birthPlace": "Lomé",
    "classId": "class-6eme",
    "parentName": "M. TCHALLA Paul",
    "parentPhone": "+228 90 12 34 56",
    "address": "Tokoin, Lomé"
  }
  ```

---

## 3. Encaissements & Finances (Guichet)

### `POST /api/payments`
Enregistre un paiement partiel ou complet avec calcul serveur strict et génération de reçu séquentiel unique.
- **Autorisation :** `ACCOUNTANT`, `ESTABLISHMENT_ADMIN`.
- **Corps :**
  ```json
  {
    "studentId": "student-1",
    "amount": 30000,
    "paymentMethod": "TMONEY",
    "referenceNumber": "TMON-228-89412",
    "payerName": "M. MENSAH Koffi",
    "payerPhone": "+22890112233",
    "notes": "Paiement 2ème tranche",
    "idempotencyKey": "idem-uuid-unique"
  }
  ```
- **Réponse :**
  ```json
  {
    "success": true,
    "payment": {
      "id": "pay-1731630000",
      "receiptNumber": "REC-2024-REN-0004",
      "amount": 30000,
      "paymentMethod": "TMONEY",
      "status": "VALIDATED"
    },
    "newBalance": 0
  }
  ```

---

## 4. Passerelle WhatsApp

### `POST /api/whatsapp/prepare`
Normalise le numéro du parent (+228...), compile le modèle de message avec les variables dynamiques de l'élève et génère l'URL Click-to-Chat `https://wa.me/...`.
- **Corps :**
  ```json
  {
    "studentId": "student-1",
    "templateCode": "REMINDER",
    "customMessage": ""
  }
  ```
- **Réponse :**
  ```json
  {
    "success": true,
    "url": "https://wa.me/22890112233?text=Bonjour%20cher%20parent...",
    "normalizedPhone": "+22890112233",
    "isValid": true
  }
  ```

---

## 5. Exports Excel (.xlsx)

### `GET /api/reports/export?type=students|payments|debts`
Retourne les données structurées pour conversion instantanée en fichier Excel `.xlsx`.
