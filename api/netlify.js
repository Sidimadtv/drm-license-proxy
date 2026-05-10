const fetch = require('node-fetch');

// NEW: Use the Netlify export style
exports.handler = async (event, context) => {
    // Check if it's an OPTIONS request (CORS)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': '*'
            }
        };
    }

    const target = event.queryStringParameters.target;
    if (!target) return { statusCode: 400, body: 'Missing target' };

    try {
        const targetUrl = new URL(target);
        
        // 1. Handle incoming Body (Base64 for binary DRM data)
        let rawBody = event.body;
        if (event.isBase64Encoded && event.body) {
            rawBody = Buffer.from(event.body, 'base64');
        }

        // 2. Clean headers
        const cleanHeaders = {};
        const blacklist = ['host', 'connection', 'content-length', 'forwarded', 'via', 'x-nf-client-connection-ip'];
        
        Object.keys(event.headers).forEach(key => {
            if (!blacklist.includes(key.toLowerCase())) {
                cleanHeaders[key] = event.headers[key];
            }
        });
        cleanHeaders['host'] = targetUrl.host;

        // 3. Make the Request
        const response = await fetch(target, {
            method: event.httpMethod,
            headers: cleanHeaders,
            body: (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') ? rawBody : undefined,
            redirect: 'follow'
        });

        const responseBuffer = await response.buffer();
        
        // 4. Return to Netlify (must be Base64 for binary support)
        return {
            statusCode: response.status,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': response.headers.get('content-type') || 'application/octet-stream'
            },
            body: responseBuffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (err) {
        return { statusCode: 500, body: 'Netlify Proxy Error: ' + err.message };
    }
};
