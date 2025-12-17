/**
 * Cloudflare Worker pour A/B Testing
 * Route le trafic entre index.html (Variante A) et index-b.html (Variante B)
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Ne traiter que la route racine "/"
    if (url.pathname !== '/' && url.pathname !== '/index.html') {
      // Pour toutes les autres routes, laisser passer normalement
      return env.ASSETS.fetch(request);
    }
    
    // Récupérer ou créer un cookie de variante
    const cookie = request.headers.get('Cookie') || '';
    let variant = getCookie(cookie, 'ab_variant');
    
    // Si pas de cookie, assigner une variante selon le split (50/50)
    if (!variant) {
      // Utiliser un hash de l'IP + User-Agent pour la cohérence
      const identifier = request.headers.get('CF-Connecting-IP') + 
                        (request.headers.get('User-Agent') || '');
      const hash = simpleHash(identifier);
      
      // 50/50 split : hash % 2 === 0 = Variante A, sinon Variante B
      variant = (hash % 2 === 0) ? 'A' : 'B';
    }
    
    // Déterminer quel fichier servir
    const fileToServe = variant === 'A' ? '/index.html' : '/index-b.html';
    
    // Créer une nouvelle requête pour le fichier approprié
    const newUrl = new URL(request.url);
    newUrl.pathname = fileToServe;
    const newRequest = new Request(newUrl, request);
    
    // Récupérer la réponse depuis les assets
    const response = await env.ASSETS.fetch(newRequest);
    
    // Cloner la réponse pour pouvoir modifier les headers
    const newResponse = new Response(response.body, response);
    
    // Définir le cookie pour maintenir la cohérence (30 jours)
    const cookieValue = `ab_variant=${variant}; Path=/; Max-Age=2592000; SameSite=Lax`;
    newResponse.headers.set('Set-Cookie', cookieValue);
    
    // Ajouter un header pour le debugging (optionnel)
    newResponse.headers.set('X-AB-Variant', variant);
    
    return newResponse;
  }
};

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

