/**
 * Cloudflare Worker pour proxy Airtable API - OPTIMISÉ
 * 
 * Optimisations pour réduire les appels API :
 * - Déduplication des emails (évite les doublons)
 * - Rate limiting (max 1 soumission par email toutes les 24h)
 * - Normalisation des emails (lowercase, trim)
 * 
 * Déployer ce worker sur Cloudflare :
 * 1. Allez dans Cloudflare Dashboard > Workers & Pages
 * 2. Créez un nouveau Worker
 * 3. Collez ce code
 * 4. Configurez les variables d'environnement (secrets) :
 *    - AIRTABLE_BASE_ID
 *    - AIRTABLE_TABLE_ID
 *    - AIRTABLE_API_TOKEN
 * 5. (Optionnel) Créez un KV Namespace pour la déduplication persistante :
 *    - Workers & Pages > KV > Create a namespace
 *    - Nommez-le "airtable-dedup" (ou autre)
 *    - Dans votre Worker, allez dans Settings > Variables > KV Namespace Bindings
 *    - Ajoutez le binding avec la variable "DEDUP_KV" (ou laissez vide pour utiliser le cache mémoire)
 * 6. Déployez et notez l'URL du worker
 */

// Cache en mémoire pour la déduplication (fallback si pas de KV)
// ⚠️ Ce cache est perdu à chaque redémarrage du Worker
const memoryCache = new Map();

// Normaliser l'email (lowercase, trim)
function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

// Vérifier si l'email a déjà été soumis récemment
async function checkDuplicate(email, env) {
  const normalizedEmail = normalizeEmail(email);
  const cacheKey = `submitted:${normalizedEmail}`;
  const DEDUP_TTL = 86400; // 24 heures en secondes
  
  // Si KV est disponible, l'utiliser (persistant)
  if (env.DEDUP_KV) {
    try {
      const existing = await env.DEDUP_KV.get(cacheKey);
      if (existing) {
        return { isDuplicate: true, timestamp: parseInt(existing) };
      }
    } catch (error) {
      console.error('KV error:', error);
      // Fallback sur le cache mémoire
    }
  }
  
  // Fallback : cache mémoire (perdu au redémarrage)
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    const age = Date.now() - cached;
    if (age < DEDUP_TTL * 1000) {
      return { isDuplicate: true, timestamp: cached };
    }
    // Expiré, supprimer du cache
    memoryCache.delete(cacheKey);
  }
  
  return { isDuplicate: false };
}

// Marquer l'email comme soumis
async function markAsSubmitted(email, env) {
  const normalizedEmail = normalizeEmail(email);
  const cacheKey = `submitted:${normalizedEmail}`;
  const timestamp = Date.now();
  const DEDUP_TTL = 86400; // 24 heures
  
  // Si KV est disponible, l'utiliser
  if (env.DEDUP_KV) {
    try {
      await env.DEDUP_KV.put(cacheKey, timestamp.toString(), { expirationTtl: DEDUP_TTL });
    } catch (error) {
      console.error('KV put error:', error);
    }
  }
  
  // Toujours mettre à jour le cache mémoire (fallback)
  memoryCache.set(cacheKey, timestamp);
  
  // Nettoyer le cache mémoire périodiquement (garder seulement les 1000 dernières entrées)
  if (memoryCache.size > 1000) {
    const entries = Array.from(memoryCache.entries());
    entries.sort((a, b) => b[1] - a[1]); // Trier par timestamp décroissant
    memoryCache.clear();
    entries.slice(0, 500).forEach(([key, value]) => memoryCache.set(key, value));
  }
}

// Domaines autorisés par défaut (utilisés si ALLOWED_ORIGINS n'est pas défini dans les variables du Worker)
const DEFAULT_ALLOWED_ORIGINS = [
  'https://1to1.reach.fitness',
  'https://www.1to1.reach.fitness',
  'https://fr.1to1.reach.fitness',
  'https://reach-fitness-1to1-fr.pages.dev'
];

