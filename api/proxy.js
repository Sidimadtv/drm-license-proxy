const fetch = require('node-fetch');

export const config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async (req, res) => {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const target = req.query.target;
  if (!target) return res.status(400).send('Missing target URL');

  try {
    // 2. Collect Binary Body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    // 3. Prepare Headers
    const forwardHeaders = { ...req.headers };
    delete forwardHeaders.host;
    delete forwardHeaders.connection;
    delete forwardHeaders['content-length'];

    // 4. Forward Request
    const response = await fetch(target, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? rawBody : undefined
    });

    // 5. Return Response
    res.status(response.status);
    const buffer = await response.buffer();
    res.send(buffer);
  } catch (err) {
    res.status(500).send('Vercel Proxy Error: ' + err.message);
  }
};
