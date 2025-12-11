/**
 * Cloudflare Worker pour proxy Airtable API
 * 
 * Déployer ce worker sur Cloudflare :
 * 1. Allez dans Cloudflare Dashboard > Workers & Pages
 * 2. Créez un nouveau Worker
 * 3. Collez ce code
 * 4. Configurez les variables d'environnement (secrets) :
 *    - AIRTABLE_BASE_ID
 *    - AIRTABLE_TABLE_ID
 *    - AIRTABLE_API_TOKEN
 * 5. Déployez et notez l'URL du worker (ex: https://your-worker.your-subdomain.workers.dev)
 */

export default {
  async fetch(request, env) {
    // CORS headers pour permettre les requêtes depuis votre domaine
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // ⚠️ Remplacez par votre domaine en production
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // Gérer les requêtes OPTIONS (preflight CORS)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Seules les requêtes POST sont autorisées
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    try {
      // Récupérer les variables d'environnement
      const baseId = env.AIRTABLE_BASE_ID;
      const tableId = env.AIRTABLE_TABLE_ID;
      const apiToken = env.AIRTABLE_API_TOKEN;

      // Vérifier que les variables sont configurées
      if (!baseId || !tableId || !apiToken) {
        console.error('Missing Airtable configuration');
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
      const { fullName, email } = body;

      // Validation basique
      if (!email || !fullName) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: fullName and email' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Préparer le record Airtable avec le mapping
      const airtableRecord = {
        fields: {
          [fieldMapping.fullName]: fullName,
          [fieldMapping.email]: email,
          [fieldMapping.source]: 'free_guide_landing_page',
          [fieldMapping.submittedAt]: new Date().toISOString()
        }
      };

      // Appel à l'API Airtable
      const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableId}`;
      const airtableResponse = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(airtableRecord)
      });

      // Vérifier la réponse Airtable
      if (!airtableResponse.ok) {
        const errorText = await airtableResponse.text();
        console.error('Airtable API error:', airtableResponse.status, errorText);
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to submit to Airtable',
            details: errorText
          }),
          { 
            status: airtableResponse.status,
            headers: corsHeaders 
          }
        );
      }

      // Succès
      const airtableData = await airtableResponse.json();
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
      console.error('Worker error:', error);
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

