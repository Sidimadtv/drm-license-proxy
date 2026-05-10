const fetch = require('node-fetch');

// CRITICAL: This tells Vercel not to mess with the binary data
export const config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async (req, res) => {
  // 1. Handle CORS
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
    // 2. Collect raw binary body from the request stream
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    // 3. Prepare headers for the upstream server
    const forwardHeaders = { ...req.headers };
    
    // Clean up headers that would confuse the target server
    delete forwardHeaders.host;
    delete forwardHeaders.cookie;
    delete forwardHeaders['content-length'];
    delete forwardHeaders['connection'];

    // 4. Fetch from the actual DRM License Server
    const upstream = await fetch(target, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? rawBody : undefined,
      redirect: 'follow'
    });

    // 5. Forward the response back to the player
    res.status(upstream.status);
    
    upstream.headers.forEach((value, key) => {
      // Don't let the upstream content-length interfere with Vercel's response
      if (key.toLowerCase() !== 'content-length') {
        res.setHeader(key, value);
      }
    });

    const responseBuffer = await upstream.buffer();
    res.send(responseBuffer);

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error: ' + err.message);
  }
};
