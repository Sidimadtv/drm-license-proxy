export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const target = url.searchParams.get("target");

    // 1. Handle CORS Preflight
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (!target) {
      return new Response("Missing target", { status: 400, headers: corsHeaders });
    }

    try {
      const targetUrl = new URL(target);

      // 2. UNIVERSAL BLACKLIST
      // Cloudflare adds its own headers (cf-*) that we want to strip
      const blacklist = [
        "cf-connecting-ip", "cf-ipcountry", "cf-ray", "cf-visitor",
        "connection", "content-length", "host", "x-forwarded-proto",
        "x-real-ip", "x-frame-options"
      ];

      const cleanHeaders = new Headers();
      for (const [key, value] of request.headers.entries()) {
        if (!blacklist.includes(key.toLowerCase())) {
          cleanHeaders.set(key, value);
        }
      }

      // Force the Host header for the destination
      cleanHeaders.set("Host", targetUrl.host);

      // 3. Execute Proxy Request
      // We pass the request body directly as a stream (super efficient)
      const response = await fetch(target, {
        method: request.method,
        headers: cleanHeaders,
        body: (request.method !== "GET" && request.method !== "HEAD") ? request.body : undefined,
        redirect: "follow",
      });

      // 4. Return Response to Client
      const responseHeaders = new Headers(response.headers);
      
      // Inject CORS into the response from the license server
      Object.keys(corsHeaders).forEach(key => {
        responseHeaders.set(key, corsHeaders[key]);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });

    } catch (err) {
      return new Response("Cloudflare Proxy Error: " + err.message, { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  },
};
