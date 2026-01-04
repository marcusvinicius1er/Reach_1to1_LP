# Configuration Workers Analytics Engine pour A/B Testing

## Vue d'ensemble

Workers Analytics Engine permet de logger chaque visite avec sa variante A/B pour un monitoring précis.

## Étape 1 : Créer un Analytics Engine Dataset

1. Allez dans **Cloudflare Dashboard** > **Workers & Pages**
2. Sélectionnez votre projet Pages (ex: `reach-1to1-lp`)
3. Allez dans **Settings** > **Functions**
4. Scroll jusqu'à **Analytics Engine Bindings**
5. Cliquez sur **Add binding**
6. Configurez :
   - **Variable name** : `ANALYTICS`
   - **Dataset** : Créez un nouveau dataset ou utilisez un existant
   - **Name** : `ab_test_analytics` (ou un nom de votre choix)

## Étape 2 : Vérifier le code

Le code est déjà mis à jour dans `functions/_middleware.js` :

```javascript
if (context.env && context.env.ANALYTICS) {
  try {
    context.env.ANALYTICS.writeDataPoint({
      blobs: ['ab_test', variant],
      doubles: [Date.now()],
      indexes: [`variant_${variant}`]
    });
  } catch (error) {
    console.error('Analytics Engine error:', error);
  }
}
```

## Étape 3 : Déployer

1. Commit et push les changements :
   ```bash
   git add functions/_middleware.js
   git commit -m "Add Analytics Engine logging for A/B testing"
   git push
   ```

2. Cloudflare Pages déploiera automatiquement

## Étape 4 : Vérifier que ça fonctionne

### Option A : Via les logs Cloudflare

1. Allez dans **Workers & Pages** > Votre projet > **Logs**
2. Filtrez par `ab_test`
3. Vous devriez voir des logs pour chaque visite

### Option B : Via l'API Analytics Engine

```bash
# Récupérer les données (nécessite un token API Cloudflare)
curl -X GET "https://api.cloudflare.com/client/v4/accounts/{account_id}/analytics_engine/sql" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM ab_test_analytics WHERE timestamp > NOW() - INTERVAL 1 DAY"
  }'
```

## Structure des données loggées

Chaque visite logge :
- **blobs[0]** : `'ab_test'` (identifiant du test)
- **blobs[1]** : `'A'` ou `'B'` (la variante)
- **doubles[0]** : Timestamp Unix (millisecondes)
- **indexes[0]** : `'variant_A'` ou `'variant_B'` (pour faciliter les requêtes)

## Analyse des données

### Exemple de requête SQL

```sql
-- Nombre de visites par variante (dernières 24h)
SELECT 
  blobs[1] as variant,
  COUNT(*) as visits
FROM ab_test_analytics
WHERE blobs[0] = 'ab_test'
  AND doubles[0] > UNIX_TIMESTAMP(NOW() - INTERVAL 1 DAY) * 1000
GROUP BY blobs[1]
```

### Export vers un outil externe

Vous pouvez exporter les données vers :
- **PostHog** : Via l'API Analytics Engine
- **Google Analytics** : Via un script de synchronisation
- **Airtable** : Via un Worker dédié qui lit Analytics Engine

## Coûts

Workers Analytics Engine est **gratuit** jusqu'à :
- 1 million de requêtes écrites par mois
- 1 million de requêtes lues par mois

Au-delà, c'est $0.15 par million de requêtes.

## Dépannage

**Le logging ne fonctionne pas ?**
1. Vérifiez que le binding `ANALYTICS` est bien configuré dans Cloudflare Dashboard
2. Vérifiez les logs dans Cloudflare Dashboard > Workers & Pages > Logs
3. Vérifiez que le dataset existe et est bien lié au binding

**Les données n'apparaissent pas ?**
- Les données peuvent prendre quelques minutes à apparaître
- Vérifiez que vous interrogez le bon dataset
- Vérifiez les permissions de votre token API

