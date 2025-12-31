# Diagnostic : D'où viennent les 984 appels API Airtable ?

## 🔍 Sources possibles

### 1. **Autre projet/service utilisant le même token**
- Avez-vous d'autres sites/projets qui utilisent le même Personal Access Token Airtable ?
- Vérifiez dans Airtable Settings > Personal access tokens > Voir quels tokens sont actifs

### 2. **Automations Airtable**
- Avez-vous des automations dans Airtable qui font des appels API ?
- Vérifiez : Airtable > Base > Automations

### 3. **Webhooks Airtable**
- Avez-vous des webhooks configurés qui déclenchent des appels API ?
- Vérifiez : Airtable > Base > Extensions > Webhooks

### 4. **Tests/Debug répétés**
- Avez-vous fait beaucoup de tests avec curl/Postman ?
- Avez-vous utilisé le bouton "Retry all queued" dans l'admin panel plusieurs fois ?

### 5. **Page "online" ou autre landing page**
- Avez-vous une autre landing page (ex: pour "online") qui utilise aussi ce Worker ?
- Vérifiez si d'autres URLs appellent `https://reach-1to1-lp.webdev-939.workers.dev`

## 🔎 Comment identifier la source

### Option 1 : Vérifier les logs du Worker Cloudflare

1. Allez dans **Cloudflare Dashboard** > **Workers & Pages** > Votre Worker > **Logs**
2. Regardez les requêtes récentes
3. Notez :
   - Le nombre de requêtes
   - Les timestamps
   - Les headers (User-Agent, Origin, etc.)
   - Les payloads (emails, noms)

### Option 2 : Vérifier dans Airtable

1. Allez dans **Airtable** > **Settings** > **Usage**
2. Regardez l'historique des appels API
3. Notez les patterns (heures, jours, etc.)

### Option 3 : Ajouter du logging dans le Worker

On peut modifier le Worker pour logger plus d'informations :
- IP source
- User-Agent
- Timestamp
- Payload

## 💡 Solutions selon la source

### Si c'est un autre projet :
- Créez un **nouveau Personal Access Token** pour chaque projet
- Limitez les permissions de chaque token

### Si ce sont des automations :
- Vérifiez les automations Airtable
- Désactivez celles qui ne sont pas nécessaires
- Optimisez les automations pour réduire les appels

### Si ce sont des tests :
- Les optimisations qu'on a mises en place vont aider
- Mais il faut aussi arrêter les tests répétés

### Si c'est une autre page :
- On peut identifier quelle page en regardant les logs
- On peut ajouter un paramètre `source` dans les appels pour tracer

## 🚀 Prochaine étape

**Pouvez-vous vérifier :**
1. Les logs du Worker Cloudflare (dernières 24h)
2. Si vous avez d'autres projets qui utilisent le même token Airtable
3. Si vous avez des automations Airtable actives
4. Si vous avez fait beaucoup de tests récemment

Avec ces infos, on pourra identifier précisément la source et la solution.




