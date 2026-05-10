# drm-license-proxy
# DRM License Proxy  A simple Express.js server to proxy Widevine DRM license requests to bypass CORS or add headers.  ## 🚀 Deploy to Railway  1. Create a [Railway](https://railway.app) account (GitHub login works). 2. Click **New Project** → **Deploy from GitHub Repo**. 3. Upload this repo to your GitHub first. 4. Set the Start Command to:

https://sidcdmproxy.bysidimad.workers.dev/?target=https://your-actual-license-server.com/path



https://sidcdmproxy.bysidimad.workers.dev/?target=URL_ENCODED_LICENSE_URL



https://drm-license-proxy.vercel.app/proxy?target=https%3A%2F%2Flicense.provider.com%2Fwidevine
https://drmmm.netlify.app/
Your DRM Proxy is now fully operational. You can plug https://drmmm.netlify.app/proxy?target= into any player and start streaming!

Cmd tests

curl -i -X POST "https://drm-license-proxy.vercel.app/proxy?target=https://httpbin.org/post" -H "Content-Type: application/octet-stream" -d "DRM_CHALLENGE_DATA"


curl -i -X POST "https://drm-license-proxy.vercel.app/proxy?target=https://httpbin.org/post" -d "DRM_DATA_TEST"


curl -i -X POST "https://drm-license-proxy.vercel.app/proxy?target=https://httpbin.org/post" -H "Content-Type: application/octet-stream" -d "DRM_BINARY_DATA"





🛠️ How to generate this yourself

Don't try to type the % codes manually! You can use these two easy ways:

Option A: Using the Browser Console

    Press F12 in Chrome.

    Type: encodeURIComponent("YOUR_LICENSE_URL")

    Copy the result and paste it after ?target=

Option B: In your code (Recommended)
JavaScript

const licenseServer = "https://your-drm-provider.com/get?key=abc";
const proxyUrl = `https://sidcdmproxy.bysidimad.workers.dev/?target=${encodeURIComponent(licenseServer)}`;

console.log(proxyUrl);

Why we do this (Visually)

If you don't encode, the browser thinks the & symbols in your license URL belong to the Cloudflare Worker, not the Target. Encoding "hides" them until they reach your proxy script,
