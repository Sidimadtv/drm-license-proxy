export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const target = url.searchParams.get("target");

    // 1. CORS Configuration
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Credentials": "true",
    };

    // 2. Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 3. SHOW DASHBOARD (If no target provided)
    if (!target) {
      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>DRM License Proxy (Cloudflare)</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f0f2f5; }
        .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e1e4e8; }
        .endpoint { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 10px; border-left: 6px solid #f38020; }
        code { background: #2d2d2d; color: #61afef; padding: 4px 8px; border-radius: 4px; font-family: 'Consolas', monospace; }
        pre { background: #282c34; padding: 20px; border-radius: 10px; overflow-x: auto; }
        pre code { color: #abb2bf; padding: 0; background: none; }
        .example { background: #fff9db; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 6px solid #fab005; }
        h1 { color: #1a1a1a; margin-bottom: 10px; }
        .status-on { color: #40c057; font-weight: bold; background: #ebfbee; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🔐 DRM License Proxy</h1>
        <p>Status: <span class="status-on">🟢 Live on Cloudflare Edge</span></p>
        <p>This proxy server is optimized for Widevine, PlayReady, and FairPlay license requests.</p>
        
        <h2>📡 Available Endpoint</h2>
        <div class="endpoint">
            <p><strong>URL:</strong> <code>/?target=YOUR_TARGET_URL</code></p>
            <p><strong>Example:</strong> <br><code>https://sidcdmproxy.bysidimad.workers.dev/?target=https://license.server.com</code></p>
        </div>

        <h2>🚀 JavaScript Usage</h2>
        <div class="example">
            <pre><code>const proxy = 'https://sidcdmproxy.bysidimad.workers.dev/?target=';
const target = encodeURIComponent('https://license-server.com/v1/license');

fetch(proxy + target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: drmChallengeBuffer
});</code></pre>
        </div>

        <h2>⚙️ Security Features</h2>
        <ul>
            <li>✅ <strong>Zero-Logs:</strong> No request data is stored.</li>
            <li>✅ <strong>Stealth Mode:</strong> All Cloudflare "Junk" headers are stripped.</li>
            <li>✅ <strong>Spoofing:</strong> Fakes Origin/Referer to bypass domain checks.</li>
        </ul>
    </div>
</body>
</html>`;
      
      return new Response(html, {
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    // 4. PROXY MODE (Strict Stealth Logic)
    try {
      const targetUrl = new URL(target);
      const originUrl = targetUrl.protocol + "//" + targetUrl.host;

      // AGGRESSIVE BLACKLIST
      const blacklist = [
        "cf-connecting-ip", "cf-ipcountry", "cf-ray", "cf-visitor",
        "cf-worker", "cf-ew-via", "cdn-loop", "connection", 
        "content-length", "host", "forwarded", "x-forwarded-for",
        "x-forwarded-proto", "x-forwarded-host", "x-real-ip", 
        "via", "x-serve-by", "x-cache", "x-nf-request-id"
      ];

      const cleanHeaders = new Headers();
      for (const [key, value] of request.headers.entries()) {
        if (!blacklist.includes(key.toLowerCase())) {
          cleanHeaders.set(key, value);
        }
      }

      // --- THE FIX: SPOOFING ORIGIN & REFERER ---
      cleanHeaders.set("Host", targetUrl.host);
      cleanHeaders.set("Origin", originUrl);
      cleanHeaders.set("Referer", originUrl + "/");

      // Set a clean User-Agent to look like a browser
      cleanHeaders.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

      // 5. Fetch from Target
      const response = await fetch(target, {
        method: request.method,
        headers: cleanHeaders,
        body: (request.method !== "GET" && request.method !== "HEAD") ? request.body : undefined,
        redirect: "follow",
      });

      // 6. Final Header Cleanup for Response
      const responseHeaders = new Headers(response.headers);
      
      // Inject CORS back to your player
      Object.keys(corsHeaders).forEach(key => {
        responseHeaders.set(key, corsHeaders[key]);
      });

      // Remove target's security headers that might block browser playback
      responseHeaders.delete("content-security-policy");
      responseHeaders.delete("x-frame-options");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });

    } catch (err) {
      return new Response("Proxy Error: " + err.message, { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};
