/**
 * Cloudflare Pages Middleware pour A/B Testing
 * Route le trafic entre index.html (Variante A) et index-b.html (Variante B)
 */

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  
  // Ne traiter que la route racine "/"
  if (url.pathname !== '/' && url.pathname !== '/index.html') {
    // Pour toutes les autres routes, laisser passer normalement
    return context.next();
  }
  
  // Récupérer ou créer un cookie de variante
  const cookie = request.headers.get('Cookie') || '';
  let variant = getCookie(cookie, 'ab_variant');
  
  // Si pas de cookie, assigner une variante selon le split (50/50)
  if (!variant) {
    // Utiliser un hash de l'IP + User-Agent pour la cohérence
    const identifier = (request.headers.get('CF-Connecting-IP') || '') + 
                      (request.headers.get('User-Agent') || '');
    const hash = simpleHash(identifier);
    
    // 50/50 split : hash % 2 === 0 = Variante A, sinon Variante B
    variant = (hash % 2 === 0) ? 'A' : 'B';
  }
  
  // Déterminer quel fichier servir
  const fileToServe = variant === 'A' ? '/index.html' : '/index-b.html';
  
  // Utiliser rewrite pour changer le pathname
  const newUrl = new URL(request.url);
  newUrl.pathname = fileToServe;
  
  // Créer une nouvelle requête sans body pour éviter les problèmes
  const newRequest = new Request(newUrl.toString(), {
    method: request.method,
    headers: request.headers
  });
  
  // Récupérer la réponse depuis les assets
  const response = await context.next(newRequest);
  
  // Créer une nouvelle réponse avec les headers modifiés
  const headers = new Headers(response.headers);
  
  // Définir le cookie pour maintenir la cohérence (30 jours)
  const cookieValue = `ab_variant=${variant}; Path=/; Max-Age=2592000; SameSite=Lax`;
  headers.set('Set-Cookie', cookieValue);
  
  // Ajouter un header pour le debugging (optionnel)
  headers.set('X-AB-Variant', variant);
  
  // 📊 LOGGING : Workers Analytics Engine (si configuré)
  // Pour activer : Cloudflare Dashboard > Workers & Pages > Settings > Functions > Add binding > Analytics Engine
  if (context.env && context.env.ANALYTICS) {
    try {
      context.env.ANALYTICS.writeDataPoint({
        blobs: ['ab_test', variant],
        doubles: [Date.now()],
        indexes: [`variant_${variant}`]
      });
    } catch (error) {
      // Silently fail if Analytics Engine is not configured
      // This allows the worker to work even without Analytics Engine
      console.error('Analytics Engine error:', error);
    }
  }
  
  // Créer une nouvelle réponse avec les headers modifiés
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
  
  return newResponse;
}

/**
 * Récupère la valeur d'un cookie
 */
function getCookie(cookieHeader, name) {
  const cookies = cookieHeader.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return value;
    }
  }
  return null;
}

/**
 * Hash simple pour déterminer la variante de manière cohérente
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

