# drm-license-proxy
# DRM License Proxy  A simple Express.js server to proxy Widevine DRM license requests to bypass CORS or add headers.  ## 🚀 Deploy to Railway  1. Create a [Railway](https://railway.app) account (GitHub login works). 2. Click **New Project** → **Deploy from GitHub Repo**. 3. Upload this repo to your GitHub first. 4. Set the Start Command to:



https://drm-license-proxy.vercel.app/proxy?target=https%3A%2F%2Flicense.provider.com%2Fwidevine


curl -i -X POST "https://drm-license-proxy.vercel.app/proxy?target=https://httpbin.org/post" -H "Content-Type: application/octet-stream" -d "DRM_CHALLENGE_DATA"


curl -i -X POST "https://drm-license-proxy.vercel.app/proxy?target=https://httpbin.org/post" -d "DRM_DATA_TEST"


curl -i -X POST "https://drm-license-proxy.vercel.app/proxy?target=https://httpbin.org/post" -H "Content-Type: application/octet-stream" -d "DRM_BINARY_DATA"
