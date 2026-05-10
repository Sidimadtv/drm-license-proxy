const fetch = require('node-fetch');

module.exports = async (req, res) => {
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
    const forwardHeaders = {
      ...req.headers,
      'host': new URL(target).host
    };

    delete forwardHeaders.cookie;
    delete forwardHeaders['content-length'];
    
    const body = req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined;

    const upstream = await fetch(target, {
      method: req.method,
      headers: forwardHeaders,
      body: body,
      redirect: 'follow'
    });

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-length') {
        res.setHeader(key, value);
      }
    });

    const buffer = await upstream.buffer();
    res.send(buffer);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error: ' + err.message);
  }
};
