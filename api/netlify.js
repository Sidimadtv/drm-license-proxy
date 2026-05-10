const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // 1. CORS Preflight
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    const target = event.queryStringParameters.target;
    if (!target) return { statusCode: 400, headers: corsHeaders, body: 'Missing target' };

    try {
        const targetUrl = new URL(target);

        // 2. Handle incoming Body (Binary safety)
        let rawBody = event.body;
        if (event.isBase64Encoded && event.body) {
            rawBody = Buffer.from(event.body, 'base64');
        }

        // 3. UNIVERSAL BLACKLIST
        // These headers are removed to make the proxy look like a clean, direct request
        const blacklist = [
            'host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive',
            'x-nf-client-connection-ip', 'x-nf-request-id', 'x-nf-parameters', 'x-nf-account-id',
            'via', 'forwarded', 'x-forwarded-for', 'x-forwarded-proto', 'x-bb-ip',
            'cf-ray', 'cf-connecting-ip', 'x-vercel-id', 'x-vercel-proxy-signature'
        ];

        const cleanHeaders = {};
        Object.keys(event.headers).forEach(key => {
            if (!blacklist.includes(key.toLowerCase())) {
                cleanHeaders[key] = event.headers[key];
            }
        });

        // Force the Host header to match the destination
        cleanHeaders['host'] = targetUrl.host;

        // 4. Execute Proxy Request
        const response = await fetch(target, {
            method: event.httpMethod,
            headers: cleanHeaders,
            body: (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') ? rawBody : undefined,
            redirect: 'follow'
        });

        // 5. Prepare Response
        const responseBuffer = await response.buffer();
        
        // Combine Target Headers (like content-type) with our CORS headers
        const finalResponseHeaders = {
            ...corsHeaders,
            'Content-Type': response.headers.get('content-type') || 'application/octet-stream'
        };

        // 6. Return as Base64 (Essential for DRM and binary files)
        return {
            statusCode: response.status,
            headers: finalResponseHeaders,
            body: responseBuffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (err) {
        return { 
            statusCode: 500, 
            headers: corsHeaders, 
            body: 'Netlify Proxy Error: ' + err.message 
        };
    }
};
