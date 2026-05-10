const fetch = require('node-fetch');

export const config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const target = req.query.target;
  
  // STOP THE LOOP: If target is missing or pointing to itself, error out.
  if (!target || target.includes('drm-license-proxy.vercel.app')) {
    return res.status(400).send('Invalid Target: Cannot proxy to self or empty URL');
  }

  try {
    const targetUrl = new URL(target);
    const chunks = [];
    for await (const chunk of req) { chunks.push(chunk); }
    const rawBody = Buffer.concat(chunks);

    // CLEAN HEADERS: Remove Vercel internal headers that cause loops
    const forwardHeaders = {};
    Object.keys(req.headers).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (!['host', 'connection', 'content-length', 'x-vercel-id', 'x-vercel-proxy-signature'].includes(lowerKey)) {
        forwardHeaders[key] = req.headers[key];
      }
    });

    // FORCE target host
    forwardHeaders['host'] = targetUrl.host;

    const response = await fetch(target, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? rawBody : undefined,
      redirect: 'manual' // Don't let it loop automatically
    });

    res.status(response.status);
    const buffer = await response.buffer();
    res.send(buffer);

  } catch (err) {
    res.status(500).send('Proxy Error: ' + err.message);
  }
};
