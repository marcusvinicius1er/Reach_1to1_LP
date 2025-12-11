# Debug : Données n'arrivent pas dans Airtable

## 🔍 Étapes de diagnostic

### 1. Vérifier les logs dans la console du navigateur

1. Ouvrez la console (F12)
2. Soumettez le formulaire
3. Regardez les logs qui commencent par `[Free Guide]`
4. Notez les erreurs éventuelles

### 2. Vérifier les secrets dans Cloudflare

Dans Cloudflare Dashboard > Workers & Pages > votre worker > Settings > Variables :

✅ Vérifiez que ces 3 secrets existent (type **Encrypted/Secret**) :
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TABLE_ID`
- `AIRTABLE_API_TOKEN`

⚠️ **Important** : Les secrets doivent être de type **Secret** (encrypted), pas "Text" ou "JSON"

### 3. Vérifier les noms de champs dans Airtable

Votre table Airtable doit avoir ces champs **exactement** (respecter la casse) :
- `Full Name` (Single line text)
- `Email` (Email)
- `Source` (Single line text)
- `Submitted At` (Date & time ou Single line text)

⚠️ Si vos champs ont des noms différents, il faut modifier le Worker.

### 4. Tester le Worker directement

Testez avec curl ou Postman :

```bash
curl -X POST https://reach-1to1-lp.webdev-939.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com"}'
```

Réponse attendue :
```json
{"success":true,"id":"recXXXXXXXXXXXXXX"}
```

Si erreur, vérifiez :
- Les secrets sont bien configurés
- Les noms de champs correspondent
- Le Base ID et Table ID sont corrects

### 5. Vérifier les logs du Worker

Dans Cloudflare Dashboard > Workers & Pages > votre worker > Logs :
- Regardez les requêtes récentes
- Vérifiez s'il y a des erreurs

### 6. Vérifier le Base ID et Table ID

**Base ID** : Dans l'URL Airtable `https://airtable.com/appXXXXXXXXXXXXXX/...`
- Le Base ID est `appXXXXXXXXXXXXXX`

**Table ID** : 
- Option 1 : Dans l'URL de la table `https://airtable.com/appXXX/tblYYYYY/...`
- Option 2 : Utilisez le **nom de la table** (ex: "Free Guide Submissions")

⚠️ Le Worker accepte soit le Table ID (`tblXXX`) soit le nom de la table

## 🔧 Solutions courantes

### Erreur : "Server configuration error"
→ Les secrets ne sont pas configurés ou mal nommés

### Erreur : "Failed to submit to Airtable" avec code 422
→ Les noms de champs ne correspondent pas

### Erreur : "Failed to submit to Airtable" avec code 401
→ Le token API est invalide ou expiré

### Erreur : "Failed to submit to Airtable" avec code 404
→ Le Base ID ou Table ID est incorrect

## 📝 Checklist

- [ ] Les 3 secrets sont configurés dans Cloudflare (type Secret)
- [ ] Les noms de champs dans Airtable correspondent exactement
- [ ] Le Base ID est correct
- [ ] Le Table ID ou nom de table est correct
- [ ] Le token API est valide (pas expiré)
- [ ] Les logs dans la console montrent une réponse du Worker
- [ ] Le Worker retourne `{"success":true}`

