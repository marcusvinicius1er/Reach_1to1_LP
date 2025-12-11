# Configuration du mapping des champs Airtable

## 📋 Champs par défaut

Le Worker utilise ces noms de champs par défaut dans Airtable :
- `Full Name` → Nom complet
- `Email` → Email
- `Source` → Source (toujours "free_guide_landing_page")
- `Submitted At` → Date de soumission

## 🔧 Si vos champs ont des noms différents

Si vos champs dans Airtable ont des noms différents, vous devez configurer le mapping dans Cloudflare.

### Étapes :

1. **Dans Cloudflare Dashboard** > Workers & Pages > votre worker > **Settings** > **Variables**

2. **Ajoutez ces variables** (type **Text** ou **Secret**, selon votre préférence) :
   - `AIRTABLE_FIELD_FULLNAME` = nom exact de votre champ "Nom complet"
   - `AIRTABLE_FIELD_EMAIL` = nom exact de votre champ "Email"
   - `AIRTABLE_FIELD_SOURCE` = nom exact de votre champ "Source"
   - `AIRTABLE_FIELD_SUBMITTED_AT` = nom exact de votre champ "Date de soumission"

### Exemple :

Si vos champs s'appellent :
- `Nom` (au lieu de "Full Name")
- `E-mail` (au lieu de "Email")
- `Origine` (au lieu de "Source")
- `Date` (au lieu de "Submitted At")

Alors configurez :
- `AIRTABLE_FIELD_FULLNAME` = `Nom`
- `AIRTABLE_FIELD_EMAIL` = `E-mail`
- `AIRTABLE_FIELD_SOURCE` = `Origine`
- `AIRTABLE_FIELD_SUBMITTED_AT` = `Date`

## ⚠️ Important

- **Respectez la casse** : Les noms de champs sont sensibles à la casse
- **Espaces** : Si votre champ a des espaces, incluez-les exactement
- **Caractères spéciaux** : Si votre champ a des caractères spéciaux, copiez-collez exactement

## 🧪 Tester

Après configuration, testez avec :
```bash
curl -X POST https://reach-1to1-lp.webdev-939.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com"}'
```

Si ça fonctionne, vous devriez voir le record dans Airtable avec les bons champs remplis.

