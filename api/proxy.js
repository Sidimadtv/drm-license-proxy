const fetch = require('node-fetch');

export const config = {
  api: {
    bodyParser: false, // MANDATORY: Stops Vercel from messing with DRM bytes
  },
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const target = req.query.target;
  if (!target) return res.status(400).send('Missing target');

  try {
    const targetUrl = new URL(target);
    
    // 1. Collect raw bytes without letting Vercel parse them
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    // 2. Clean headers to keep the DRM server happy
    const cleanHeaders = {};
    const blacklist = [
        'host', 'connection', 'content-length', 
        'x-vercel-id', 'x-vercel-proxy-signature', 
        'x-vercel-proxied-for', 'forwarded'
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

    // 4. Return the response exactly as it came from the license server
    res.status(response.status);
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);

    const buffer = await response.buffer();
    res.send(buffer);

  } catch (err) {
    res.status(500).send('Proxy Error: ' + err.message);
  }
};
