export default function handler(req, res) {
  if (req.method === 'POST') {
    // Simulated Widevine response — replace with real DRM logic if needed
    console.log('Received Widevine request:', req.body);

    res.status(200).json({
      status: 'success',
      message: 'Widevine license endpoint is working!',
    });
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