function getAllowedOrigins(env) {
  const raw = env.ALLOWED_ORIGINS;
  if (!raw || typeof raw !== 'string') return DEFAULT_ALLOWED_ORIGINS;
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function getRequestOrigin(request) {
  const origin = request.headers.get('Origin');
  if (origin) return origin;
  const referer = request.headers.get('Referer');
  if (referer) {
    try {
      const url = new URL(referer);
      return `${url.protocol}//${url.host}`;
    } catch (_) {
      return null;
    }
  }
  return null;
}

function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return false;
  return allowedOrigins.includes(origin);
}

function corsHeadersFor(origin, allowedOrigins) {
  const allowOrigin = isOriginAllowed(origin, allowedOrigins) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

export default {
  async fetch(request, env) {
    const allowedOrigins = getAllowedOrigins(env);
    const requestOrigin = getRequestOrigin(request);

    // Rejeter les requêtes dont l'origine n'est pas autorisée (évite abus / bots depuis d'autres domaines)
    if (!isOriginAllowed(requestOrigin, allowedOrigins)) {
      console.warn('[API_CALL] Rejected: origin not allowed', {
        origin: requestOrigin,
        referer: request.headers.get('Referer')
      });
      return new Response(
        JSON.stringify({ error: 'Forbidden', message: 'Origin not allowed' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const corsHeaders = corsHeadersFor(requestOrigin, allowedOrigins);

    // Gérer les requêtes OPTIONS (preflight CORS)
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Seules les requêtes POST sont autorisées
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    try {
      // 📊 LOGGING : Identifier la source des appels
      const userAgent = request.headers.get('User-Agent') || 'unknown';
      const origin = request.headers.get('Origin') || request.headers.get('Referer') || 'unknown';
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const timestamp = new Date().toISOString();
      
      // Récupérer les variables d'environnement
      const baseId = env.AIRTABLE_BASE_ID;
      const tableId = env.AIRTABLE_TABLE_ID;
      const apiToken = env.AIRTABLE_API_TOKEN;

      // Vérifier que les variables sont configurées
      if (!baseId || !tableId || !apiToken) {
        console.error('[API_CALL] Missing Airtable configuration', { timestamp, ip, origin, userAgent });
        return new Response(
          JSON.stringify({ error: 'Server configuration error' }),
          { status: 500, headers: corsHeaders }
        );
      }

      // Mapping des champs Airtable (configurable via variables d'environnement)
      // Si les variables ne sont pas définies, utiliser les valeurs par défaut
      const fieldMapping = {
        fullName: env.AIRTABLE_FIELD_FULLNAME || 'Full Name',
        email: env.AIRTABLE_FIELD_EMAIL || 'Email',
        source: env.AIRTABLE_FIELD_SOURCE || 'Source',
        submittedAt: env.AIRTABLE_FIELD_SUBMITTED_AT || 'Submitted At'
      };

      // Parser le body de la requête
      const body = await request.json();
      let { fullName, email, source } = body;

      // Validation basique
      if (!email || !fullName) {
        console.log('[API_CALL] Missing fields', { timestamp, ip, origin, userAgent, email: email ? 'provided' : 'missing', fullName: fullName ? 'provided' : 'missing' });
        return new Response(
          JSON.stringify({ error: 'Missing required fields: fullName and email' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Normaliser l'email
      email = normalizeEmail(email);
      fullName = fullName.trim();
      
      // Déterminer la source (newsletter ou free_guide)
      // Si source n'est pas fourni, utiliser 'free_guide_landing_page' par défaut (rétrocompatibilité)
      const submissionSource = source || 'free_guide_landing_page';

      // ⚡ OPTIMISATION : Vérifier les doublons AVANT d'appeler Airtable
      // Note: On vérifie les doublons par email, peu importe la source
      const duplicateCheck = await checkDuplicate(email, env);
      if (duplicateCheck.isDuplicate) {
        const hoursAgo = Math.floor((Date.now() - duplicateCheck.timestamp) / (1000 * 60 * 60));
        console.log(`[API_CALL] [DEDUP] Email ${email} already submitted ${hoursAgo}h ago, skipping API call`, { 
          timestamp, 
          ip, 
          origin, 
          userAgent,
          email,
          fullName,
          source: submissionSource
        });
        return new Response(
          JSON.stringify({ 
            success: true,
            id: 'duplicate',
            message: 'Already submitted recently',
            skipped: true
          }),
          { 
            status: 200,
            headers: corsHeaders 
          }
        );
      }
      
      // 📊 LOGGING : Nouvel appel API (pas un doublon)
      console.log(`[API_CALL] New submission attempt`, { 
        timestamp, 
        ip, 
        origin, 
        userAgent,
        email,
        fullName: fullName.substring(0, 20) + '...', // Masquer le nom complet pour la privacy
        source: submissionSource
      });

      // Préparer le record Airtable avec le mapping
      // Note: Si "Submitted At" est un champ Date/Time automatique dans Airtable,
      // vous pouvez le retirer ou le configurer pour accepter les strings ISO
      const airtableRecord = {
        fields: {
          [fieldMapping.fullName]: fullName,
          [fieldMapping.email]: email, // Email déjà normalisé
          [fieldMapping.source]: submissionSource
        }
      };
      
      // Ajouter "Submitted At" seulement si le champ existe et accepte les strings
      // Si c'est un champ Date/Time automatique, commentez cette ligne
      if (fieldMapping.submittedAt) {
        airtableRecord.fields[fieldMapping.submittedAt] = new Date().toISOString();
      }

      // ⚡ Appel à l'API Airtable (seulement si pas de doublon)
      // ⚠️ IMPORTANT : Chaque appel compte comme 1 appel API, même en cas d'erreur
      const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableId}`;
      const airtableResponse = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(airtableRecord)
      });
      
      // 📊 LOGGING : Tous les appels API (succès ou échec)
      console.log(`[API_CALL] Airtable response: ${airtableResponse.status}`, { 
        timestamp, 
        email,
        status: airtableResponse.status,
        ok: airtableResponse.ok
      });

      // Vérifier la réponse Airtable
      if (!airtableResponse.ok) {
        const errorText = await airtableResponse.text();
        const status = airtableResponse.status;
        
        console.error(`[API_CALL] ❌ Airtable API error ${status}`, { 
          timestamp, 
          ip, 
          origin, 
          userAgent,
          email,
          error: errorText.substring(0, 200)
        });
        
        // Si erreur 422 (duplicate), marquer quand même comme soumis pour éviter les retries
        if (status === 422) {
          try {
            const errorData = JSON.parse(errorText || '{}');
            if (errorData.error?.message?.includes('duplicate') || errorData.error?.message?.includes('already exists')) {
              await markAsSubmitted(email, env);
              return new Response(
                JSON.stringify({ 
                  success: true,
                  id: 'duplicate',
                  message: 'Record already exists in Airtable',
                  skipped: true
                }),
                { 
                  status: 200,
                  headers: corsHeaders 
                }
              );
            }
          } catch (e) {
            // Ignore parse error
          }
        }
        
        // Pour les autres erreurs (401, 404, etc.), on retourne l'erreur
        // MAIS on ne fait PAS de retry automatique côté Worker
        return new Response(
          JSON.stringify({ 
            error: 'Failed to submit to Airtable',
            status: status,
            details: errorText.substring(0, 500)
          }),
          { 
            status: status,
            headers: corsHeaders 
          }
        );
      }

      // ✅ Succès : marquer l'email comme soumis pour éviter les doublons futurs
      await markAsSubmitted(email, env);
      
      const airtableData = await airtableResponse.json();
      console.log(`[API_CALL] ✅ Successfully submitted to Airtable`, { 
        timestamp, 
        ip, 
        origin, 
        userAgent,
        email,
        airtableId: airtableData.id 
      });
      
      return new Response(
        JSON.stringify({ 
          success: true,
          id: airtableData.id 
        }),
        { 
          status: 200,
          headers: corsHeaders 
        }
      );

    } catch (error) {
      const userAgent = request.headers.get('User-Agent') || 'unknown';
      const origin = request.headers.get('Origin') || request.headers.get('Referer') || 'unknown';
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      console.error('[API_CALL] ❌ Worker error:', { 
        timestamp: new Date().toISOString(),
        ip,
        origin,
        userAgent,
        error: error.message,
        stack: error.stack 
      });
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          message: error.message 
        }),
        { 
          status: 500,
          headers: corsHeaders 
        }
      );
    }
  }
};

