# Configuration PostHog pour A/B Testing

## Configuration requise

1. **Obtenir votre Project API Key depuis PostHog**
   - Connectez-vous à votre compte PostHog
   - Allez dans Project Settings > Project API Key
   - Copiez la clé

2. **Remplacer la clé dans les fichiers**
   - Ouvrez `index.html` et `index-b.html`
   - Cherchez `YOUR_POSTHOG_PROJECT_API_KEY`
   - Remplacez par votre vraie clé PostHog

## Variantes A/B

- **Variante A** (`index.html`) : "One-on-one expert coaching, tailored to your goals"
- **Variante B** (`index-b.html`) : "Lose up to 10kg in 12 weeks."

## Événements trackés

### Événements automatiques
- `ab_test_view` : Capturé au chargement de chaque variante
  - Propriétés : `variant` (A ou B), `page` (index.html ou index-b.html)

### Événements personnalisés
Utilisez `trackPostHog(eventName, properties)` pour tracker des événements personnalisés :

```javascript
// Exemple : tracker un clic sur un bouton
trackPostHog('cta_click', {
  button_location: 'hero_section',
  button_text: 'Fat loss Free Guide'
});
```

## Configuration Cloudflare Pages

1. **Déployer les deux fichiers**
   - `index.html` (Variante A)
   - `index-b.html` (Variante B)

2. **Configuration du split traffic**
   - Dans Cloudflare Pages, configurez le split traffic dans les paramètres
   - Définissez le pourcentage pour chaque variante (ex: 50/50)

3. **Vérification**
   - Les deux pages doivent être accessibles
   - PostHog doit recevoir les événements `ab_test_view` pour chaque variante

## Analyse des résultats

Dans PostHog, vous pouvez :
1. Créer un dashboard pour comparer les variantes
2. Filtrer par `ab_test_variant` (A ou B)
3. Comparer les métriques :
   - Taux de conversion
   - Temps sur la page
   - Taux de rebond
   - Clics sur les CTA

## Notes importantes

- Assurez-vous que PostHog est chargé avant les autres scripts de tracking
- Les événements sont automatiquement tagués avec la variante (A ou B)
- Le tracking fonctionne même si PostHog n'est pas encore chargé (les événements sont mis en queue)





