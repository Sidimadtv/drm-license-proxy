const fetch = require('node-fetch');

export const config = { api: { bodyParser: false } };

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const target = req.query.target;
    if (!target) return res.status(400).send('Missing target URL');

    try {
        const targetUrl = new URL(target);
        const chunks = [];
        for await (const chunk of req) { chunks.push(chunk); }
        const rawBody = Buffer.concat(chunks);

        // Remove Vercel-specific headers that cause the loop
        const headers = { ...req.headers };
        delete headers.host;
        delete headers.connection;
        delete headers['x-vercel-id'];
        delete headers['x-vercel-proxy-signature'];
        delete headers['x-vercel-proxied-for'];

        const response = await fetch(target, {
            method: req.method,
            headers: {
                ...headers,
                'host': targetUrl.host, // Force target host
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: req.method !== 'GET' && req.method !== 'HEAD' ? rawBody : undefined,
            redirect: 'follow'
        });

        res.status(response.status);
        const buffer = await response.buffer();
        res.send(buffer);
    } catch (e) {
        res.status(500).send("Proxy Error: " + e.message);
    }
};
