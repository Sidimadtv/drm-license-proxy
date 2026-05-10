module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DRM License Proxy</title>
    <style>
        body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; background: #fafafa; }
        .card { background: white; padding: 25px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        code { background: #272822; color: #f8f8f2; padding: 4px 8px; border-radius: 4px; font-family: monospace; }
        pre code { display: block; padding: 15px; overflow-x: auto; }
        h1 { color: #333; }
        .status { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🔐 DRM License Proxy</h1>
        <p>Status: <span class="status">🟢 Active</span></p>
        <hr>
        <h3>Usage</h3>
        <p>Append your DRM license URL as the target parameter:</p>
        <code>https://\${req.headers.host}/proxy?target=https://your-drm-server.com</code>
        
        <h3>Example (Shaka Player)</h3>
        <pre><code>player.configure({
  drm: {
    servers: {
      'com.widevine.alpha': 'https://\${req.headers.host}/proxy?target=' + licenseUrl
    }
  }
});</code></pre>
    </div>
</body>
</html>`;
  res.status(200).send(html);
};
