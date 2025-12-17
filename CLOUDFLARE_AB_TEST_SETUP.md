# Configuration A/B Testing avec Cloudflare Workers

## Vue d'ensemble

Ce Worker route automatiquement le trafic entre :
- **Variante A** (`index.html`) : "One-on-one expert coaching, tailored to your goals"
- **Variante B** (`index-b.html`) : "Lose up to 10kg in 12 weeks."

Le split est configuré à **50/50** par défaut.

## Configuration dans Cloudflare Pages

### Étape 1 : Ajouter le Worker

1. Dans votre projet Cloudflare Pages, allez dans **Settings** > **Functions**
2. Activez **Functions** si ce n'est pas déjà fait
3. Dans la section **Functions**, vous verrez un dossier `functions`

### Étape 2 : Déployer le Worker

**Option A : Via l'interface Cloudflare (recommandé)**

1. Dans Cloudflare Dashboard, allez dans **Workers & Pages**
2. Sélectionnez votre projet Pages
3. Allez dans **Settings** > **Functions**
4. Cliquez sur **Add a new function**
5. Créez un fichier `functions/_middleware.js` (ou `functions/[[path]].js` selon votre version)
6. Copiez le contenu de `ab-test-worker.js` dans ce fichier

**Option B : Via Git (automatique)**

1. Créez un dossier `functions` à la racine de votre projet
2. Copiez `ab-test-worker.js` dans `functions/_middleware.js`
3. Commit et push :
   ```bash
   git add functions/_middleware.js
   git commit -m "Add A/B testing worker"
   git push
   ```
4. Cloudflare Pages déploiera automatiquement le Worker

### Étape 3 : Vérifier le déploiement

1. Après le déploiement, visitez votre site
2. Ouvrez les DevTools (F12) > Network
3. Rechargez la page
4. Vérifiez les headers de réponse :
   - `X-AB-Variant: A` ou `X-AB-Variant: B`
   - `Set-Cookie: ab_variant=A` ou `ab_variant=B`

### Étape 4 : Tester les deux variantes

Pour tester manuellement :
- **Variante A** : Supprimez le cookie `ab_variant` et rechargez (vous pourriez avoir A ou B)
- **Variante B** : Forcez le cookie `ab_variant=B` dans les DevTools

## Personnalisation du split

Pour modifier le ratio (ex: 70% A, 30% B), modifiez la ligne dans `ab-test-worker.js` :

```javascript
// 50/50 split
variant = (hash % 2 === 0) ? 'A' : 'B';

// Pour 70/30 (A/B)
variant = (hash % 10 < 7) ? 'A' : 'B';

// Pour 80/20 (A/B)
variant = (hash % 10 < 8) ? 'A' : 'B';
```

## Cohérence des utilisateurs

Le Worker utilise :
- **Cookie** : Maintient la même variante pour un utilisateur (30 jours)
- **Hash IP + User-Agent** : Si pas de cookie, assigne de manière cohérente

Cela garantit qu'un utilisateur voit toujours la même variante.

## Monitoring

Dans PostHog, vous pouvez :
1. Filtrer par `ab_test_variant` (A ou B)
2. Comparer les métriques entre les variantes
3. Voir l'événement `ab_test_view` pour chaque variante

## Dépannage

**Le Worker ne fonctionne pas ?**
- Vérifiez que Functions est activé dans Cloudflare Pages
- Vérifiez les logs dans Cloudflare Dashboard > Workers & Pages > Logs
- Assurez-vous que le fichier est bien nommé `_middleware.js` dans `functions/`

**Les deux variantes ne s'affichent pas ?**
- Vérifiez que `index.html` et `index-b.html` sont bien dans le dépôt
- Vérifiez les headers de réponse dans les DevTools
- Testez en supprimant les cookies

