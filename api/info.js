module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>DRM License Proxy</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        code { background: #e8e8e8; padding: 2px 4px; border-radius: 3px; }
        .example { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🔐 DRM License Proxy</h1>
    <p>This proxy server helps bypass CORS restrictions for DRM license requests.</p>
    
    <h2>📡 Available Endpoints</h2>
    
    <div class="endpoint">
        <h3>Proxy Endpoint</h3>
        <p><strong>URL:</strong> <code>/proxy?target=YOUR_TARGET_URL</code></p>
        <p><strong>Methods:</strong> GET, POST, OPTIONS</p>
        <p><strong>Example:</strong> <code>/proxy?target=https://license-server.com/license</code></p>
    </div>
    
    <h2>🚀 Usage Examples</h2>
    
    <div class="example">
        <h3>JavaScript Example</h3>
        <pre><code>const proxyUrl = 'https://drm-proxy.vercel.app/proxy?target=https://license-server.com/license';
fetch(proxyUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/octet-stream',
        'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: licenseRequestBuffer
});
</code></pre>
    </div>
    
    <div class="example">
        <h3>cURL Example</h3>
        <pre><code>curl -X POST "https://drm-proxy.vercel.app/proxy?target=https://license-server.com/license" \\
     -H "Content-Type: application/octet-stream" \\
     -H "Authorization: Bearer YOUR_TOKEN" \\
     --data-binary @license_request.bin
</code></pre>
    </div>
    
    <h2>⚙️ Features</h2>
    <ul>
        <li>✅ CORS enabled for cross-origin requests</li>
        <li>✅ Supports GET, POST, and OPTIONS methods</li>
        <li>✅ Forwards headers and request body</li>
        <li>✅ Handles binary data (license requests)</li>
        <li>✅ Serverless deployment on Vercel</li>
    </ul>
    
    <p><strong>Status:</strong> 🟢 Online and ready to use</p>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
};
