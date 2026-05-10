export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const target = url.searchParams.get("target");

    // 1. Standard CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Credentials": "true",
    };

    // 2. Handle CORS Preflight (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, { 
        headers: corsHeaders 
      });
    }

    if (!target) {
      return new Response("Missing target parameter", { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    try {
      const targetUrl = new URL(target);

      // 3. UNIVERSAL BLACKLIST
      // We strip these headers so the target server doesn't see Cloudflare/Proxy info
      const blacklist = [
        "cf-connecting-ip", 
        "cf-ipcountry", 
        "cf-ray", 
        "cf-visitor",
        "cf-worker",
        "cf-ew-via",
        "cdn-loop",
        "connection", 
        "content-length", 
        "host", 
        "x-forwarded-proto",
        "x-real-ip", 
        "x-frame-options"
      ];

      const cleanHeaders = new Headers();
      for (const [key, value] of request.headers.entries()) {
        if (!blacklist.includes(key.toLowerCase())) {
          cleanHeaders.set(key, value);
        }
      }

      // Force the Host header to match the destination server
      cleanHeaders.set("Host", targetUrl.host);

      // 4. Execute Proxy Request
      // Cloudflare streams the body automatically, keeping binary data intact
      const response = await fetch(target, {
        method: request.method,
        headers: cleanHeaders,
        body: (request.method !== "GET" && request.method !== "HEAD") ? request.body : undefined,
        redirect: "follow",
      });

      // 5. Prepare Response Headers
      const responseHeaders = new Headers(response.headers);
      
      // Inject CORS headers into the final response
      Object.keys(corsHeaders).forEach(key => {
        responseHeaders.set(key, corsHeaders[key]);
      });

      // Ensure we don't leak the target's original security headers that might break the proxy
      responseHeaders.delete("content-security-policy");
      responseHeaders.delete("x-frame-options");

      // 6. Return the streamed response
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
