# 🧪 Test du Worker - Vérifier les POST

## Problème identifié
Les logs ne montrent que des **GET** alors que les soumissions de formulaire devraient être des **POST**.

## ✅ Actions immédiates

### 1. Vérifier que le Worker est déployé avec le code optimisé

**Dans Cloudflare Dashboard :**
1. Workers & Pages > `reach-1to1-lp` > **Quick Edit**
2. Vérifiez que le code contient :
   - `function checkDuplicate` (ligne ~35)
   - `function markAsSubmitted` (ligne ~68)
   - `console.log('[API_CALL]` (plusieurs occurrences)
3. **Si ce n'est pas le cas** :
   - Copiez TOUT le contenu de `cloudflare-worker.js` (fichier local)
   - Collez dans Quick Edit
   - Cliquez **Save and Deploy**

### 2. Tester un POST manuel

**Ouvrez votre terminal et exécutez :**

```bash
curl -X POST https://reach-1to1-lp.webdev-939.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com"}'
```

**Résultat attendu :**
- Si le Worker fonctionne : `{"success":true,"id":"rec..."}`
- Si erreur : `{"error":"..."}`

**Ensuite :**
1. Retournez dans Cloudflare Dashboard > Workers & Pages > `reach-1to1-lp` > Observability > Events
2. Cliquez sur **Refresh** ou attendez quelques secondes
3. **Vous devriez voir un nouveau log avec :**
   - **Trigger**: `POST /` (pas GET)
   - **Origin**: `fetch`

**Si vous ne voyez toujours pas de POST dans les logs :**
- Les logs ne capturent peut-être pas les POST (problème de configuration)
- Essayez de cliquer sur un log existant pour voir les détails
- Vérifiez dans l'onglet **Invocations** au lieu de **Events**

### 3. Vérifier les logs détaillés (console.log)

**Dans Cloudflare Dashboard :**
1. Workers & Pages > `reach-1to1-lp` > Observability
2. Allez dans l'onglet **Queries** ou **Invocations**
3. Cherchez les logs avec `[API_CALL]`

**Ou utilisez la recherche :**
- Dans la barre de recherche, tapez : `[API_CALL]`
- Vous devriez voir les logs détaillés avec email, IP, origin, etc.

### 4. Vérifier les métriques du Worker

**Dans Cloudflare Dashboard :**
1. Workers & Pages > `reach-1to1-lp` > **Metrics**
2. Regardez le graphique **Requests**
3. Comparez avec le nombre d'appels API Airtable

**Si les métriques montrent plus de requests que les logs :**
- Les logs ne capturent peut-être pas tous les événements
- Vérifiez les filtres dans Observability

## 🔍 Hypothèses sur les +59 appels API

Si les logs ne montrent pas de POST, les appels peuvent venir de :

1. **Un autre Worker** (vérifiez s'il y a d'autres Workers dans votre compte)
2. **Appels directs à Airtable** (mais on a vérifié, il n'y en a pas dans le code)
3. **Le Worker redémarre souvent** (le cache mémoire est perdu, les doublons ne sont plus détectés)
4. **Les logs ne capturent pas les POST** (problème de configuration Cloudflare)

## 🎯 Prochaines étapes

1. ✅ Vérifier que le code optimisé est déployé (Quick Edit)
2. ✅ Tester un POST manuel avec curl
3. ✅ Vérifier si le POST apparaît dans les logs
4. ✅ Chercher `[API_CALL]` dans les logs détaillés
5. ✅ Comparer les métriques Requests avec les logs

Une fois ces tests faits, on pourra identifier précisément d'où viennent les appels API.



