export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, clientId, clientSecret, redirectUri } = req.body;

  if (!code || !clientId || !clientSecret || !redirectUri) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const tokenResponse = await fetch('https://accounts.stockx.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({
        error: data.error || 'Failed to exchange code for tokens',
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Token exchange error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
