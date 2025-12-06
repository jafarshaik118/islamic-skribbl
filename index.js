const express = require('express');
const ngrok = require('@ngrok/ngrok');
const path = require('path');
const getPort = require('get-port').default;

const app = express();

// Serve the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

(async () => {
  try {
    // Find a free port (default 3000)
    const PORT = await getPort({ port: 3000 });

    // Start Express server
    app.listen(PORT, async () => {
      console.log(`📍 Local: http://localhost:${PORT}`);

      // Connect ngrok
      let url;
      try {
        url = await ngrok.connect({
          addr: PORT
          // Do NOT include authtoken here if you already ran
          // `ngrok config add-authtoken YOUR_TOKEN`
        });
        console.log(`🌍 Ngrok tunnel live at: ${url}`);
      } catch (ngrokErr) {
        console.error('❌ Ngrok connection failed:', ngrokErr.message);
        console.error('Make sure you have installed ngrok and added your authtoken.');
      }
    });

  } catch (err) {
    console.error('❌ Error starting server:', err);
  }
})();
