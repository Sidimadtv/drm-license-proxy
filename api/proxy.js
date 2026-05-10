const fetch = require('node-fetch');

export const config = { api: { bodyParser: false } };

module.exports = async (req, res) => {
    // 1. Clean CORS for the Player
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const target = req.query.target;
    if (!target) return res.status(400).send('Missing target URL');

    try {
        const targetUrl = new URL(target);
        
        // 2. Collect the Binary DRM data
        const chunks = [];
        for await (const chunk of req) { chunks.push(chunk); }
        const rawBody = Buffer.concat(chunks);

        // 3. STRIP VERCEL INFO (This is the fix)
        const cleanHeaders = {};
        const blacklisted = [
            'host', 'connection', 'x-vercel-id', 
            'x-vercel-proxy-signature', 'x-vercel-proxied-for',
            'x-forwarded-for', 'x-forwarded-proto'
        ];

        Object.keys(req.headers).forEach(key => {
            if (!blacklisted.includes(key.toLowerCase())) {
                cleanHeaders[key] = req.headers[key];
            }
        });

        // 4. Force Target Identity
        cleanHeaders['host'] = targetUrl.host;

        // 5. Forward to the actual DRM server
        const response = await fetch(target, {
            method: req.method,
            headers: cleanHeaders,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? rawBody : undefined,
            redirect: 'follow'
        });

        // 6. Return ONLY the DRM server's response
        res.status(response.status);
        const contentType = response.headers.get('content-type');
        if (contentType) res.setHeader('content-type', contentType);
        
        const buffer = await response.buffer();
        res.send(buffer);

    } catch (e) {
        res.status(500).send("Proxy Error: " + e.message);
    }
};
