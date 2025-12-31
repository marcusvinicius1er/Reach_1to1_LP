# 🔍 Diagnostic des logs Cloudflare Worker

## ⚠️ IMPORTANT : Où voir les logs du Worker

Les logs que vous voyez actuellement sont probablement ceux de **Cloudflare Pages** (GET /), pas ceux du **Worker**.

### Pour voir les logs du Worker `reach-1to1-lp` :

1. **Cloudflare Dashboard** > **Workers & Pages**
2. Cliquez sur le Worker **`reach-1to1-lp`** (pas sur Pages)
3. Allez dans l'onglet **Logs** ou **Observability** > **Logs**
4. Filtrez par :
   - **Method**: `POST` (pas GET)
   - **Status**: Tous
   - **Time range**: Dernières 24h ou 7 jours

### Ce que vous devriez voir dans les logs du Worker :

Si le Worker est bien déployé avec le code optimisé, vous devriez voir des logs avec le préfixe `[API_CALL]` :

```
[API_CALL] New submission attempt { timestamp, ip, origin, userAgent, email, ... }
[API_CALL] Airtable response: 200 { timestamp, email, status, ok }
[API_CALL] ✅ Successfully submitted to Airtable { ... }
```

Ou pour les doublons :
```
[API_CALL] [DEDUP] Email xxx already submitted 5h ago, skipping API call
```

## 🔴 Problème identifié : +59 requêtes API (984 → 1043)

### Causes possibles :

1. **Le Worker n'a pas été déployé avec le code optimisé**
   - Vérifiez dans Cloudflare Dashboard > Workers & Pages > `reach-1to1-lp` > Quick Edit
   - Le code doit contenir les fonctions `checkDuplicate` et `markAsSubmitted`
   - Le code doit avoir les logs `[API_CALL]`

2. **Les logs ne capturent pas les POST**
   - Vérifiez que les logs sont activés pour les POST (pas seulement GET)
   - Vérifiez dans `wrangler.toml` que `invocation_logs = true`

3. **Appels depuis d'autres sources** :
   - `admin.html` fait aussi des appels au Worker (pour retry les soumissions en queue)
   - Tests manuels depuis le navigateur
   - Autres scripts ou outils

4. **Le cache mémoire du Worker a été réinitialisé**
   - Si le Worker redémarre, le cache mémoire est perdu
   - Les doublons ne sont plus détectés jusqu'à ce que le cache se remplisse
   - **Solution** : Activer Cloudflare KV pour la persistance (voir ci-dessous)

## ✅ Actions immédiates

### 1. Vérifier que le Worker est déployé avec le code optimisé

Dans Cloudflare Dashboard :
- Workers & Pages > `reach-1to1-lp` > Quick Edit
- Vérifiez que le code contient :
  - `checkDuplicate` function
  - `markAsSubmitted` function
  - Logs avec `[API_CALL]`
- Si ce n'est pas le cas, copiez le contenu de `cloudflare-worker.js` et déployez

### 2. Vérifier les logs du Worker (pas Pages)

- Workers & Pages > `reach-1to1-lp` > Logs
- Filtrez par `POST` et cherchez `[API_CALL]`
- Comptez combien de logs `[API_CALL] New submission attempt` vs `[API_CALL] [DEDUP]`

### 3. Activer Cloudflare KV pour la persistance (recommandé)

Le cache mémoire est perdu à chaque redémarrage du Worker. Pour une déduplication persistante :

1. **Créer un KV Namespace** :
   - Workers & Pages > KV > Create a namespace
   - Nom : `airtable-dedup` (ou autre)
   - Cliquez sur **Add**

2. **Lier le KV au Worker** :
   - Workers & Pages > `reach-1to1-lp` > Settings > Variables
   - Scroll jusqu'à **KV Namespace Bindings**
   - Cliquez **Add binding**
   - Variable name : `DEDUP_KV`
   - KV namespace : Sélectionnez `airtable-dedup`
   - Cliquez **Save**

3. **Redéployer le Worker** :
   - Le code détecte automatiquement `env.DEDUP_KV` et l'utilise

### 4. Vérifier les appels depuis admin.html

Le fichier `admin.html` peut aussi faire des appels au Worker pour retry les soumissions en queue. Vérifiez :
- Combien de soumissions sont en queue dans LocalStorage
- Si `admin.html` est utilisé fréquemment

## 📊 Analyse des logs

Une fois que vous avez accès aux bons logs, cherchez :

1. **Ratio doublons vs nouveaux** :
   - Si beaucoup de `[DEDUP]`, c'est bon signe (la déduplication fonctionne)
   - Si peu de `[DEDUP]`, le cache ne fonctionne pas ou a été réinitialisé

2. **Erreurs Airtable** :
   - `[API_CALL] ❌ Airtable API error 422` = doublon dans Airtable (normal si le cache a été perdu)
   - `[API_CALL] ❌ Airtable API error 401` = problème de token
   - `[API_CALL] ❌ Airtable API error 404` = problème de base/table ID

3. **Origine des appels** :
   - `origin` : D'où vient l'appel (quelle page)
   - `ip` : Quelle IP (peut identifier des bots ou tests)

## 🎯 Prochaines étapes

1. ✅ Accéder aux logs du Worker (pas Pages)
2. ✅ Vérifier que le code optimisé est déployé
3. ✅ Compter les logs `[API_CALL]` vs `[DEDUP]`
4. ✅ Activer KV pour la persistance
5. ✅ Analyser l'origine des appels (origin, ip)

Une fois ces étapes faites, on pourra identifier précisément d'où viennent les 59 appels supplémentaires.



