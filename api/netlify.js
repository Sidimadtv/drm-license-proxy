const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Target extraction (Netlify's bridge populates req.query)
  const target = req.query.target;
  if (!target) return res.status(400).send('Missing target');

  try {
    const targetUrl = new URL(target);
    
    // 1. Collect raw bytes (Crucial for DRM)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    // 2. Clean headers to avoid conflicts
    const cleanHeaders = {};
    const blacklist = [
        'host', 'connection', 'content-length', 
        'x-vercel-id', 'x-vercel-proxy-signature', 
        'x-vercel-proxied-for', 'forwarded',
        'x-nf-client-connection-ip', 'x-nf-parameters'
    ];

    Object.keys(req.headers).forEach(key => {
      if (!blacklist.includes(key.toLowerCase())) {
        cleanHeaders[key] = req.headers[key];
      }
    });

    // 3. Set the correct target Host
    cleanHeaders['host'] = targetUrl.host;

    const response = await fetch(target, {
      method: req.method,
      headers: cleanHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? rawBody : undefined,
      redirect: 'follow'
    });

    // 4. Send Response back to client
    res.status(response.status);
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);

    const buffer = await response.buffer();
    res.send(buffer);

  } catch (err) {
    res.status(500).send('Netlify Proxy Error: ' + err.message);
  }
};
