const fetch = require('node-fetch');

export const config = {
  api: {
    bodyParser: false, // Essential for binary data
  },
};

module.exports = async (req, res) => {
  // 1. Setup CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const target = req.query.target;
  if (!target) return res.status(400).send('Missing target URL');

  try {
    // 2. Parse the target URL to get the correct Hostname
    const targetUrl = new URL(target);

    // 3. Collect Body
    const chunks = [];
    for await (const chunk of req) { chunks.push(chunk); }
    const rawBody = Buffer.concat(chunks);

    // 4. CLEAN HEADERS (This is what fixes the redirect loop)
    const forwardHeaders = {};
    const sensitiveHeaders = ['host', 'cookie', 'connection', 'content-length', 'x-vercel-id', 'x-vercel-proxied-for'];
    
    Object.keys(req.headers).forEach(key => {
      if (!sensitiveHeaders.includes(key.toLowerCase())) {
        forwardHeaders[key] = req.headers[key];
      }
    });

    // Force the correct host for the target
    forwardHeaders['host'] = targetUrl.host;
    forwardHeaders['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    // 5. Fetch with specific redirect logic
    const response = await fetch(target, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? rawBody : undefined,
      redirect: 'follow',
      follow: 10 // Limit jumps to 10
    });

    // 6. Return the response
    res.status(response.status);
    
    // Copy the content-type from the destination
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);

    const buffer = await response.buffer();
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).send('Vercel Proxy Error: ' + err.message);
  }
};
