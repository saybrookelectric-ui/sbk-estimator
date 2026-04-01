// netlify/functions/qb-token.js
// Proxies token exchange with Intuit — required because Intuit blocks direct browser calls (CORS)
// This function runs server-side on Netlify, so CORS is not an issue

const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // CORS headers — allow your Netlify domain
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const { code, redirect_uri, code_verifier, refresh_token, grant_type, client_id, client_secret } = JSON.parse(event.body || '{}');

    if (!client_id || !client_secret) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing client_id or client_secret' }) };
    }

    const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

    let body;
    if (grant_type === 'refresh_token') {
      if (!refresh_token) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing refresh_token' }) };
      body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token });
    } else {
      if (!code || !redirect_uri || !code_verifier) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code, redirect_uri, or code_verifier' }) };
      }
      body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri, code_verifier });
    }

    const response = await fetch(QB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: data.error || 'Token exchange failed', detail: data }),
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal error', detail: err.message }),
    };
  }
};
