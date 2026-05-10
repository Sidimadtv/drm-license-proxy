const fetch = require('node-fetch');

export const config = {
  api: {
    bodyParser: false, // Mandatory for binary DRM data
  },
};

module.exports = async (req, res) => {
  // 1. Set broad CORS headers to allow video players to connect
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  // Handle preflight requests
  if (req.method === 'OPTIONS') return res.status(200).end();

  const target = req.query.target;

  // 2. Safety Check: Prevent the proxy from calling itself or empty URLs
  if (!target || !target.startsWith('http')) {
    return res.status(400).json({
      error: "Invalid target. Usage: /proxy?target=https://license-server.com"
    });
  }

  try {
    // 3. Collect the Raw Binary Body (the DRM "Challenge")
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    // 4. Clean up headers to avoid conflicts with the target server
    const forwardHeaders = { ...req.headers };
    delete forwardHeaders.host;
    delete forwardHeaders.connection;
    delete forwardHeaders['content-length'];
    delete forwardHeaders['x-vercel-proxied-for'];
    delete forwardHeaders['x-vercel-id'];

    // 5. Spoof User-Agent (Fixes "403 Forbidden" on many DRM servers)
    forwardHeaders['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    // 6. Forward the request to the real DRM server
    const response = await fetch(target, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? rawBody : undefined,
      redirect: 'follow'
    });

    // 7. Pass the response back to the video player
    res.status(response.status);
    
    // Copy content-type from the target (e.g., application/octet-stream)
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);

    const buffer = await response.buffer();
    res.send(buffer);

  } catch (err) {
    console.error('Proxy logic error:', err);
    res.status(500).send('Vercel Proxy Error: ' + err.message);
  }
};
