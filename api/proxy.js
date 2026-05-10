const fetch = require('node-fetch');

// This is mandatory for Vercel to handle raw binary DRM payloads
export const config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async (req, res) => {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const target = req.query.target;
  if (!target) {
    return res.status(400).send('Missing target URL');
  }

  try {
    // 2. Read the raw body as a Buffer (Essential for DRM)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    // 3. Prepare headers
    const forwardHeaders = { ...req.headers };
    const targetUrl = new URL(target);
    
    forwardHeaders['host'] = targetUrl.host;
    delete forwardHeaders.cookie;
    delete forwardHeaders['content-length'];
    delete forwardHeaders['connection'];

    // 4. Execute the request
    const upstream = await fetch(target, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? rawBody : undefined,
      redirect: 'follow'
    });

    // 5. Send back the response
    res.status(upstream.status);
    
    upstream.headers.forEach((value, key) => {
      // Don't forward transfer-encoding or content-length to avoid Vercel conflicts
      if (!['content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const responseData = await upstream.buffer();
    res.send(responseData);

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error: ' + err.message);
  }
};
