# 🚀 Guide Pas à Pas : Configuration Analytics Engine

## 📋 Prérequis
- Accès au Cloudflare Dashboard
- Votre projet Pages déjà déployé

---

## 🎯 Étape 1 : Accéder à la configuration Functions

1. **Connectez-vous à Cloudflare Dashboard**
   - URL : https://dash.cloudflare.com

2. **Naviguez vers Workers & Pages**
   - Dans le menu de gauche, cliquez sur **Workers & Pages**

3. **Sélectionnez votre projet Pages**
   - Trouvez votre projet (probablement `reach-1to1-lp` ou similaire)
   - Cliquez dessus

4. **Allez dans Settings**
   - Cliquez sur l'onglet **Settings** en haut
   - Puis cliquez sur **Functions** dans le menu de gauche

---

## 🎯 Étape 2 : Créer le Dataset Analytics Engine

1. **Trouvez la section "Analytics Engine Bindings"**
   - Scroll jusqu'à trouver cette section
   - Si elle n'existe pas, vous devrez peut-être activer Analytics Engine d'abord

2. **Cliquez sur "Add binding"** ou **"Create binding"**

3. **Configurez le binding :**
   ```
   Variable name: ANALYTICS
   ```
   ⚠️ **IMPORTANT** : Le nom doit être exactement `ANALYTICS` (en majuscules)

4. **Créez un nouveau Dataset :**
   - Si c'est la première fois, vous devrez créer un dataset
   - Cliquez sur **"Create new dataset"** ou **"New dataset"**
   - Nom du dataset : `ab_test_analytics` (ou un nom de votre choix)
   - Cliquez sur **Create** ou **Save**

5. **Sélectionnez le dataset créé** dans le dropdown

6. **Cliquez sur "Save"** ou **"Add binding"**

---

## 🎯 Étape 3 : Vérifier la configuration

Après avoir ajouté le binding, vous devriez voir :
- ✅ Variable name : `ANALYTICS`
- ✅ Dataset : `ab_test_analytics` (ou le nom que vous avez choisi)

---

## 🎯 Étape 4 : Déployer le code (automatique)

Une fois le binding configuré, Cloudflare Pages va automatiquement :
1. Détecter les changements dans `functions/_middleware.js`
2. Redéployer avec le nouveau binding

**OU** si vous préférez forcer un redéploiement :
1. Allez dans **Deployments**
2. Cliquez sur **Retry deployment** sur le dernier déploiement

---

## ✅ Vérification que ça fonctionne

### Méthode 1 : Via les logs Cloudflare

1. Allez dans **Workers & Pages** > Votre projet > **Logs**
2. Visitez votre site : https://1to1.reach.fitness
3. Rechargez la page plusieurs fois
4. Dans les logs, vous devriez voir des entrées avec `ab_test`

### Méthode 2 : Via le header X-AB-Variant

1. Ouvrez votre site dans un navigateur
2. Ouvrez DevTools (F12)
3. Onglet **Network**
4. Rechargez la page
5. Cliquez sur la requête principale (généralement `/` ou `/index.html`)
6. Regardez les **Headers** de la réponse
7. Vous devriez voir : `X-AB-Variant: A` ou `X-AB-Variant: B`

### Méthode 3 : Via les cookies

1. DevTools > **Application** > **Cookies**
2. Vous devriez voir : `ab_variant=A` ou `ab_variant=B`
3. Rechargez → le cookie doit rester le même (même variante)

---

## 🐛 Dépannage

**Je ne vois pas "Analytics Engine Bindings" dans Settings > Functions**
- Vérifiez que vous êtes bien dans un projet **Pages** (pas juste Workers)
- Analytics Engine est disponible pour Pages Functions

**Le binding ne fonctionne pas**
- Vérifiez que le nom de la variable est exactement `ANALYTICS` (majuscules)
- Vérifiez que le dataset existe et est bien sélectionné
- Redéployez manuellement le projet

**Les logs n'apparaissent pas**
- Attendez quelques minutes (les données peuvent prendre du temps à apparaître)
- Vérifiez que vous visitez bien la route `/` (pas une autre route)
- Vérifiez les logs dans Cloudflare Dashboard > Workers & Pages > Logs

---

## 📊 Structure des données loggées

Chaque visite logge automatiquement :
- **Test ID** : `ab_test`
- **Variant** : `A` ou `B`
- **Timestamp** : Date/heure de la visite
- **Index** : `variant_A` ou `variant_B` (pour faciliter les requêtes)

---

## 🎉 C'est tout !

Une fois configuré, Analytics Engine loggera automatiquement chaque visite avec sa variante A/B.

Vous pourrez ensuite analyser ces données via :
- L'API Analytics Engine
- Les logs Cloudflare
- Un export vers PostHog ou autre outil d'analyse

