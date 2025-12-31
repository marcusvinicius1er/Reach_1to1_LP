# Configuration Cloudflare Worker pour Free Guide

## 📋 Étapes de déploiement

### 1. Créer le Worker sur Cloudflare

1. Connectez-vous à [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Allez dans **Workers & Pages** > **Create** > **Worker**
3. Donnez un nom à votre worker (ex: `free-guide-api`)
4. Collez le contenu de `cloudflare-worker.js` dans l'éditeur
5. Cliquez sur **Save and Deploy**

### 2. Configurer les variables d'environnement (Secrets)

1. Dans votre worker, allez dans **Settings** > **Variables**
2. Ajoutez ces 3 **Secrets** (pas des variables normales, mais des Secrets) :

   - **AIRTABLE_BASE_ID** : Votre Base ID Airtable (ex: `appXXXXXXXXXXXXXX`)
   - **AIRTABLE_TABLE_ID** : Votre Table ID ou nom de table (ex: `tblXXXXXXXXXXXXXX`)
   - **AIRTABLE_API_TOKEN** : Votre Personal Access Token Airtable (ex: `patXXXXXXXXXXXXXX`)

3. Pour chaque secret :
   - Cliquez sur **Add variable**
   - Sélectionnez **Encrypted** (Secret)
   - Entrez le nom et la valeur
   - Cliquez sur **Save**

### 3. Récupérer l'URL du Worker

Après le déploiement, vous verrez l'URL de votre worker :
- Exemple : `https://free-guide-api.your-subdomain.workers.dev`

### 4. Mettre à jour le code frontend

Remplacez dans **2 fichiers** :
- `index.html` (ligne ~2283)
- `admin.html` (ligne ~180)

```javascript
const CLOUDFLARE_WORKER_URL = 'https://free-guide-api.your-subdomain.workers.dev';
```

### 5. (Optionnel) Restreindre CORS

Dans `cloudflare-worker.js`, ligne 20, remplacez :
```javascript
'Access-Control-Allow-Origin': '*',
```

Par votre domaine :
```javascript
'Access-Control-Allow-Origin': 'https://votredomaine.com',
```

## 🔐 Sécurité

✅ **Token sécurisé** : Le token Airtable n'est jamais exposé côté client
✅ **CORS configuré** : Contrôle des origines autorisées
✅ **Validation** : Vérification des champs requis
✅ **Gestion d'erreurs** : Messages d'erreur clairs

## 📊 Structure de la table Airtable

Votre table doit avoir ces champs (noms exacts) :
- `Full Name` (Single line text)
- `Email` (Email)
- `Source` (Single line text)
- `Submitted At` (Date & time ou Single line text)

## 🧪 Tester le Worker

Vous pouvez tester avec curl :

```bash
curl -X POST https://free-guide-api.your-subdomain.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com"}'
```

## 📝 Notes

- Le worker est gratuit jusqu'à 100,000 requêtes/jour
- Latence typique : < 50ms
- Pas de limite de bande passante











