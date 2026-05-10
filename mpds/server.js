const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (including /widevine/index.html)
app.use(express.static(path.join(__dirname)));

// Simulated Widevine endpoint (replace with real logic if needed)
app.post('/widevine', express.json(), (req, res) => {
  // Normally you would handle license challenge here
  console.log('Widevine License Request:', req.body);

  // For demo: return mock license or status
  res.status(200).json({ message: 'Widevine license endpoint is working!' });
});

// Fallback
app.use((req, res) => {
  res.status(404).send('404: Not Found');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
